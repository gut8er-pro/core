import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchAccidentInfo } from './use-accident-info'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('fetchAccidentInfo', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('calls fetch with correct URL', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					accidentInfo: null,
					claimantInfo: null,
					opponentInfo: null,
					visits: [],
					expertOpinion: null,
					signatures: [],
				}),
		})

		await fetchAccidentInfo('report-123')
		expect(mockFetch).toHaveBeenCalledWith(
			'/api/reports/report-123/accident-info',
		)
	})

	it('returns parsed JSON on success', async () => {
		const mockData = {
			accidentInfo: {
				id: 'ai-1',
				reportId: 'report-123',
				accidentDay: '2024-06-15T10:30:00+02:00',
				accidentScene: 'Autobahn A7',
			},
			claimantInfo: null,
			opponentInfo: null,
			visits: [],
			expertOpinion: null,
			signatures: [
				{
					id: 'sig-1',
					reportId: 'report-123',
					type: 'LAWYER',
					imageUrl: null,
					signedAt: null,
				},
			],
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		})

		const result = await fetchAccidentInfo('report-123')
		expect(result.accidentInfo?.accidentScene).toBe('Autobahn A7')
		expect(result.signatures).toHaveLength(1)
		expect(result.signatures[0]?.type).toBe('LAWYER')
	})

	it('throws on non-ok response', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
		await expect(fetchAccidentInfo('report-123')).rejects.toThrow(
			'Failed to fetch accident info',
		)
	})
})
