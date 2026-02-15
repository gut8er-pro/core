import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchCalculation } from './use-calculation'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('fetchCalculation', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('calls fetch with correct URL', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					calculation: null,
					additionalCosts: [],
				}),
		})

		await fetchCalculation('report-123')
		expect(mockFetch).toHaveBeenCalledWith(
			'/api/reports/report-123/calculation',
		)
	})

	it('returns parsed JSON on success', async () => {
		const mockData = {
			calculation: {
				id: 'calc-1',
				reportId: 'report-123',
				replacementValue: 15000,
				taxRate: '19%',
				residualValue: 8000,
				diminutionInValue: 2500,
				wheelAlignment: 'Required',
				bodyMeasurements: 'Performed',
				bodyPaint: 'Full respray',
				plasticRepair: false,
				repairMethod: 'OEM parts',
				risks: null,
				damageClass: 'Medium',
				dropoutGroup: 'A',
				costPerDay: 45,
				rentalCarClass: 'C',
				repairTimeDays: 5,
				replacementTimeDays: 14,
			},
			additionalCosts: [
				{
					id: 'ac-1',
					calculationId: 'calc-1',
					description: 'Towing costs',
					amount: 250,
				},
			],
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		})

		const result = await fetchCalculation('report-123')
		expect(result.calculation?.replacementValue).toBe(15000)
		expect(result.calculation?.residualValue).toBe(8000)
		expect(result.calculation?.repairTimeDays).toBe(5)
		expect(result.additionalCosts).toHaveLength(1)
		expect(result.additionalCosts[0]?.description).toBe('Towing costs')
		expect(result.additionalCosts[0]?.amount).toBe(250)
	})

	it('returns null calculation when none exists', async () => {
		const mockData = {
			calculation: null,
			additionalCosts: [],
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		})

		const result = await fetchCalculation('report-456')
		expect(result.calculation).toBeNull()
		expect(result.additionalCosts).toHaveLength(0)
	})

	it('throws on non-ok response', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
		await expect(fetchCalculation('report-123')).rejects.toThrow(
			'Failed to fetch calculation data',
		)
	})

	it('returns multiple additional costs', async () => {
		const mockData = {
			calculation: {
				id: 'calc-1',
				reportId: 'report-123',
				replacementValue: 20000,
				taxRate: '19%',
				residualValue: null,
				diminutionInValue: null,
				wheelAlignment: null,
				bodyMeasurements: null,
				bodyPaint: null,
				plasticRepair: false,
				repairMethod: null,
				risks: null,
				damageClass: null,
				dropoutGroup: null,
				costPerDay: null,
				rentalCarClass: null,
				repairTimeDays: null,
				replacementTimeDays: null,
			},
			additionalCosts: [
				{
					id: 'ac-1',
					calculationId: 'calc-1',
					description: 'Towing costs',
					amount: 250,
				},
				{
					id: 'ac-2',
					calculationId: 'calc-1',
					description: 'Storage fees',
					amount: 100,
				},
				{
					id: 'ac-3',
					calculationId: 'calc-1',
					description: 'Expert travel costs',
					amount: 75,
				},
			],
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		})

		const result = await fetchCalculation('report-123')
		expect(result.additionalCosts).toHaveLength(3)
		expect(result.additionalCosts[1]?.description).toBe('Storage fees')
		expect(result.additionalCosts[2]?.amount).toBe(75)
	})
})
