import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `getSubscription` answers "what is this customer paying for right now", and the billing
 * page believes it. Both halves of that matter: it asks Stripe by customer rather than
 * reading `User.stripeSubscriptionId` — the column the webhook alone writes, and which was
 * NULL for every account in the September 2026 audit — and it asks for the *current*
 * subscription rather than the most recently created one. See ADR-0003 and
 * `.scratch/e2e-production-audit/issues/14-billing-page-contradicts-itself.md`.
 */

const list = vi.fn()

vi.mock('./client', () => ({
	getStripeClient: () => ({ subscriptions: { list: (...a: unknown[]) => list(...a) } }),
}))

const { getSubscription } = await import('./subscription')

const CUSTOMER = 'cus_V0ucyZumCqKryT'

function subscription(
	status: string,
	overrides: Record<string, unknown> = {},
	item: Record<string, unknown> = {},
) {
	return {
		id: 'sub_1U0snjPX9t4iIbv4Pas8t54u',
		status,
		trial_end: null,
		cancel_at_period_end: false,
		cancel_at: null,
		items: {
			data: [
				{
					price: { id: 'price_1SpJvCPX9t4iIbv4ZBVR6hHV' },
					current_period_start: 1_756_740_000,
					current_period_end: 1_759_418_400,
					...item,
				},
			],
		},
		...overrides,
	}
}

/** Answers each `status:` query from a map, so call order is asserted, not assumed. */
function stripeHas(byStatus: Record<string, unknown[]>) {
	list.mockImplementation(async ({ status }: { status: string }) => ({
		data: byStatus[status] ?? [],
	}))
}

beforeEach(() => {
	vi.clearAllMocks()
})

describe('getSubscription', () => {
	it('returns the active subscription without asking about any other status', async () => {
		stripeHas({ active: [subscription('active')] })

		const result = await getSubscription(CUSTOMER)

		expect(result?.status).toBe('active')
		expect(list).toHaveBeenCalledTimes(1)
		expect(list).toHaveBeenCalledWith({ customer: CUSTOMER, status: 'active', limit: 1 })
	})

	it('falls back to a trialing subscription when none is active yet', async () => {
		stripeHas({ trialing: [subscription('trialing', { trial_end: 1_756_740_000 })] })

		const result = await getSubscription(CUSTOMER)

		expect(result?.status).toBe('trialing')
		expect(result?.trialEnd).toBe(new Date(1_756_740_000 * 1000).toISOString())
	})

	/**
	 * Stripe retries a failed card for roughly two weeks and the subscription is still
	 * there throughout. Reporting none would show the customer "Zahlung einrichten" and
	 * walk them into a second subscription alongside the one they already owe on.
	 */
	it('falls back to a past_due subscription while Stripe is retrying the card', async () => {
		stripeHas({ past_due: [subscription('past_due')] })

		const result = await getSubscription(CUSTOMER)

		expect(result?.status).toBe('past_due')
	})

	/**
	 * The defect `status: 'all', limit: 1` hid: a cancelled subscription is the newest one
	 * a former customer has, and it is not what they are paying for.
	 */
	it('reports none when the only subscription is cancelled', async () => {
		stripeHas({ canceled: [subscription('canceled')] })

		await expect(getSubscription(CUSTOMER)).resolves.toBeNull()
		// The fixture is keyed by its real status, so this would return the cancelled
		// subscription the moment the code asked for one. It never asks.
		expect(list).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'canceled' }))
		expect(list).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'all' }))
	})

	it('reports none for a customer Stripe has no subscription for', async () => {
		stripeHas({})

		await expect(getSubscription(CUSTOMER)).resolves.toBeNull()
	})

	it('reads the billing period off the subscription item, where Stripe v20 puts it', async () => {
		stripeHas({
			active: [
				subscription(
					'active',
					{ cancel_at_period_end: true, cancel_at: 1_759_418_400 },
					{ current_period_start: 1_756_740_000, current_period_end: 1_759_418_400 },
				),
			],
		})

		const result = await getSubscription(CUSTOMER)

		expect(result).toMatchObject({
			id: 'sub_1U0snjPX9t4iIbv4Pas8t54u',
			planId: 'price_1SpJvCPX9t4iIbv4ZBVR6hHV',
			currentPeriodStart: new Date(1_756_740_000 * 1000).toISOString(),
			currentPeriodEnd: new Date(1_759_418_400 * 1000).toISOString(),
			cancelAtPeriodEnd: true,
			cancelAt: new Date(1_759_418_400 * 1000).toISOString(),
		})
	})

	it('survives a subscription whose item carries no period', async () => {
		stripeHas({
			active: [
				subscription(
					'active',
					{},
					{ current_period_start: undefined, current_period_end: undefined },
				),
			],
		})

		const result = await getSubscription(CUSTOMER)

		expect(result).toMatchObject({ currentPeriodStart: null, currentPeriodEnd: null })
	})
})
