/**
 * The one place a `from` address is constructed.
 *
 * Every outbound mail leaves the single Resend-verified sending domain, but the
 * product sends two quite different things from it — see
 * `CONTEXT.md#mail-senders`. The part before the `@` belongs to the stream and
 * is never a setting: splitting the local parts means a bounce storm on
 * notification mail cannot cost the Gutachten stream its delivery.
 */

const PLATFORM_NAME = 'Gut8erPRO'

const LOCAL_PART = {
	/** Client-facing: the appraisal itself, from a Sachverständiger to their client. */
	gutachten: 'gutachten',
	/** Platform-to-user: the app telling its own user that something happened. */
	notification: 'noreply',
} as const

function sendingDomain(): string {
	const domain = process.env.RESEND_SENDING_DOMAIN?.trim()
	if (!domain) throw new Error('Missing RESEND_SENDING_DOMAIN')
	return domain
}

/**
 * Display names reach this from user-editable fields, so they are quoted and
 * stripped of anything that could close the quoting or start a header of its own.
 */
function formatSender(displayName: string, localPart: string): string {
	const address = `${localPart}@${sendingDomain()}`
	const safe = displayName
		.replace(/[\r\n]+/g, ' ')
		.replace(/["\\]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
	return safe ? `"${safe}" <${address}>` : address
}

/**
 * The Gutachten stream. The platform reads as the carrier rather than the
 * author: the assessor's identity is in the display name, and their own address
 * is in the reply path (see `replyTo` on `sendReportEmail`).
 */
function gutachtenSender(params: {
	assessorName?: string | null
	companyName?: string | null
}): string {
	const identity = params.companyName?.trim() || params.assessorName?.trim()
	return formatSender(
		identity ? `${identity} via ${PLATFORM_NAME}` : PLATFORM_NAME,
		LOCAL_PART.gutachten,
	)
}

/** The notification stream. From the platform, in the platform's name. */
function notificationSender(): string {
	return formatSender(PLATFORM_NAME, LOCAL_PART.notification)
}

export { gutachtenSender, notificationSender, PLATFORM_NAME }
