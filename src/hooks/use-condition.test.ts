import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchCondition } from './use-condition'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('fetchCondition', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('calls fetch with correct URL', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					condition: null,
					damageMarkers: [],
					paintMarkers: [],
					tireSets: [],
				}),
		})

		await fetchCondition('report-123')
		expect(mockFetch).toHaveBeenCalledWith(
			'/api/reports/report-123/condition',
		)
	})

	it('returns parsed JSON on success', async () => {
		const mockData = {
			condition: {
				id: 'c-1',
				reportId: 'report-123',
				paintType: 'Metallic',
				generalCondition: 'Good',
				mileageRead: 85000,
				unit: 'km',
			},
			damageMarkers: [
				{
					id: 'dm-1',
					x: 50,
					y: 30,
					comment: 'Front bumper scratch',
				},
			],
			paintMarkers: [
				{
					id: 'pm-1',
					x: 25,
					y: 75,
					thickness: 120,
					color: '#22C55E',
					position: 'Hood',
				},
			],
			tireSets: [],
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		})

		const result = await fetchCondition('report-123')
		expect(result.condition?.paintType).toBe('Metallic')
		expect(result.damageMarkers).toHaveLength(1)
		expect(result.paintMarkers[0]?.thickness).toBe(120)
	})

	it('throws on non-ok response', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
		await expect(fetchCondition('report-123')).rejects.toThrow(
			'Failed to fetch condition data',
		)
	})
})
