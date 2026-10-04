import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCondition, useSaveDamageMarker } from './use-condition'

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
		expect(mockFetch).toHaveBeenCalledWith('/api/reports/report-123/condition')
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
		await expect(fetchCondition('report-123')).rejects.toThrow('Failed to fetch condition data')
	})
})

describe('marker writes on a report locked elsewhere', () => {
	function setup() {
		const queryClient = new QueryClient({
			defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
		})
		const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
		const wrapper = ({ children }: { children: ReactNode }) =>
			createElement(QueryClientProvider, { client: queryClient }, children)
		const { result } = renderHook(() => useSaveDamageMarker('report-123'), { wrapper })
		return { result, invalidate }
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('refetches the report when the server refuses the write as locked', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 403,
			json: () => Promise.resolve({ error: 'Report is locked' }),
		})
		const { result, invalidate } = setup()

		await act(async () => {
			await result.current.mutateAsync({ x: 10, y: 20, comment: null }).catch(() => {})
		})

		expect(invalidate).toHaveBeenCalledWith({ queryKey: ['report', 'report-123'], exact: true })
	})

	it('leaves the report alone when the write fails for another reason', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
			json: () => Promise.resolve({ error: 'Internal error' }),
		})
		const { result, invalidate } = setup()

		await act(async () => {
			await result.current.mutateAsync({ x: 10, y: 20, comment: null }).catch(() => {})
		})

		expect(invalidate).not.toHaveBeenCalled()
	})
})
