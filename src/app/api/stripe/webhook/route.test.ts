import type { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * This handler is the only writer of entitlement (ADR-0003), and for roughly a month it
 * answered Stripe with a 400 on every event while having no test at all — see
 * `.scratch/e2e-production-audit/issues/13-stripe-webhook-has-never-delivered.md`. The
 * cases below are the ones that matter when delivery works again: the id gets written, a
 * cancellation actually lapses the account, and nothing Stripe sends can make us ask it
 * to retry forever.
 *
 * `past_due` is deliberately untested — issue 15 settles it.
 */

const update = vi.fn()
const constructEvent = vi.fn()

vi.mock('@/lib/prisma', () => ({
	prisma: { user: { update: (...args: unknown[]) => update(...args) } },
}))
vi.mock('@/lib/stripe/client', () => ({
	getStripeClient: () => ({
		webhooks: { constructEvent: (...a: unknown[]) => constructEvent(...a) },
	}),
}))

const { POST } = await import('./route')

const CUSTOMER = 'cus_V0ucyZumCqKryT'
const SUBSCRIPTION = 'sub_1U0snjPX9t4iIbv4Pas8t54u'

function request(signature: string | null = 't=1,v1=deadbeef') {
	return new Request('https://app.gut8erpro.de/api/stripe/webhook', {
		method: 'POST',
		body: '{}',
		headers: signature ? { 'stripe-signature': signature } : {},
	}) as unknown as NextRequest
}

function subscriptionEvent(
	type: string,
	subscription: { status?: string; trial_end?: number | null } = {},
) {
	constructEvent.mockReturnValue({
		type,
		data: {
			object: {
				id: SUBSCRIPTION,
				customer: CUSTOMER,
				status: 'active',
				trial_end: null,
				...subscription,
			},
		},
	})
}

beforeEach(() => {
	vi.clearAllMocks()
	update.mockResolvedValue({})
	vi.spyOn(console, 'error').mockImplementation(() => {})
	vi.spyOn(console, 'log').mockImplementation(() => {})
})

describe('POST /api/stripe/webhook', () => {
	it('rejects a request with no stripe-signature header', async () => {
		const response = await POST(request(null))

		expect(response.status).toBe(400)
		expect(constructEvent).not.toHaveBeenCalled()
		expect(update).not.toHaveBeenCalled()
	})

	it('rejects an event whose signature does not verify', async () => {
		constructEvent.mockImplementation(() => {
			throw new Error('No signatures found matching the expected signature for payload')
		})

		const response = await POST(request())

		expect(response.status).toBe(400)
		expect(update).not.toHaveBeenCalled()
	})

	/**
	 * The write that has never once landed in production. A trial is entitled — the card
	 * is already on file and Stripe is counting down to the first charge.
	 */
	it('entitles the user and stores the subscription id on subscription.created', async () => {
		const trialEnd = 1_756_740_000
		subscriptionEvent('customer.subscription.created', {
			status: 'trialing',
			trial_end: trialEnd,
		})

		const response = await POST(request())

		expect(response.status).toBe(200)
		expect(update).toHaveBeenCalledWith({
			where: { stripeCustomerId: CUSTOMER },
			data: {
				plan: 'PRO',
				stripeSubscriptionId: SUBSCRIPTION,
				trialEndsAt: new Date(trialEnd * 1000),
			},
		})
	})

	// The direction that matters, and the one that has never worked: a cancellation in
	// Stripe has to reach `plan` or a lapsed account keeps the product.
	it('lapses the user when a subscription updates to canceled', async () => {
		subscriptionEvent('customer.subscription.updated', { status: 'canceled' })

		const response = await POST(request())

		expect(response.status).toBe(200)
		expect(update).toHaveBeenCalledWith({
			where: { stripeCustomerId: CUSTOMER },
			data: {
				plan: 'FREE',
				stripeSubscriptionId: SUBSCRIPTION,
				trialEndsAt: null,
			},
		})
	})

	it('lapses the user and clears the subscription id on subscription.deleted', async () => {
		subscriptionEvent('customer.subscription.deleted')

		const response = await POST(request())

		expect(response.status).toBe(200)
		expect(update).toHaveBeenCalledWith({
			where: { stripeCustomerId: CUSTOMER },
			data: { plan: 'FREE', stripeSubscriptionId: null, trialEndsAt: null },
		})
	})

	it('acknowledges an event type it does not handle without touching the user', async () => {
		constructEvent.mockReturnValue({
			type: 'payment_intent.succeeded',
			data: { object: { id: 'pi_123' } },
		})

		const response = await POST(request())

		expect(response.status).toBe(200)
		await expect(response.json()).resolves.toEqual({ received: true })
		expect(update).not.toHaveBeenCalled()
	})

	/**
	 * A Stripe customer with no row of ours is a permanent state, not a transient one —
	 * answering 500 buys three days of retries that cannot succeed.
	 */
	it('acknowledges an event for a customer that has no user row', async () => {
		subscriptionEvent('customer.subscription.created')
		update.mockRejectedValue(new Error('Record to update not found.'))

		const response = await POST(request())

		expect(response.status).toBe(200)
		await expect(response.json()).resolves.toMatchObject({ received: true })
	})

	it('asks Stripe to retry when the write fails for any other reason', async () => {
		subscriptionEvent('customer.subscription.created')
		update.mockRejectedValue(new Error('Connection terminated unexpectedly'))

		const response = await POST(request())

		expect(response.status).toBe(500)
	})
})
