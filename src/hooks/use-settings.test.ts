import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchSettings, saveSettings } from './use-settings'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('fetchSettings', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('calls fetch with correct URL', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					id: 'user-1',
					email: 'hans@example.com',
					title: null,
					firstName: 'Hans',
					lastName: 'Mueller',
					phone: null,
					avatarUrl: null,
					plan: 'FREE',
					stripeCustomerId: null,
					stripeSubscriptionId: null,
					trialEndsAt: null,
					business: null,
					integrations: [],
				}),
		})

		await fetchSettings()
		expect(mockFetch).toHaveBeenCalledWith('/api/settings')
	})

	it('returns parsed user settings on success', async () => {
		const mockData = {
			id: 'user-1',
			email: 'hans@example.com',
			title: 'mr',
			firstName: 'Hans',
			lastName: 'Mueller',
			phone: '+491234567890',
			avatarUrl: 'https://example.com/avatar.jpg',
			plan: 'PRO',
			stripeCustomerId: 'cus_123',
			stripeSubscriptionId: 'sub_456',
			trialEndsAt: '2025-07-01T00:00:00Z',
			business: {
				companyName: 'Mueller Gutachten GmbH',
				street: 'Hauptstrasse 5',
				postcode: '80331',
				city: 'Muenchen',
				taxId: '143/123/45678',
				vatId: 'DE987654321',
			},
			integrations: [
				{
					id: 'int-1',
					provider: 'DAT',
					isActive: true,
				},
			],
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		})

		const result = await fetchSettings()
		expect(result.id).toBe('user-1')
		expect(result.email).toBe('hans@example.com')
		expect(result.firstName).toBe('Hans')
		expect(result.lastName).toBe('Mueller')
		expect(result.plan).toBe('PRO')
		expect(result.business?.companyName).toBe('Mueller Gutachten GmbH')
		expect(result.business?.postcode).toBe('80331')
		expect(result.integrations).toHaveLength(1)
		expect(result.integrations[0]?.provider).toBe('DAT')
		expect(result.integrations[0]?.isActive).toBe(true)
	})

	it('returns user with null business when none set', async () => {
		const mockData = {
			id: 'user-2',
			email: 'jane@example.com',
			title: null,
			firstName: 'Jane',
			lastName: 'Doe',
			phone: null,
			avatarUrl: null,
			plan: 'FREE',
			stripeCustomerId: null,
			stripeSubscriptionId: null,
			trialEndsAt: null,
			business: null,
			integrations: [],
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		})

		const result = await fetchSettings()
		expect(result.business).toBeNull()
		expect(result.integrations).toHaveLength(0)
		expect(result.stripeCustomerId).toBeNull()
	})

	it('throws on non-ok response', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, status: 401 })
		await expect(fetchSettings()).rejects.toThrow(
			'Failed to fetch settings',
		)
	})
})

describe('saveSettings', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('calls fetch with PATCH method and correct URL', async () => {
		const updateData = {
			profile: {
				firstName: 'Updated',
				lastName: 'Name',
			},
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					id: 'user-1',
					email: 'hans@example.com',
					title: null,
					firstName: 'Updated',
					lastName: 'Name',
					phone: null,
					avatarUrl: null,
					plan: 'FREE',
					stripeCustomerId: null,
					stripeSubscriptionId: null,
					trialEndsAt: null,
					business: null,
					integrations: [],
				}),
		})

		await saveSettings(updateData)
		expect(mockFetch).toHaveBeenCalledWith('/api/settings', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updateData),
		})
	})

	it('sends profile update and returns updated settings', async () => {
		const updateData = {
			profile: {
				firstName: 'Hans',
				lastName: 'Schmidt',
				phone: '+4917612345678',
			},
		}

		const mockResponse = {
			id: 'user-1',
			email: 'hans@example.com',
			title: null,
			firstName: 'Hans',
			lastName: 'Schmidt',
			phone: '+4917612345678',
			avatarUrl: null,
			plan: 'PRO',
			stripeCustomerId: 'cus_123',
			stripeSubscriptionId: 'sub_456',
			trialEndsAt: null,
			business: null,
			integrations: [],
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		})

		const result = await saveSettings(updateData)
		expect(result.firstName).toBe('Hans')
		expect(result.lastName).toBe('Schmidt')
		expect(result.phone).toBe('+4917612345678')
	})

	it('sends business update and returns updated settings', async () => {
		const updateData = {
			business: {
				companyName: 'Neue Firma GmbH',
				street: 'Berliner Strasse 10',
				postcode: '10115',
				city: 'Berlin',
				taxId: '27/123/45678',
				vatId: 'DE111222333',
			},
		}

		const mockResponse = {
			id: 'user-1',
			email: 'hans@example.com',
			title: null,
			firstName: 'Hans',
			lastName: 'Mueller',
			phone: null,
			avatarUrl: null,
			plan: 'FREE',
			stripeCustomerId: null,
			stripeSubscriptionId: null,
			trialEndsAt: null,
			business: {
				companyName: 'Neue Firma GmbH',
				street: 'Berliner Strasse 10',
				postcode: '10115',
				city: 'Berlin',
				taxId: '27/123/45678',
				vatId: 'DE111222333',
			},
			integrations: [],
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		})

		const result = await saveSettings(updateData)
		expect(result.business?.companyName).toBe('Neue Firma GmbH')
		expect(result.business?.vatId).toBe('DE111222333')
	})

	it('sends combined profile and business update', async () => {
		const updateData = {
			profile: {
				firstName: 'Updated',
			},
			business: {
				companyName: 'Updated GmbH',
				street: 'Neue Strasse 1',
				postcode: '50667',
				city: 'Koeln',
				taxId: '214/123/45678',
			},
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					id: 'user-1',
					email: 'hans@example.com',
					title: null,
					firstName: 'Updated',
					lastName: 'Mueller',
					phone: null,
					avatarUrl: null,
					plan: 'FREE',
					stripeCustomerId: null,
					stripeSubscriptionId: null,
					trialEndsAt: null,
					business: {
						companyName: 'Updated GmbH',
						street: 'Neue Strasse 1',
						postcode: '50667',
						city: 'Koeln',
						taxId: '214/123/45678',
						vatId: null,
					},
					integrations: [],
				}),
		})

		await saveSettings(updateData)
		expect(mockFetch).toHaveBeenCalledWith('/api/settings', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updateData),
		})
	})

	it('throws on non-ok response', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, status: 422 })
		await expect(
			saveSettings({ profile: { firstName: 'Test' } }),
		).rejects.toThrow('Failed to save settings')
	})

	it('throws on server error', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
		await expect(
			saveSettings({
				business: {
					companyName: 'Test',
					street: 'Test',
					postcode: '12345',
					city: 'Test',
					taxId: '12/345/67890',
				},
			}),
		).rejects.toThrow('Failed to save settings')
	})
})
