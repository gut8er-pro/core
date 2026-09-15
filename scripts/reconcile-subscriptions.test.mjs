import { beforeEach, describe, expect, it, vi } from 'vitest'
import { gatherSubscriptions, reconcileUser } from './reconcile-subscriptions.mjs'

/**
 * The only sanctioned way to write entitlement by hand (ADR-0003), so what it proposes
 * is worth pinning down. The states below are the ones this database has actually been
 * in: rows that never learned their subscription id, and rows wiped by a schema re-init
 * while the Stripe subscription kept billing.
 */

const CUSTOMER = 'cus_V0ucyZumCqKryT'
const SUBSCRIPTION = 'sub_1U0snjPX9t4iIbv4Pas8t54u'
const TRIAL_END = 1_754_958_918

function user(overrides = {}) {
	return {
		id: '4bd78671-dfa5-493c-b82c-b18e3189581b',
		email: 'sv@example.de',
		plan: 'FREE',
		stripeCustomerId: null,
		stripeSubscriptionId: null,
		trialEndsAt: null,
		...overrides,
	}
}

function subscription(overrides = {}) {
	return {
		id: SUBSCRIPTION,
		customer: CUSTOMER,
		status: 'active',
		trial_end: null,
		metadata: { userId: user().id },
		...overrides,
	}
}

describe('reconcileUser', () => {
	it('proposes nothing when the row already agrees with Stripe', () => {
		const row = user({
			plan: 'PRO',
			stripeCustomerId: CUSTOMER,
			stripeSubscriptionId: SUBSCRIPTION,
			trialEndsAt: new Date(TRIAL_END * 1000),
		})

		const { diffs } = reconcileUser(row, [subscription({ trial_end: TRIAL_END })])

		expect(diffs).toEqual([])
	})

	// The outage state: Checkout completed, the webhook answered 400, our row learned
	// nothing. Repair has to reach the customer id too, or the row stays unlinkable.
	it('links a row that knows nothing about a subscription carrying its userId', () => {
		const { proposed, diffs } = reconcileUser(user(), [subscription({ trial_end: TRIAL_END })])

		expect(proposed).toEqual({
			plan: 'PRO',
			stripeCustomerId: CUSTOMER,
			stripeSubscriptionId: SUBSCRIPTION,
			trialEndsAt: new Date(TRIAL_END * 1000),
		})
		expect(diffs.map(([field]) => field)).toEqual([
			'plan',
			'stripeCustomerId',
			'stripeSubscriptionId',
			'trialEndsAt',
		])
	})

	it('prefers an active subscription over a trialing one', () => {
		const trialing = subscription({ id: 'sub_trialing', status: 'trialing', trial_end: TRIAL_END })

		const { proposed } = reconcileUser(user(), [trialing, subscription()])

		expect(proposed.stripeSubscriptionId).toBe(SUBSCRIPTION)
		expect(proposed.trialEndsAt).toBeNull()
	})

	it('treats a trial as entitled', () => {
		const { proposed } = reconcileUser(user(), [
			subscription({ status: 'trialing', trial_end: TRIAL_END }),
		])

		expect(proposed.plan).toBe('PRO')
		expect(proposed.trialEndsAt).toEqual(new Date(TRIAL_END * 1000))
	})

	it('lapses a row whose only subscription is cancelled, and keeps the customer id', () => {
		const row = user({
			plan: 'PRO',
			stripeCustomerId: CUSTOMER,
			stripeSubscriptionId: SUBSCRIPTION,
		})

		const { proposed } = reconcileUser(row, [subscription({ status: 'canceled' })])

		expect(proposed).toEqual({
			plan: 'FREE',
			stripeCustomerId: CUSTOMER,
			stripeSubscriptionId: null,
			trialEndsAt: null,
		})
	})

	it('lapses a row with no subscriptions at all', () => {
		const row = user({ plan: 'PRO', stripeCustomerId: CUSTOMER })

		const { proposed, diffs } = reconcileUser(row, [])

		expect(proposed.plan).toBe('FREE')
		expect(proposed.stripeCustomerId).toBe(CUSTOMER)
		expect(diffs).toEqual([['plan', 'PRO', 'FREE']])
	})

	// `trialEndsAt` comes back from Postgres as a Date and from Stripe as epoch seconds.
	// Comparing them by identity would report a diff on every run and write on every
	// `--write`.
	it('does not report a trial end that only differs in representation', () => {
		const row = user({
			plan: 'PRO',
			stripeCustomerId: CUSTOMER,
			stripeSubscriptionId: SUBSCRIPTION,
			trialEndsAt: new Date(TRIAL_END * 1000).toISOString(),
		})

		const { diffs } = reconcileUser(row, [subscription({ trial_end: TRIAL_END })])

		expect(diffs).toEqual([])
	})
})

describe('gatherSubscriptions', () => {
	const list = vi.fn()
	const stripe = { subscriptions: { list: (...args) => list(...args) } }

	beforeEach(() => {
		vi.clearAllMocks()
	})

	/** The full sweep is consumed with `for await`; the per-customer call is not. */
	function sweep(subscriptions) {
		return {
			data: subscriptions,
			async *[Symbol.asyncIterator]() {
				yield* subscriptions
			},
		}
	}

	it('attributes a subscription by metadata.userId when the row has no customer id', async () => {
		list.mockImplementation((params) => sweep(params?.customer ? [] : [subscription()]))

		const { byUserId, unattributed } = await gatherSubscriptions(stripe, [user()])

		expect(byUserId.get(user().id)).toHaveLength(1)
		expect(unattributed).toEqual([])
	})

	it('reports a subscription whose userId matches no row of ours', async () => {
		list.mockImplementation(() => sweep([subscription({ metadata: { userId: 'someone-else' } })]))

		const { byUserId, unattributed } = await gatherSubscriptions(stripe, [user()])

		expect(byUserId.get(user().id)).toEqual([])
		expect(unattributed).toHaveLength(1)
	})

	it('counts a subscription once when both lookups return it', async () => {
		list.mockImplementation(() => sweep([subscription()]))

		const { byUserId, unattributed } = await gatherSubscriptions(stripe, [
			user({ stripeCustomerId: CUSTOMER }),
		])

		expect(byUserId.get(user().id)).toHaveLength(1)
		expect(unattributed).toEqual([])
	})

	// A customer id from the other Stripe mode. Real after a mode swap, and the script
	// exists to survive exactly this kind of mess rather than abort halfway through it.
	it('reports a customer Stripe no longer has instead of throwing', async () => {
		list.mockImplementation((params) => {
			if (params?.customer) {
				const err = new Error('No such customer')
				err.code = 'resource_missing'
				throw err
			}
			return sweep([])
		})

		const { orphanedCustomers } = await gatherSubscriptions(stripe, [
			user({ stripeCustomerId: 'cus_from_live_mode' }),
		])

		expect(orphanedCustomers).toHaveLength(1)
	})

	it('re-throws a failure that is not a missing customer', async () => {
		list.mockImplementation((params) => {
			if (params?.customer) throw new Error('Invalid API Key provided')
			return sweep([])
		})

		await expect(
			gatherSubscriptions(stripe, [user({ stripeCustomerId: CUSTOMER })]),
		).rejects.toThrow('Invalid API Key')
	})
})
