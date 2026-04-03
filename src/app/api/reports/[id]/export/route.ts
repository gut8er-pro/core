import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { generateReportPdfBuffer } from '@/lib/pdf/generate-buffer'
import { prisma } from '@/lib/prisma'
import { exportConfigSchema } from '@/lib/validations/export'

type RouteContext = {
	params: Promise<{ id: string }>
}

async function GET(request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id } = await context.params
	const { searchParams } = new URL(request.url)
	const format = searchParams.get('format')

	// If ?format=pdf, generate and return the PDF
	if (format === 'pdf') {
		try {
			const result = await generateReportPdfBuffer(id, user?.id)
			if ('error' in result) {
				return NextResponse.json({ error: result.error }, { status: 404 })
			}
			return new NextResponse(new Uint8Array(result.buffer), {
				status: 200,
				headers: {
					'Content-Type': 'application/pdf',
					'Content-Disposition': `attachment; filename="${result.filename}"`,
				},
			})
		} catch (pdfError) {
			console.error('PDF generation failed:', pdfError)
			return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
		}
	}

	// Default: return export config JSON
	const report = await prisma.report.findFirst({
		where: { id, userId: user?.id },
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

	return NextResponse.json({
		id: exportConfig.id,
		reportId: exportConfig.reportId,
		includeValuation: exportConfig.includeVehicleValuation,
		includeCommission: exportConfig.includeCommission,
		includeInvoice: exportConfig.includeInvoice,
		lockReport: exportConfig.lockReport,
		recipientEmail: exportConfig.recipientEmail,
		recipientName: exportConfig.recipientName,
		emailSubject: exportConfig.subject,
		emailBody: exportConfig.body,
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

	return NextResponse.json({
		id: exportConfig.id,
		reportId: exportConfig.reportId,
		includeValuation: exportConfig.includeVehicleValuation,
		includeCommission: exportConfig.includeCommission,
		includeInvoice: exportConfig.includeInvoice,
		lockReport: exportConfig.lockReport,
		recipientEmail: exportConfig.recipientEmail,
		recipientName: exportConfig.recipientName,
		emailSubject: exportConfig.subject,
		emailBody: exportConfig.body,
	})
}

export { GET, PATCH }
