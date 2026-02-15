import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchVehicleInfo } from './use-vehicle-info'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('fetchVehicleInfo', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('calls fetch with correct URL', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					id: 'v-1',
					reportId: 'report-123',
					vin: null,
					datsCode: null,
					marketIndex: null,
					manufacturer: null,
					mainType: null,
					subType: null,
					kbaNumber: null,
					powerKw: null,
					powerHp: null,
					engineDesign: null,
					cylinders: null,
					transmission: null,
					displacement: null,
					firstRegistration: null,
					lastRegistration: null,
					vehicleType: null,
					motorType: null,
					axles: null,
					drivenAxles: null,
					doors: null,
					seats: null,
					previousOwners: null,
				}),
		})

		await fetchVehicleInfo('report-123')
		expect(mockFetch).toHaveBeenCalledWith(
			'/api/reports/report-123/vehicle',
		)
	})

	it('returns parsed JSON on success', async () => {
		const mockData = {
			id: 'v-1',
			reportId: 'report-123',
			vin: 'WVWZZZ3CZWE123456',
			datsCode: null,
			marketIndex: null,
			manufacturer: 'Volkswagen',
			mainType: 'Golf',
			subType: 'GTI',
			kbaNumber: '0603/BJC',
			powerKw: 110,
			powerHp: 150,
			engineDesign: null,
			cylinders: 4,
			transmission: null,
			displacement: null,
			firstRegistration: null,
			lastRegistration: null,
			vehicleType: null,
			motorType: null,
			axles: null,
			drivenAxles: null,
			doors: 5,
			seats: 5,
			previousOwners: null,
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		})

		const result = await fetchVehicleInfo('report-123')
		expect(result?.vin).toBe('WVWZZZ3CZWE123456')
		expect(result?.manufacturer).toBe('Volkswagen')
		expect(result?.powerKw).toBe(110)
	})

	it('throws on non-ok response', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
		await expect(fetchVehicleInfo('report-123')).rejects.toThrow(
			'Failed to fetch vehicle info',
		)
	})
})
