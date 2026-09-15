import { getServerTranslations } from '@/i18n/translator'
import { requestLocale } from '@/lib/api/locale'
import { getResendClient } from '@/lib/email/client'
import { escapeHtml } from '@/lib/email/html'
import { notificationSender } from '@/lib/email/sender'
import { prisma } from '@/lib/prisma'
import { appUrl } from '@/lib/urls'
import {
	encodeNotificationParams,
	type NotificationMessageKey,
	type NotificationParams,
} from './messages'

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
	messageKey,
	params,
	reportId,
}: {
	userId: string
	eventType: NotificationEventType
	messageKey: NotificationMessageKey
	params: NotificationParams
	reportId?: string
}) {
	let notification = null
	try {
		notification = await prisma.notification.create({
			data: {
				userId,
				eventType,
				title: messageKey,
				description: encodeNotificationParams(params),
				reportId: reportId ?? null,
			},
		})
	} catch (err) {
		console.warn('[notifications] Failed to create notification record:', err)
		return null
	}

	// Send email for important events (non-blocking). Gated on both mail
	// variables: `notificationSender()` throws without the domain, and this
	// stream swallows its failures, so an unset domain would kill it silently.
	if (
		EMAIL_EVENTS.has(eventType) &&
		process.env.RESEND_API_KEY &&
		process.env.RESEND_SENDING_DOMAIN
	) {
		try {
			const user = await prisma.user.findUnique({
				where: { id: userId },
				select: { email: true, firstName: true },
			})
			if (user?.email) {
				const locale = await requestLocale()
				const t = await getServerTranslations(locale, 'notifications')
				const subject = t(`messages.${messageKey}.title`)
				const summary = escapeHtml(t(`messages.${messageKey}.description`, params))
				const greeting = escapeHtml(
					user.firstName
						? t('email.greeting', { name: user.firstName })
						: t('email.greetingFallback'),
				)
				const resend = getResendClient()
				await resend.emails.send({
					from: notificationSender(),
					to: user.email,
					subject,
					html: `<p>${greeting}</p><p>${summary}</p><p><a href="${appUrl()}">${escapeHtml(t('email.openApp'))}</a></p>`,
				})
				await prisma.notification.update({
					where: { id: notification.id },
					data: { emailSent: true },
				})
			}
		} catch (err) {
			console.error('[notifications] Email send failed (non-fatal):', err)
		}
	}

	return notification
}

export type { NotificationEventType }
export { createNotification }
