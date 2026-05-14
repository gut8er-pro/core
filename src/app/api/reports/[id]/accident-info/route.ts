import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { prisma } from '@/lib/prisma'
import { accidentInfoPatchSchema } from '@/lib/validations/accident-info'

type RouteContext = {
	params: Promise<{ id: string }>
}

async function GET(_request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id } = await context.params

	const report = await prisma.report.findFirst({
		where: { id, userId: user?.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	const [accidentInfo, claimantInfo, opponentInfo, visits, expertOpinion, signatures] =
		await Promise.all([
			prisma.accidentInfo.findUnique({ where: { reportId: id } }),
			prisma.claimantInfo.findUnique({ where: { reportId: id } }),
			prisma.opponentInfo.findUnique({ where: { reportId: id } }),
			prisma.visit.findMany({ where: { reportId: id }, orderBy: { id: 'asc' } }),
			prisma.expertOpinion.findUnique({ where: { reportId: id } }),
			prisma.signature.findMany({ where: { reportId: id }, orderBy: { id: 'asc' } }),
		])

	return NextResponse.json({
		accidentInfo,
		claimantInfo,
		opponentInfo,
		visits,
		expertOpinion,
		signatures,
	})
}

async function PATCH(request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id } = await context.params

	const report = await prisma.report.findFirst({
		where: { id, userId: user?.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	if (report.isLocked) {
		return NextResponse.json({ error: 'Report is locked' }, { status: 403 })
	}

	const body = await request.json()
	const parsed = accidentInfoPatchSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const data = parsed.data
	const results: Record<string, unknown> = {}

	if (data.accidentInfo) {
		results.accidentInfo = await prisma.accidentInfo.upsert({
			where: { reportId: id },
			create: {
				reportId: id,
				accidentDay: data.accidentInfo.accidentDay ? new Date(data.accidentInfo.accidentDay) : null,
				accidentScene: data.accidentInfo.accidentScene ?? null,
			},
			update: {
				...(data.accidentInfo.accidentDay !== undefined && {
					accidentDay: data.accidentInfo.accidentDay
						? new Date(data.accidentInfo.accidentDay)
						: null,
				}),
				...(data.accidentInfo.accidentScene !== undefined && {
					accidentScene: data.accidentInfo.accidentScene,
				}),
			},
		})
	}

	if (data.claimantInfo) {
		results.claimantInfo = await prisma.claimantInfo.upsert({
			where: { reportId: id },
			create: {
				reportId: id,
				...data.claimantInfo,
			},
			update: data.claimantInfo,
		})
	}

	if (data.opponentInfo) {
		results.opponentInfo = await prisma.opponentInfo.upsert({
			where: { reportId: id },
			create: {
				reportId: id,
				...data.opponentInfo,
			},
			update: data.opponentInfo,
		})
	}

	if (data.visits) {
		// Replace semantics: the form treats `visits` as a single source of
		// truth and re-sends the whole array on every auto-save. We do this
		// in a transaction so a partial failure can't leave duplicate rows.
		//
		// Without replace semantics each save with `id: null` produced a brand
		// new row, so a user typing 5 fields into one visit ended up with 5
		// duplicates in the DB.
		const visitResults = await prisma.$transaction(async (tx) => {
			const incoming = data.visits ?? []
			const existing = await tx.visit.findMany({
				where: { reportId: id },
				select: { id: true },
			})

			// Delete rows that aren't in the incoming payload anymore.
			const incomingIds = new Set(incoming.map((v) => v.id).filter((x): x is string => !!x))
			const toDelete = existing.filter((e) => !incomingIds.has(e.id)).map((e) => e.id)
			if (toDelete.length > 0) {
				await tx.visit.deleteMany({ where: { id: { in: toDelete }, reportId: id } })
			}

			const results = []
			for (const visit of incoming) {
				const { id: visitId, ...visitData } = visit
				const data = {
					...visitData,
					date: visitData.date ? new Date(visitData.date) : null,
				}
				if (visitId) {
					// Verify the row still belongs to this report (defence in depth).
					const owned = await tx.visit.findFirst({
						where: { id: visitId, reportId: id },
						select: { id: true },
					})
					if (owned) {
						const updated = await tx.visit.update({ where: { id: visitId }, data })
						results.push(updated)
					}
				} else {
					const created = await tx.visit.create({ data: { reportId: id, ...data } })
					results.push(created)
				}
			}
			return results
		})
		results.visits = visitResults
	}

	if (data.expertOpinion) {
		const expertData = { ...data.expertOpinion }
		const createData: Record<string, unknown> = {
			reportId: id,
			...expertData,
		}
		const updateData: Record<string, unknown> = { ...expertData }

		// Convert date strings to Date objects
		if (expertData.caseDate !== undefined) {
			const dateValue = expertData.caseDate ? new Date(expertData.caseDate) : null
			createData.caseDate = dateValue
			updateData.caseDate = dateValue
		}
		if (expertData.issuedDate !== undefined) {
			const dateValue = expertData.issuedDate ? new Date(expertData.issuedDate) : null
			createData.issuedDate = dateValue
			updateData.issuedDate = dateValue
		}

		results.expertOpinion = await prisma.expertOpinion.upsert({
			where: { reportId: id },
			create: createData as Parameters<typeof prisma.expertOpinion.upsert>[0]['create'],
			update: updateData,
		})
	}

	if (data.signatures) {
		const signatureResults = []
		for (const sig of data.signatures) {
			const { id: sigId, ...sigData } = sig
			if (sigId) {
				// Update existing signature — verify it belongs to this report
				const existing = await prisma.signature.findFirst({
					where: { id: sigId, reportId: id },
				})
				if (existing) {
					const updated = await prisma.signature.update({
						where: { id: sigId },
						data: {
							...sigData,
							signedAt: sigData.signedAt ? new Date(sigData.signedAt) : sigData.signedAt,
						},
					})
					signatureResults.push(updated)
				}
			} else {
				// Create new signature
				const created = await prisma.signature.create({
					data: {
						reportId: id,
						...sigData,
						signedAt: sigData.signedAt ? new Date(sigData.signedAt) : null,
					},
				})
				signatureResults.push(created)
			}
		}
		results.signatures = signatureResults
	}

	// Touch the report's updatedAt timestamp
	await prisma.report.update({
		where: { id },
		data: { updatedAt: new Date() },
	})

	return NextResponse.json(results)
}

export { GET, PATCH }
