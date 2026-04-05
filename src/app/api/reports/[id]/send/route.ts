import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { sendReportEmail } from '@/lib/email/send-report'
import { generateReportPdfBuffer } from '@/lib/pdf/generate-buffer'
import { prisma } from '@/lib/prisma'
import { sendReportSchema } from '@/lib/validations/export'

type RouteContext = {
	params: Promise<{ id: string }>
}

async function POST(request: NextRequest, context: RouteContext) {
	if (!process.env.RESEND_API_KEY) {
		return NextResponse.json(
			{
				error:
					'Email service is not configured. Please add RESEND_API_KEY to your environment variables.',
			},
			{ status: 503 },
		)
	}

	const { user, error } = await getAuthenticatedUser()
	if (error || !user) return unauthorizedResponse()

	const { id } = await context.params

	const report = await prisma.report.findFirst({
		where: { id, userId: user.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	if (report.isLocked) {
		return NextResponse.json({ error: 'Report is already locked and sent' }, { status: 403 })
	}

	const body = await request.json()
	const parsed = sendReportSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const data = parsed.data

	// Verify export config exists
	const exportConfig = await prisma.exportConfig.findUnique({
		where: { reportId: id },
	})

	if (!exportConfig) {
		return NextResponse.json(
			{ error: 'Export config not found. Please configure export settings first.' },
			{ status: 400 },
		)
	}

	// Update export config with final send details
	await prisma.exportConfig.update({
		where: { reportId: id },
		data: {
			recipientEmail: data.recipientEmail,
			recipientName: data.recipientName,
			subject: data.emailSubject,
			body: data.emailBody ?? null,
		},
	})

	// Generate PDF attachment(s) — one per selected language
	const pdfLanguages: string[] = Array.isArray(data.pdfLanguages) ? data.pdfLanguages : ['de']
	const pdfAttachments: { filename: string; content: Buffer }[] = []
	for (const lang of pdfLanguages) {
		try {
			const pdfResult = await generateReportPdfBuffer(id, user.id, lang)
			if ('buffer' in pdfResult) {
				const suffix = pdfLanguages.length > 1 ? `_${lang.toUpperCase()}` : ''
				pdfAttachments.push({
					filename: pdfResult.filename.replace('.pdf', `${suffix}.pdf`),
					content: pdfResult.buffer,
				})
			} else {
				console.error(`PDF generation error (${lang}):`, pdfResult.error)
			}
		} catch (err) {
			console.error(`PDF generation failed (${lang}):`, err)
		}
	}
	const pdfAttachment = pdfAttachments[0]

	// Fetch sender details from DB
	const dbUser = await prisma.user.findUnique({
		where: { id: user.id },
		select: {
			firstName: true,
			lastName: true,
			email: true,
			business: { select: { companyName: true } },
		},
	})

	const senderName =
		[dbUser?.firstName, dbUser?.lastName].filter(Boolean).join(' ') || 'Gut8erPRO User'
	const senderCompany = dbUser?.business?.companyName ?? undefined

	// Send email via Resend with PDF attachment(s)
	const emailResult = await sendReportEmail({
		to: data.recipientEmail,
		recipientName: data.recipientName,
		subject: data.emailSubject,
		body: data.emailBody ?? '',
		reportTitle: report.title,
		senderName,
		senderCompany,
		pdfAttachment,
		pdfAttachments: pdfAttachments.length > 1 ? pdfAttachments : undefined,
	})

	if (!emailResult.success) {
		return NextResponse.json(
			{ error: `Failed to send email: ${emailResult.error}` },
			{ status: 500 },
		)
	}

	// Only update report status after successful email send
	let reportLocked = false
	if (data.lockReport) {
		await prisma.report.update({
			where: { id },
			data: {
				status: 'LOCKED',
				isLocked: true,
				updatedAt: new Date(),
			},
		})
		reportLocked = true
	} else {
		// Mark as sent even if not locked
		await prisma.report.update({
			where: { id },
			data: {
				status: 'SENT',
				updatedAt: new Date(),
			},
		})
	}

	// Create notification for sent/locked report
	const { createNotification } = await import('@/lib/notifications/create')
	await createNotification({
		userId: user.id,
		eventType: 'REPORT_SENT',
		title: 'Report Sent',
		description: `Report "${report.title}" was sent to ${data.recipientEmail}.`,
		reportId: id,
	})

	return NextResponse.json({
		success: true,
		message: `Report sent successfully to ${data.recipientEmail}`,
		reportLocked,
	})
}

export { POST }
