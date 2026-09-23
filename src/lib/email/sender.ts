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
 * Resend refuses a `from` longer than this outright, and the assessor cannot
 * tell from the generic failure that their own company name is the reason.
 */
const MAX_FROM_LENGTH = 320

function cleanDisplayName(displayName: string): string {
	return displayName
		.replace(/[\r\n]+/g, ' ')
		.replace(/["\\]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
}

/**
 * A German company name is full of umlauts, and a raw non-ASCII display name is
 * not a legal header — it reaches the recipient mangled where it is not rejected
 * outright. RFC 2047 is what makes `Müller & Söhne` survive the wire.
 */
function encodeDisplayName(safe: string): string {
	if (/^[\x20-\x7E]*$/.test(safe)) return `"${safe}"`
	return `=?UTF-8?B?${Buffer.from(safe, 'utf8').toString('base64')}?=`
}

/**
 * Display names reach this from user-editable fields, so they are quoted and
 * stripped of anything that could close the quoting or start a header of its own.
 */
function formatSender(displayName: string, localPart: string): string {
	const address = `${localPart}@${sendingDomain()}`
	let safe = cleanDisplayName(displayName)

	// Base64 inflates, and an umlaut costs two bytes before it does, so the cap
	// is enforced on the finished header rather than guessed from the name.
	while (safe && `${encodeDisplayName(safe)} <${address}>`.length > MAX_FROM_LENGTH) {
		safe = safe.slice(0, -8).trim()
	}

	return safe ? `${encodeDisplayName(safe)} <${address}>` : address
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
	const identity =
		cleanDisplayName(params.companyName ?? '') || cleanDisplayName(params.assessorName ?? '')
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
