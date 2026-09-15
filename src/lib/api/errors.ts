/**
 * A paid action refused because the account has no live subscription — the 402 that
 * `getEntitledUser` returns. Distinct from a generic request failure so the UI can
 * offer the billing page instead of inviting a retry that will fail the same way.
 */
class SubscriptionRequiredError extends Error {
	constructor() {
		super('Subscription required')
		this.name = 'SubscriptionRequiredError'
	}
}

/**
 * Does this response mean "you are not subscribed"?
 *
 * Seven handlers can answer this way and three of them are read without an exception to
 * throw — a manually-read SSE stream and two bare fetches — so the status is compared in
 * more than one place. Comparing it against a name rather than a bare `402` is what
 * keeps those places recognisably the same question.
 */
function isSubscriptionRequired(response: { status: number }): boolean {
	return response.status === 402
}

export { isSubscriptionRequired, SubscriptionRequiredError }
