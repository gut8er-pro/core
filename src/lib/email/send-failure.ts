/**
 * Why a send failed, in terms the assessor can act on.
 *
 * The provider's own words never reach the screen: they are in English, they
 * name our infrastructure and our account state, and on one memorable occasion
 * they named an internal email address. What crosses the wire is one of these
 * codes, which the client translates — see `CONTEXT.md#send-failures`.
 *
 * Two classes, deliberately. A single generic message for everything tells an
 * assessor with a typo'd recipient to "try again", forever; a code per provider
 * error means owning Resend's taxonomy.
 */
const SEND_FAILURE_CODES = [
	/** Assessor-correctable: the address they typed. */
	'recipient_rejected',
	/** Assessor-correctable: fewer or smaller photos. */
	'attachment_too_large',
	/** Service failure: unverified domain, rejected key, rate limit. Only an operator can fix it. */
	'email_service_unavailable',
] as const

type SendFailureCode = (typeof SEND_FAILURE_CODES)[number]

function isSendFailureCode(value: unknown): value is SendFailureCode {
	return (SEND_FAILURE_CODES as readonly unknown[]).includes(value)
}

/**
 * Anything Resend can hand back: the structured `ErrorResponse` from a resolved
 * send, or a thrown transport error.
 */
type ResendErrorLike = {
	name?: string
	message?: string
	statusCode?: number | null
}

/**
 * Resend error names that are never the assessor's fault, whatever the prose
 * around them says: our key, our domain, our quota, our region, their outage.
 *
 * Matching the name rather than the message is what keeps a reworded provider
 * string from quietly reclassifying. This is not the per-code mapping that was
 * rejected — it is one set collapsing to one class.
 */
const SERVICE_ERROR_NAMES = new Set([
	'missing_api_key',
	'invalid_api_key',
	'restricted_api_key',
	'invalid_access',
	'invalid_from_address',
	'invalid_region',
	'rate_limit_exceeded',
	'daily_quota_exceeded',
	'monthly_quota_exceeded',
	'security_error',
	'application_error',
	'internal_server_error',
	'not_found',
	'method_not_allowed',
])

const SIZE_LANGUAGE = /too large|entity too large|maximum size|size limit/i

function classifyResendError(error: ResendErrorLike): SendFailureCode {
	const message = error.message ?? ''

	// Past the provider's cap. A 6.86 MB Gutachten doubles when the assessor
	// ticks both languages, so this is a live concern rather than a theoretical
	// one.
	if (error.statusCode === 413) return 'attachment_too_large'

	if (error.name && SERVICE_ERROR_NAMES.has(error.name)) return 'email_service_unavailable'

	// `invalid_attachment` covers both an oversized attachment and one with no
	// content — the latter would be our bug, so the size wording decides.
	if (SIZE_LANGUAGE.test(message)) return 'attachment_too_large'

	// What is left is the handful of names Resend reuses for both classes —
	// `validation_error`, `missing_required_field`, `invalid_parameter`. Only the
	// message separates them, and it backticks the offending field: a backticked
	// `to` is the assessor's typo. The sandbox restriction lands here too, but
	// backticks `from`, so it falls through to a service failure — which is what
	// an unverified domain is.
	if (/`to`/.test(message)) return 'recipient_rejected'

	return 'email_service_unavailable'
}

export type { SendFailureCode }
export { classifyResendError, isSendFailureCode }
