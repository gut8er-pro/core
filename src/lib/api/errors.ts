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

export { SubscriptionRequiredError }
