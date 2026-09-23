import * as Sentry from '@sentry/nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { defaultLocale } from '@/i18n/config'
import { resolveLocale } from '@/i18n/translator'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { getMissingInfo, isDelivered } from '@/lib/completeness/server'
import { sendReportEmail } from '@/lib/email/send-report'
import { generateReportPdfBuffer } from '@/lib/pdf/generate-buffer'
import { parseSectionsParam, sectionsFromToggles } from '@/lib/pdf/sections'
import { prisma } from '@/lib/prisma'
import { sendReportSchema } from '@/lib/validations/export'

type RouteContext = {
	params: Promise<{ id: string }>
}

async function POST(request: NextRequest, context: RouteContext) {
	// Both variables, and before anything expensive: without the domain the send
	// throws only after every PDF has been rendered. A missing one is a service
	// failure like any other — the assessor cannot fix it and must not be told
	// which variable it is.
	const missingConfig = ['RESEND_API_KEY', 'RESEND_SENDING_DOMAIN'].filter(
		(name) => !process.env[name],
	)
	if (missingConfig.length > 0) {
		console.error(`[send] refused: ${missingConfig.join(', ')} unset`)
		return NextResponse.json({ error: 'email_service_unavailable' }, { status: 503 })
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

	// A locked report is still sendable. Locking closes the report to EDITS, not
	// to delivery: re-sending the same Gutachten to a second insurer, or to a
	// client who lost the mail, is the assessor's normal work. Refusing it here
	// is what produced the "Failed to send report" banner on the second visit
	// (ticket 32.3).

	// The gate. Checked here as well as inside the PDF generator so this route
	// can answer with the structured breakdown rather than a PDF-layer error —
	// a count is meaningless to the assessor without the locations.
	if (!isDelivered(report)) {
		const missingInfo = await getMissingInfo(id, user.id)
		if (missingInfo && !missingInfo.isComplete) {
			return NextResponse.json({ error: 'incomplete', missingInfo }, { status: 422 })
		}
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

	// The composer's own state, stored so reopening the page shows what was sent
	// rather than an empty form (ticket 32.1). Upserted rather than required to
	// exist: the row is otherwise only created by opening the composer, so a
	// send that skipped that page died on "Export config not found" — one of the
	// two things the client read as "Failed to send report".
	const sentRecipients = data.recipientEmail
		.split(',')
		.map((email) => email.trim())
		.filter(Boolean)

	const composerState = {
		recipientEmail: data.recipientEmail,
		recipientName: data.recipientName,
		recipients: sentRecipients,
		...(data.recipientMode !== undefined ? { recipientMode: data.recipientMode } : {}),
		subject: data.emailSubject,
		body: data.emailBody ?? null,
	}

	const exportConfig = await prisma.exportConfig.upsert({
		where: { reportId: id },
		create: { reportId: id, ...composerState },
		update: composerState,
	})

	// Generate PDF attachment(s) — one per selected language. Always re-rendered
	// from current data, never reused from an earlier send.
	const pdfLanguages: string[] = Array.isArray(data.pdfLanguages) ? data.pdfLanguages : ['de']
	const sections = parseSectionsParam(
		data.sections ? data.sections.join(',') : null,
		sectionsFromToggles({
			includeVehicleValuation: exportConfig.includeVehicleValuation ?? true,
			includeCommission: exportConfig.includeCommission ?? true,
			includeInvoice: exportConfig.includeInvoice ?? true,
		}),
	)
	const pdfAttachments: { filename: string; content: Buffer }[] = []
	const pdfFailures: { language: string; cause: string }[] = []
	for (const lang of pdfLanguages) {
		try {
			const pdfResult = await generateReportPdfBuffer(id, user.id, lang, sections)
			if ('buffer' in pdfResult) {
				const suffix = pdfLanguages.length > 1 ? `_${lang.toUpperCase()}` : ''
				pdfAttachments.push({
					filename: pdfResult.filename.replace('.pdf', `${suffix}.pdf`),
					content: pdfResult.buffer,
				})
			} else {
				console.error(`PDF generation error (${lang}):`, pdfResult.error)
				pdfFailures.push({ language: lang, cause: pdfResult.error })
			}
		} catch (err) {
			console.error(`PDF generation failed (${lang}):`, err)
			pdfFailures.push({
				language: lang,
				cause: err instanceof Error ? err.message : String(err),
			})
		}
	}

	// Every requested language or none of them. A covering mail with a Gutachten
	// missing is discovered by the client, not by the assessor — and a locked
	// report cannot be sent a second time. See CONTEXT.md#send-failures.
	if (pdfAttachments.length !== pdfLanguages.length) {
		const languages = pdfFailures.map((failure) => failure.language)
		const detail = pdfFailures.map((failure) => `${failure.language}: ${failure.cause}`).join('; ')
		console.error(`[send] report=${id} refused: no PDF for ${languages.join(', ')} — ${detail}`)
		Sentry.captureException(new Error(`Report PDF generation failed: ${detail}`), {
			tags: { reportId: id, failedLanguages: languages.join(',') },
		})
		return NextResponse.json({ error: 'pdf_generation_failed', languages }, { status: 500 })
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

	const senderName = [dbUser?.firstName, dbUser?.lastName].filter(Boolean).join(' ')
	const senderCompany = dbUser?.business?.companyName ?? undefined

	// The chrome the app wraps around the assessor's composition follows the
	// attached Gutachten. Asked for both languages, it falls back to German
	// rather than picking one of the two for the recipient.
	const emailLocale = pdfLanguages.length === 1 ? resolveLocale(pdfLanguages[0]) : defaultLocale

	// Send email via Resend with PDF attachment(s)
	const emailResult = await sendReportEmail({
		to: data.recipientEmail,
		recipientName: data.recipientName,
		subject: data.emailSubject,
		body: data.emailBody ?? '',
		reportTitle: report.title,
		senderName,
		senderCompany,
		locale: emailLocale,
		// The reply path. Without it a client pressing Reply reaches an address
		// nobody reads — see CONTEXT.md#mail-senders.
		replyTo: dbUser?.email ?? user.email,
		pdfAttachment,
		pdfAttachments: pdfAttachments.length > 1 ? pdfAttachments : undefined,
	})

	if (!emailResult.success) {
		// The provider's own words stay server-side. They are in English, and they
		// name our infrastructure and our account state.
		console.error(`[send] report=${id} failed kind=${emailResult.code}: ${emailResult.detail}`)
		Sentry.captureException(new Error(`Report email send failed: ${emailResult.detail}`), {
			tags: { reportId: id, sendFailureCode: emailResult.code },
		})
		// Assessor-correctable failures earn a 400 — the request as sent will
		// never succeed. Service failures earn a 502: nothing about the request
		// was wrong.
		const status = emailResult.code === 'email_service_unavailable' ? 502 : 400
		return NextResponse.json({ error: emailResult.code }, { status })
	}

	// Only update report status after successful email send
	let reportLocked = report.isLocked
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
	} else if (!report.isLocked) {
		// Mark as sent even if not locked. A report that is ALREADY locked keeps
		// its lock: re-sending it is delivery, not an unlock.
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
		messageKey: 'reportSent',
		params: { title: report.title, recipient: data.recipientEmail },
		reportId: id,
	})

	return NextResponse.json({
		success: true,
		message: `Report sent successfully to ${data.recipientEmail}`,
		reportLocked,
	})
}

export { POST }
