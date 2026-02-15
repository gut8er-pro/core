import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchSubscription, createCheckout, createPortal } from './use-subscription'

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

	it('defaults plan to PRO when missing', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({}),
		})

		const result = await fetchSubscription()
		expect(result.plan).toBe('PRO')
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
		await expect(fetchSubscription()).rejects.toThrow(
			'Failed to fetch subscription status',
		)
	})
})

describe('createCheckout', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('calls fetch with correct URL and method', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({ url: 'https://checkout.stripe.com/session_123' }),
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
		await expect(createCheckout()).rejects.toThrow(
			'Failed to create checkout session',
		)
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
		await expect(createPortal()).rejects.toThrow(
			'Failed to create portal session',
		)
	})
})
