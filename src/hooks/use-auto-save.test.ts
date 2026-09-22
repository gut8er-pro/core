import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { awaitSectionSave, hasPendingSectionSave, resetSectionSaves } from '@/lib/api/section-saves'
import { useAutoSave } from './use-auto-save'

const invalidateQueries = vi.fn()

vi.mock('@tanstack/react-query', () => ({
	useMutation: vi.fn((options: Record<string, unknown>) => ({
		mutate: vi.fn((data: unknown) => {
			const opts = options as {
				onMutate?: () => void
				mutationFn: (d: unknown) => Promise<unknown>
				onSuccess?: () => void
				onError?: (e: Error) => void
			}
			opts.onMutate?.()
			opts
				.mutationFn(data)
				.then(() => opts.onSuccess?.())
				.catch((e: Error) => opts.onError?.(e))
		}),
	})),
	useQueryClient: () => ({ invalidateQueries }),
}))

describe('useAutoSave', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('initial state is idle', () => {
		const { result } = renderHook(() =>
			useAutoSave({
				reportId: 'report-123',
				section: 'accident-info',
				debounceMs: 2000,
			}),
		)

		expect(result.current.state).toEqual({
			status: 'idle',
			error: null,
		})
	})

	it('saveField accumulates data', () => {
		const { result } = renderHook(() =>
			useAutoSave({
				reportId: 'report-123',
				section: 'accident-info',
				debounceMs: 2000,
			}),
		)

		act(() => {
			result.current.saveField('accidentDay', '2024-06-15')
		})

		act(() => {
			result.current.saveField('accidentScene', 'Autobahn A7')
		})

		// Both fields have been accumulated but the timer has not yet fired
		// The hook should still expose the function without throwing
		expect(result.current.state.status).toBe('idle')
	})

	it('returns expected shape', () => {
		const { result } = renderHook(() =>
			useAutoSave({
				reportId: 'report-123',
				section: 'accident-info',
			}),
		)

		expect(result.current).toHaveProperty('saveField')
		expect(result.current).toHaveProperty('saveFields')
		expect(result.current).toHaveProperty('state')
		expect(typeof result.current.saveField).toBe('function')
		expect(typeof result.current.saveFields).toBe('function')
		expect(result.current.state).toHaveProperty('status')
		expect(result.current.state).toHaveProperty('error')
	})
})

describe('useAutoSave — flush and cache semantics', () => {
	let fetchMock: ReturnType<typeof vi.fn>
	let release: Array<() => void>

	beforeEach(() => {
		vi.useFakeTimers()
		resetSectionSaves()
		invalidateQueries.mockClear()
		release = []
		fetchMock = vi.fn(
			() =>
				new Promise((resolve) => {
					release.push(() =>
						resolve({ ok: true, json: () => Promise.resolve({}) } as unknown as Response),
					)
				}),
		)
		vi.stubGlobal('fetch', fetchMock)
	})

	afterEach(() => {
		vi.useRealTimers()
		vi.unstubAllGlobals()
		resetSectionSaves()
	})

	function mount(options?: { disabled?: boolean }) {
		return renderHook(() =>
			useAutoSave({
				reportId: 'report-123',
				section: 'calculation',
				debounceMs: 800,
				disabled: options?.disabled,
			}),
		)
	}

	it('PATCHes the section once the debounce elapses', () => {
		const { result } = mount()

		act(() => {
			result.current.saveField('calculation.costPerDay', 45)
		})
		expect(fetchMock).not.toHaveBeenCalled()

		act(() => {
			vi.advanceTimersByTime(800)
		})

		expect(fetchMock).toHaveBeenCalledTimes(1)
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe('/api/reports/report-123/calculation')
		expect(init.method).toBe('PATCH')
		expect(JSON.parse(String(init.body))).toEqual({ calculation: { costPerDay: 45 } })
	})

	it('flushNow skips the debounce', () => {
		const { result } = mount()

		act(() => {
			result.current.saveField('calculation.costPerDay', 45)
			result.current.flushNow()
		})

		expect(fetchMock).toHaveBeenCalledTimes(1)
	})

	it('sends nothing while disabled', () => {
		const { result } = mount({ disabled: true })

		act(() => {
			result.current.saveField('calculation.costPerDay', 45)
			result.current.flushNow()
			vi.advanceTimersByTime(800)
		})

		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('flushes pending data on unmount, before the debounce fires', () => {
		const { result, unmount } = mount()

		act(() => {
			result.current.saveField('calculation.costPerDay', 45)
		})
		expect(fetchMock).not.toHaveBeenCalled()

		act(() => {
			unmount()
		})

		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body))).toEqual({
			calculation: { costPerDay: 45 },
		})
	})

	it('makes a section read wait for the unmount flush', async () => {
		const { result, unmount } = mount()

		act(() => {
			result.current.saveField('calculation.costPerDay', 45)
		})
		act(() => {
			unmount()
		})

		expect(hasPendingSectionSave('report-123', 'calculation')).toBe(true)

		let readReleased = false
		const reader = awaitSectionSave('report-123', 'calculation').then(() => {
			readReleased = true
		})

		await Promise.resolve()
		expect(readReleased).toBe(false)

		await act(async () => {
			for (const done of release) done()
			await Promise.resolve()
		})

		await reader
		expect(readReleased).toBe(true)
		expect(hasPendingSectionSave('report-123', 'calculation')).toBe(false)
	})

	it('refetches the section cache once the unmount flush lands', async () => {
		const { result, unmount } = mount()

		act(() => {
			result.current.saveField('calculation.costPerDay', 45)
		})
		act(() => {
			unmount()
		})

		expect(invalidateQueries).not.toHaveBeenCalled()

		await act(async () => {
			for (const done of release) done()
			await Promise.resolve()
		})

		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: ['report', 'report-123', 'calculation'],
		})
	})

	it('leaves the mounted cache alone so a live form is never reset mid-edit', async () => {
		const { result } = mount()

		act(() => {
			result.current.saveField('calculation.costPerDay', 45)
			vi.advanceTimersByTime(800)
		})

		await act(async () => {
			for (const done of release) done()
			await Promise.resolve()
		})

		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: ['report', 'report-123', 'calculation'],
			refetchType: 'none',
		})
	})

	it('queues rather than drops a change made while a save is in flight', async () => {
		const { result } = mount()

		act(() => {
			result.current.saveField('calculation.costPerDay', 45)
			vi.advanceTimersByTime(800)
		})
		expect(fetchMock).toHaveBeenCalledTimes(1)

		act(() => {
			result.current.saveField('calculation.repairTimeDays', 7)
			vi.advanceTimersByTime(800)
		})
		expect(fetchMock).toHaveBeenCalledTimes(1)

		await act(async () => {
			release[0]?.()
			await Promise.resolve()
		})

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(JSON.parse(String((fetchMock.mock.calls[1] as [string, RequestInit])[1].body))).toEqual({
			calculation: { repairTimeDays: 7 },
		})
	})

	it('reports a locked report without a toast-worthy error', async () => {
		fetchMock.mockImplementation(() =>
			Promise.resolve({
				ok: false,
				json: () => Promise.resolve({ error: 'Report is locked' }),
			} as unknown as Response),
		)
		const { result } = mount()

		await act(async () => {
			result.current.saveField('calculation.costPerDay', 45)
			vi.advanceTimersByTime(800)
			await Promise.resolve()
			await Promise.resolve()
			await Promise.resolve()
		})

		expect(result.current.state.status).toBe('locked')
	})
})
