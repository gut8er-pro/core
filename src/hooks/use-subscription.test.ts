import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	createCheckout,
	createPortal,
	fetchSubscription,
	waitForEntitlement,
} from './use-subscription'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('fetchSubscription', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('calls fetch with correct URL', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					plan: 'PRO',
					trialEndsAt: '2025-07-01T00:00:00Z',
					stripeCustomerId: 'cus_123',
					stripeSubscriptionId: 'sub_456',
				}),
		})

		await fetchSubscription()
		expect(mockFetch).toHaveBeenCalledWith('/api/settings')
	})

	it('returns parsed subscription status on success', async () => {
		const mockData = {
			plan: 'PRO',
			trialEndsAt: '2025-07-01T00:00:00Z',
			stripeCustomerId: 'cus_abc123',
			stripeSubscriptionId: 'sub_def456',
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		})

		const result = await fetchSubscription()
		expect(result.plan).toBe('PRO')
		expect(result.trialEndsAt).toBe('2025-07-01T00:00:00Z')
		expect(result.stripeCustomerId).toBe('cus_abc123')
		expect(result.stripeSubscriptionId).toBe('sub_def456')
	})

	// Fails closed. A body with no `plan` is a shape we do not understand, and reading
	// that as entitlement is how an unpaid account gets the product (ADR-0003).
	it('defaults plan to FREE when missing', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({}),
		})

		const result = await fetchSubscription()
		expect(result.plan).toBe('FREE')
	})

	it('defaults nullable fields to null when missing', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ plan: 'FREE' }),
		})

		const result = await fetchSubscription()
		expect(result.trialEndsAt).toBeNull()
		expect(result.stripeCustomerId).toBeNull()
		expect(result.stripeSubscriptionId).toBeNull()
	})

	it('throws on non-ok response', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
		await expect(fetchSubscription()).rejects.toThrow('Failed to fetch subscription status')
	})
})

describe('createCheckout', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('calls fetch with correct URL and method', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ url: 'https://checkout.stripe.com/session_123' }),
		})

		await createCheckout()
		expect(mockFetch).toHaveBeenCalledWith('/api/stripe/checkout', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		})
	})

	it('returns checkout URL on success', async () => {
		const expectedUrl = 'https://checkout.stripe.com/session_abc'
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ url: expectedUrl }),
		})

		const result = await createCheckout()
		expect(result.url).toBe(expectedUrl)
	})

	it('throws on non-ok response', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, status: 402 })
		await expect(createCheckout()).rejects.toThrow('Failed to create checkout session')
	})
})

describe('createPortal', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('calls fetch with correct URL and method', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					url: 'https://billing.stripe.com/portal_123',
				}),
		})

		await createPortal()
		expect(mockFetch).toHaveBeenCalledWith('/api/stripe/portal', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		})
	})

	it('returns portal URL on success', async () => {
		const expectedUrl = 'https://billing.stripe.com/portal_abc'
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ url: expectedUrl }),
		})

		const result = await createPortal()
		expect(result.url).toBe(expectedUrl)
	})

	it('throws on non-ok response', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
		await expect(createPortal()).rejects.toThrow('Failed to create portal session')
	})
})

/**
 * The race the premature `plan: 'PRO'` used to paper over: Checkout redirects the user
 * back to us the moment the card clears, and the webhook that writes entitlement arrives
 * separately, a second or two later. Between those two the account is honestly lapsed,
 * and showing it that way would be telling a paying customer they have not paid.
 */
describe('waitForEntitlement', () => {
	const settings = (plan: 'FREE' | 'PRO') => ({
		ok: true,
		json: () => Promise.resolve({ plan }),
	})

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('answers on the first read when the webhook has already landed', async () => {
		mockFetch.mockResolvedValueOnce(settings('PRO'))

		await expect(waitForEntitlement({ timeoutMs: 10, intervalMs: 1 })).resolves.toBe(true)
		expect(mockFetch).toHaveBeenCalledTimes(1)
	})

	it('keeps asking until the webhook lands', async () => {
		mockFetch
			.mockResolvedValueOnce(settings('FREE'))
			.mockResolvedValueOnce(settings('FREE'))
			.mockResolvedValueOnce(settings('PRO'))

		await expect(waitForEntitlement({ timeoutMs: 10, intervalMs: 1 })).resolves.toBe(true)
		expect(mockFetch).toHaveBeenCalledTimes(3)
	})

	// The webhook may genuinely never arrive — it had not, for a month. Then we stop
	// waiting and the account is lapsed, which the next paid action says out loud.
	it('gives up after its budget rather than waiting forever', async () => {
		mockFetch.mockResolvedValue(settings('FREE'))

		await expect(waitForEntitlement({ timeoutMs: 3, intervalMs: 1 })).resolves.toBe(false)
		expect(mockFetch).toHaveBeenCalledTimes(3)
	})

	it('treats a failed settings read as no answer yet, not as an answer', async () => {
		mockFetch
			.mockRejectedValueOnce(new Error('NetworkError when attempting to fetch resource'))
			.mockResolvedValueOnce(settings('PRO'))

		await expect(waitForEntitlement({ timeoutMs: 10, intervalMs: 1 })).resolves.toBe(true)
		expect(mockFetch).toHaveBeenCalledTimes(2)
	})
})
