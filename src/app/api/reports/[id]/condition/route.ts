import { type NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@/generated/prisma/client'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { getPaintColor } from '@/lib/design-tokens'
import { prisma } from '@/lib/prisma'
import { syncReportCompletion } from '@/lib/reports/completion'
import {
	conditionPatchSchema,
	type TireInput,
	type TireSetInput,
} from '@/lib/validations/condition'

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

	const [condition, oldtimerDetails] = await Promise.all([
		prisma.vehicleCondition.findUnique({
			where: { reportId: id },
			include: {
				damageMarkers: { orderBy: { id: 'asc' } },
				paintMarkers: { orderBy: { id: 'asc' } },
				tireSets: {
					orderBy: { setNumber: 'asc' },
					include: {
						tires: { orderBy: { position: 'asc' } },
					},
				},
			},
		}),
		// Oldtimer-only, and absent on every other type.
		prisma.oldtimerDetails.findUnique({ where: { reportId: id } }),
	])

	return NextResponse.json({
		condition: condition
			? {
					id: condition.id,
					reportId: condition.reportId,
					paintType: condition.paintType,
					hard: condition.hard,
					paintCondition: condition.paintCondition,
					generalCondition: condition.generalCondition,
					bodyCondition: condition.bodyCondition,
					interiorCondition: condition.interiorCondition,
					vehicleColor: condition.vehicleColor,
					drivingAbility: condition.drivingAbility,
					specialFeatures: condition.specialFeatures,
					parkingSensors: condition.parkingSensors,
					mileageRead: condition.mileageRead,
					estimateMileage: condition.estimateMileage,
					unit: condition.unit,
					nextMot: condition.nextMot,
					fullServiceHistory: condition.fullServiceHistory,
					testDrivePerformed: condition.testDrivePerformed,
					errorMemoryRead: condition.errorMemoryRead,
					airbagsDeployed: condition.airbagsDeployed,
					emissionGroup: condition.emissionGroup,
					notes: condition.notes,
					manualSetup: condition.manualSetup,
					previousDamageReported: condition.previousDamageReported,
					damageDescription: condition.damageDescription,
					existingDamageNotReported: condition.existingDamageNotReported,
					subsequentDamage: condition.subsequentDamage,
				}
			: null,
		damageMarkers: condition?.damageMarkers ?? [],
		paintMarkers: condition?.paintMarkers ?? [],
		tireSets: condition?.tireSets ?? [],
		oldtimerDetails,
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
	const parsed = conditionPatchSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const data = parsed.data
	const results: Record<string, unknown> = {}

	// Ensure a VehicleCondition record exists for this report
	let condition = await prisma.vehicleCondition.findUnique({
		where: { reportId: id },
	})

	if (!condition) {
		condition = await prisma.vehicleCondition.create({
			data: { reportId: id },
		})
	}

	// Oldtimer grading and value-increasing features
	if (data.oldtimerDetails) {
		const oldtimerData: Record<string, unknown> = {}
		for (const [key, value] of Object.entries(data.oldtimerDetails)) {
			if (value !== undefined) oldtimerData[key] = value
		}
		results.oldtimerDetails = await prisma.oldtimerDetails.upsert({
			where: { reportId: id },
			create: { reportId: id, ...oldtimerData },
			update: oldtimerData,
		})
	}

	// Update condition fields
	if (data.condition) {
		const updateData: Record<string, unknown> = {}

		if (data.condition.paintType !== undefined) updateData.paintType = data.condition.paintType
		if (data.condition.hard !== undefined) updateData.hard = data.condition.hard
		if (data.condition.paintCondition !== undefined)
			updateData.paintCondition = data.condition.paintCondition
		if (data.condition.generalCondition !== undefined)
			updateData.generalCondition = data.condition.generalCondition
		if (data.condition.bodyCondition !== undefined)
			updateData.bodyCondition = data.condition.bodyCondition
		if (data.condition.interiorCondition !== undefined)
			updateData.interiorCondition = data.condition.interiorCondition
		if (data.condition.drivingAbility !== undefined)
			updateData.drivingAbility = data.condition.drivingAbility
		if (data.condition.vehicleColor !== undefined)
			updateData.vehicleColor = data.condition.vehicleColor
		if (data.condition.specialFeatures !== undefined)
			updateData.specialFeatures = data.condition.specialFeatures
		if (data.condition.parkingSensors !== undefined)
			updateData.parkingSensors = data.condition.parkingSensors
		if (data.condition.mileageRead !== undefined)
			updateData.mileageRead = data.condition.mileageRead
		if (data.condition.estimateMileage !== undefined)
			updateData.estimateMileage = data.condition.estimateMileage
		if (data.condition.unit !== undefined) updateData.unit = data.condition.unit
		if (data.condition.nextMot !== undefined) {
			updateData.nextMot = data.condition.nextMot ? new Date(data.condition.nextMot) : null
		}
		if (data.condition.fullServiceHistory !== undefined)
			updateData.fullServiceHistory = data.condition.fullServiceHistory
		if (data.condition.testDrivePerformed !== undefined)
			updateData.testDrivePerformed = data.condition.testDrivePerformed
		if (data.condition.errorMemoryRead !== undefined)
			updateData.errorMemoryRead = data.condition.errorMemoryRead
		if (data.condition.airbagsDeployed !== undefined)
			updateData.airbagsDeployed = data.condition.airbagsDeployed
		if (data.condition.emissionGroup !== undefined)
			updateData.emissionGroup = data.condition.emissionGroup
		if (data.condition.notes !== undefined) updateData.notes = data.condition.notes
		if (data.condition.manualSetup !== undefined)
			updateData.manualSetup = data.condition.manualSetup
		if (data.condition.previousDamageReported !== undefined)
			updateData.previousDamageReported = data.condition.previousDamageReported
		if (data.condition.damageDescription !== undefined)
			updateData.damageDescription = data.condition.damageDescription
		if (data.condition.existingDamageNotReported !== undefined)
			updateData.existingDamageNotReported = data.condition.existingDamageNotReported
		if (data.condition.subsequentDamage !== undefined)
			updateData.subsequentDamage = data.condition.subsequentDamage

		if (Object.keys(updateData).length > 0) {
			results.condition = await prisma.vehicleCondition.update({
				where: { id: condition.id },
				data: updateData,
			})
		}
	}

	// Handle damage markers
	if (data.damageMarkers) {
		const markerResults = []
		for (const marker of data.damageMarkers) {
			const { id: markerId, ...markerData } = marker
			if (markerId) {
				const existing = await prisma.damageMarker.findFirst({
					where: { id: markerId, conditionId: condition.id },
				})
				if (existing) {
					const updated = await prisma.damageMarker.update({
						where: { id: markerId },
						data: markerData,
					})
					markerResults.push(updated)
				}
			} else {
				const created = await prisma.damageMarker.create({
					data: {
						conditionId: condition.id,
						...markerData,
					},
				})
				markerResults.push(created)
			}
		}
		results.damageMarkers = markerResults
	}

	// Delete damage markers
	if (data.deleteDamageMarkerIds && data.deleteDamageMarkerIds.length > 0) {
		await prisma.damageMarker.deleteMany({
			where: {
				id: { in: data.deleteDamageMarkerIds },
				conditionId: condition.id,
			},
		})
		results.deletedDamageMarkers = data.deleteDamageMarkerIds
	}

	// Handle paint markers
	if (data.paintMarkers) {
		const paintResults = []
		for (const marker of data.paintMarkers) {
			const { id: markerId, ...markerData } = marker
			const colorValue = markerData.color ?? getPaintColor(markerData.thickness)
			if (markerId) {
				const existing = await prisma.paintMarker.findFirst({
					where: { id: markerId, conditionId: condition.id },
				})
				if (existing) {
					const updated = await prisma.paintMarker.update({
						where: { id: markerId },
						data: { ...markerData, color: colorValue },
					})
					paintResults.push(updated)
				}
			} else {
				const created = await prisma.paintMarker.create({
					data: {
						conditionId: condition.id,
						...markerData,
						color: colorValue,
					},
				})
				paintResults.push(created)
			}
		}
		results.paintMarkers = paintResults
	}

	// Delete paint markers
	if (data.deletePaintMarkerIds && data.deletePaintMarkerIds.length > 0) {
		await prisma.paintMarker.deleteMany({
			where: {
				id: { in: data.deletePaintMarkerIds },
				conditionId: condition.id,
			},
		})
		results.deletedPaintMarkers = data.deletePaintMarkerIds
	}

	// Handle tire sets. An id-less set means "make sure set N exists" — see
	// ensureTireSet — so a retried request or a client that has not yet seen the
	// server's id lands on the existing set instead of stacking a second.
	if (data.tireSets) {
		const tireSetResults = []
		for (const tireSet of data.tireSets) {
			const { id: tireSetId, tires, ...tireSetData } = tireSet
			let savedId: string
			if (tireSetId) {
				const existing = await prisma.tireSet.findFirst({
					where: { id: tireSetId, conditionId: condition.id },
				})
				if (!existing) continue
				await prisma.tireSet.update({ where: { id: tireSetId }, data: tireSetData })
				if (tires) await saveTires(tireSetId, tires)
				savedId = tireSetId
			} else {
				savedId = await ensureTireSet(condition.id, tireSetData, tires)
			}

			tireSetResults.push(
				await prisma.tireSet.findUnique({
					where: { id: savedId },
					include: { tires: { orderBy: { position: 'asc' } } },
				}),
			)
		}
		results.tireSets = tireSetResults
	}

	// Delete tire sets
	if (data.deleteTireSetIds && data.deleteTireSetIds.length > 0) {
		await prisma.tireSet.deleteMany({
			where: {
				id: { in: data.deleteTireSetIds },
				conditionId: condition.id,
			},
		})
		results.deletedTireSets = data.deleteTireSetIds
	}

	// Recompute completion and touch updatedAt in one write.
	await syncReportCompletion(id, user.id)

	return NextResponse.json(results)
}

/**
 * The id-less branch: creates set N with its tires in one write, or — when the
 * set already exists — returns it untouched apart from tires at positions it
 * lacks. The callers that send an id-less set (the first-load auto-create, "add
 * set", a retry of either) send blank defaults, so applying them onto an
 * existing set would wipe what the assessor typed.
 */
async function ensureTireSet(
	conditionId: string,
	tireSetData: Omit<TireSetInput, 'id' | 'tires'>,
	tires: TireInput[] | undefined,
): Promise<string> {
	const newTires = (tires ?? []).map(({ id: _id, ...tireData }) => tireData)
	try {
		const created = await prisma.tireSet.create({
			data: { conditionId, ...tireSetData, tires: { create: newTires } },
		})
		return created.id
	} catch (error) {
		const isDuplicateSet =
			error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
		if (!isDuplicateSet) throw error
	}

	const existing = await prisma.tireSet.findUniqueOrThrow({
		where: { conditionId_setNumber: { conditionId, setNumber: tireSetData.setNumber } },
		include: { tires: { select: { position: true } } },
	})
	const taken = new Set(existing.tires.map((tire) => tire.position))
	const missing = newTires.filter((tire) => !taken.has(tire.position))
	if (missing.length > 0) {
		await prisma.tire.createMany({
			data: missing.map((tire) => ({ tireSetId: existing.id, ...tire })),
		})
	}
	return existing.id
}

/**
 * Writes a set's tires. A tire with an id updates that row; one without lands on
 * the set's existing tire at the same position, or creates it — never a second
 * tire at a position the set already has.
 */
async function saveTires(tireSetId: string, tires: TireInput[]) {
	for (const tire of tires) {
		const { id: tireId, ...tireData } = tire
		// Scoped to the set, so a tire id from another report cannot be written through this one.
		const where = tireId ? { id: tireId, tireSetId } : { tireSetId, position: tireData.position }
		const existing = await prisma.tire.findFirst({ where, select: { id: true } })
		if (existing) {
			await prisma.tire.update({ where: { id: existing.id }, data: tireData })
		} else if (!tireId) {
			await prisma.tire.create({ data: { tireSetId, ...tireData } })
		}
	}
}

export { GET, PATCH }
