import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { generateReportPdfBuffer } from '@/lib/pdf/generate-buffer'
import { parseSectionsParam, sectionsFromToggles } from '@/lib/pdf/sections'
import { prisma } from '@/lib/prisma'
import { exportConfigSchema } from '@/lib/validations/export'

type RouteContext = {
	params: Promise<{ id: string }>
}

type StoredExportConfig = {
	id: string
	reportId: string
	includeVehicleValuation: boolean
	includeCommission: boolean
	includeInvoice: boolean
	lockReport: boolean
	recipients: string[]
	recipientMode: string | null
	recipientEmail: string | null
	recipientName: string | null
	subject: string | null
	body: string | null
}

/**
 * `recipients` is the column the composer restores its chips from. The legacy
 * `recipientEmail` is still written by the send route and is the fallback for
 * reports last sent before the column existed.
 */
function serializeExportConfig(exportConfig: StoredExportConfig) {
	const stored =
		exportConfig.recipients.length > 0
			? exportConfig.recipients
			: (exportConfig.recipientEmail
					?.split(',')
					.map((email) => email.trim())
					.filter(Boolean) ?? [])

	return {
		id: exportConfig.id,
		reportId: exportConfig.reportId,
		includeValuation: exportConfig.includeVehicleValuation,
		includeCommission: exportConfig.includeCommission,
		includeInvoice: exportConfig.includeInvoice,
		lockReport: exportConfig.lockReport,
		recipients: stored,
		recipientMode: exportConfig.recipientMode,
		recipientEmail: exportConfig.recipientEmail,
		recipientName: exportConfig.recipientName,
		emailSubject: exportConfig.subject,
		emailBody: exportConfig.body,
	}
}

async function GET(request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error || !user) return unauthorizedResponse()

	const { id } = await context.params
	const { searchParams } = new URL(request.url)
	const format = searchParams.get('format')

	// If ?format=pdf, generate and return the PDF
	if (format === 'pdf') {
		try {
			// `lang` is the param the composer builds its preview links with;
			// `locale` stays accepted because the exhaustive verifier uses it.
			const locale = searchParams.get('lang') ?? searchParams.get('locale') ?? 'de'
			const storedConfig = await prisma.exportConfig.findUnique({
				where: { reportId: id },
				select: {
					includeVehicleValuation: true,
					includeCommission: true,
					includeInvoice: true,
				},
			})
			const sections = parseSectionsParam(
				searchParams.get('sections'),
				sectionsFromToggles(
					storedConfig ?? {
						includeVehicleValuation: true,
						includeCommission: true,
						includeInvoice: true,
					},
				),
			)
			const result = await generateReportPdfBuffer(id, user.id, locale, sections)
			if ('error' in result) {
				// A refused download is not a missing report — say which it is.
				if (result.missingInfo) {
					return NextResponse.json(
						{ error: result.error, missingInfo: result.missingInfo },
						{ status: 422 },
					)
				}
				return NextResponse.json({ error: result.error }, { status: 404 })
			}
			// Preview opens in a tab rather than downloading — the assessor wants
			// to look at the document, not collect a file (ticket 29).
			const disposition = searchParams.get('disposition') === 'inline' ? 'inline' : 'attachment'
			return new NextResponse(new Uint8Array(result.buffer), {
				status: 200,
				headers: {
					'Content-Type': 'application/pdf',
					'Content-Disposition': `${disposition}; filename="${result.filename}"`,
				},
			})
		} catch (pdfError) {
			console.error('PDF generation failed:', pdfError)
			return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
		}
	}

	// Default: return export config JSON
	const report = await prisma.report.findFirst({
		where: { id, userId: user.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	let exportConfig = await prisma.exportConfig.findUnique({
		where: { reportId: id },
	})

	if (!exportConfig) {
		exportConfig = await prisma.exportConfig.create({
			data: { reportId: id },
		})
	}

	return NextResponse.json(serializeExportConfig(exportConfig))
}

async function PATCH(request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error || !user) return unauthorizedResponse()

	const { id } = await context.params

	const report = await prisma.report.findFirst({
		where: { id, userId: user.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	const body = await request.json()
	const parsed = exportConfigSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const data = parsed.data
	const updateData: Record<string, unknown> = {}

	if (data.includeValuation !== undefined)
		updateData.includeVehicleValuation = data.includeValuation
	if (data.includeCommission !== undefined) updateData.includeCommission = data.includeCommission
	if (data.includeInvoice !== undefined) updateData.includeInvoice = data.includeInvoice
	if (data.lockReport !== undefined) updateData.lockReport = data.lockReport
	if (data.recipientEmail !== undefined) updateData.recipientEmail = data.recipientEmail
	if (data.recipientName !== undefined) updateData.recipientName = data.recipientName
	if (data.recipients !== undefined) updateData.recipients = data.recipients
	if (data.recipientMode !== undefined) updateData.recipientMode = data.recipientMode
	if (data.emailSubject !== undefined) updateData.subject = data.emailSubject
	if (data.emailBody !== undefined) updateData.body = data.emailBody

	const exportConfig = await prisma.exportConfig.upsert({
		where: { reportId: id },
		create: {
			reportId: id,
			...updateData,
		},
		update: updateData,
	})

	// Sync report lock status + touch updatedAt
	await prisma.report.update({
		where: { id },
		data: {
			updatedAt: new Date(),
			...(data.lockReport !== undefined ? { isLocked: data.lockReport } : {}),
		},
	})

	return NextResponse.json(serializeExportConfig(exportConfig))
}

export { GET, PATCH }
