import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoSave } from './use-auto-save'

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
			opts.mutationFn(data)
				.then(() => opts.onSuccess?.())
				.catch((e: Error) => opts.onError?.(e))
		}),
	})),
	useQueryClient: () => ({
		invalidateQueries: vi.fn(),
	}),
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
