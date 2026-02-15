import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchReports } from './use-reports'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('fetchReports', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('calls fetch with correct URL for default params', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					reports: [],
					pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
				}),
		})

		await fetchReports()
		expect(mockFetch).toHaveBeenCalledWith('/api/reports?')
	})

	it('adds query params when provided', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					reports: [],
					pagination: { page: 2, limit: 20, total: 0, totalPages: 0 },
				}),
		})

		await fetchReports({ page: 2, limit: 20, status: 'DRAFT' })
		const url = mockFetch.mock.calls[0]?.[0] as string
		expect(url).toContain('page=2')
		expect(url).toContain('limit=20')
		expect(url).toContain('status=DRAFT')
	})

	it('throws on non-ok response', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, status: 401 })
		await expect(fetchReports()).rejects.toThrow('Failed to fetch reports')
	})

	it('returns parsed JSON on success', async () => {
		const mockData = {
			reports: [
				{
					id: '1',
					title: 'Test',
					status: 'DRAFT',
					completionPercentage: 0,
					_count: { photos: 0 },
				},
			],
			pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		})

		const result = await fetchReports()
		expect(result.reports).toHaveLength(1)
		expect(result.reports[0]?.title).toBe('Test')
		expect(result.pagination.total).toBe(1)
	})
})
