import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SubscriptionRequiredError } from '@/lib/api/errors'
import { analyzePhoto, detectLicensePlate, detectVin, ocrDocument } from './client'

/**
 * All four routes sit behind `getEntitledUser`, so a lapsed subscriber gets a 402 from
 * every one of them. Until this file existed that arrived at the UI as a generic "AI
 * analysis failed", inviting a retry that could only fail the same way — the caller
 * could not tell "we could not read this photo" from "you are not subscribed".
 */

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

const PHOTO = 'https://storage.example.com/photos/damage-front.jpg'

const CALLS = [
	{ name: 'analyzePhoto', call: () => analyzePhoto(PHOTO), url: '/api/ai/analyze-photo' },
	{ name: 'detectVin', call: () => detectVin(PHOTO), url: '/api/ai/detect-vin' },
	{
		name: 'detectLicensePlate',
		call: () => detectLicensePlate(PHOTO),
		url: '/api/ai/detect-plate',
	},
	{ name: 'ocrDocument', call: () => ocrDocument(PHOTO), url: '/api/ai/ocr' },
]

beforeEach(() => {
	vi.clearAllMocks()
})

describe.each(CALLS)('$name', ({ call, url }) => {
	it('throws SubscriptionRequiredError on a 402', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 402,
			json: () => Promise.resolve({ error: 'Subscription required' }),
		})

		await expect(call()).rejects.toBeInstanceOf(SubscriptionRequiredError)
		expect(mockFetch).toHaveBeenCalledWith(url, expect.objectContaining({ method: 'POST' }))
	})

	// A 402 is the only failure the UI treats as "not a retry" — everything else stays a
	// plain Error carrying whatever the route said.
	it('throws a plain Error carrying the route message on any other failure', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
			json: () => Promise.resolve({ error: 'Anthropic API unavailable' }),
		})

		const error = await call().catch((e: unknown) => e)
		expect(error).toBeInstanceOf(Error)
		expect(error).not.toBeInstanceOf(SubscriptionRequiredError)
		expect((error as Error).message).toBe('Anthropic API unavailable')
	})

	it('returns the parsed body on success', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve({ vin: 'WVWZZZ1KZAW123456', description: 'Front bumper' }),
		})

		await expect(call()).resolves.toMatchObject({})
	})
})
