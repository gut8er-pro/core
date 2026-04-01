import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

type NotificationEventType =
	| 'REPORT_COMPLETED'
	| 'REPORT_SENT'
	| 'REPORT_LOCKED'
	| 'REPORT_CREATED'
	| 'INVOICE_GENERATED'
	| 'PAYMENT_RECEIVED'

// Events that also send an email notification to the user
const EMAIL_EVENTS = new Set<NotificationEventType>([
	'REPORT_COMPLETED',
	'REPORT_SENT',
	'INVOICE_GENERATED',
	'PAYMENT_RECEIVED',
])

async function createNotification({
	userId,
	eventType,
	title,
	description,
	reportId,
}: {
	userId: string
	eventType: NotificationEventType
	title: string
	description: string
	reportId?: string
}) {
	let notification = null
	try {
		notification = await prisma.notification.create({
			data: {
				userId,
				eventType,
				title,
				description,
				reportId: reportId ?? null,
			},
		})
	} catch (err) {
		console.warn('[notifications] Failed to create notification record:', err)
		return null
	}

	// Send email for important events (non-blocking)
	if (EMAIL_EVENTS.has(eventType) && process.env.RESEND_API_KEY) {
		try {
			const user = await prisma.user.findUnique({
				where: { id: userId },
				select: { email: true, firstName: true },
			})
			if (user?.email) {
				const resend = new Resend(process.env.RESEND_API_KEY)
				const greeting = user.firstName ? `Hi ${user.firstName},` : 'Hi,'
				await resend.emails.send({
					from: process.env.EMAIL_FROM ?? 'Gut8erPRO <noreply@gut8erpro.de>',
					to: user.email,
					subject: title,
					html: `<p>${greeting}</p><p>${description}</p><p>Log in to <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://gut8erpro.de'}">Gut8erPRO</a> to view details.</p>`,
				})
				await prisma.notification.update({
					where: { id: notification.id },
					data: { emailSent: true },
				})
			}
		} catch (err) {
			console.warn('[notifications] Email send failed (non-fatal):', err)
		}
	}

	return notification
}

export type { NotificationEventType }
export { createNotification }
