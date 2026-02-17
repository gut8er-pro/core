import { useRef, useCallback, useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToastStore } from '@/stores/toast-store'

type UseAutoSaveOptions = {
	reportId: string
	section: string
	debounceMs?: number
	disabled?: boolean
}

type AutoSaveState = {
	status: 'idle' | 'saving' | 'saved' | 'error'
	error: string | null
}

type UseAutoSaveReturn = {
	saveField: (field: string, value: unknown) => void
	saveFields: (data: Record<string, unknown>) => void
	flushNow: () => void
	state: AutoSaveState
}

/**
 * Expand dot-notation keys into nested objects.
 * e.g. { 'claimantInfo.firstName': 'John' } → { claimantInfo: { firstName: 'John' } }
 */
function expandDotKeys(flat: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = {}
	for (const [key, value] of Object.entries(flat)) {
		const parts = key.split('.')
		if (parts.length === 1) {
			result[key] = value
		} else {
			let current = result
			for (let i = 0; i < parts.length - 1; i++) {
				const part = parts[i]!
				if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
					current[part] = {}
				}
				current = current[part] as Record<string, unknown>
			}
			current[parts[parts.length - 1]!] = value
		}
	}
	return result
}

async function patchSection(
	reportId: string,
	section: string,
	data: Record<string, unknown>,
): Promise<unknown> {
	const expanded = expandDotKeys(data)
	const response = await fetch(`/api/reports/${reportId}/${section}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(expanded),
	})

	if (!response.ok) {
		const errorBody = await response.json().catch(() => ({}))
		throw new Error(
			(errorBody as { error?: string }).error ?? `Failed to save ${section}`,
		)
	}

	return response.json()
}

function useAutoSave({
	reportId,
	section,
	debounceMs = 2000,
	disabled = false,
}: UseAutoSaveOptions): UseAutoSaveReturn {
	const queryClient = useQueryClient()
	const toast = useToastStore()
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const pendingRef = useRef<Record<string, unknown>>({})
	const [state, setState] = useState<AutoSaveState>({
		status: 'idle',
		error: null,
	})

	// Use refs for the flush so we can call it from cleanup without stale closures
	const reportIdRef = useRef(reportId)
	const sectionRef = useRef(section)
	reportIdRef.current = reportId
	sectionRef.current = section

	const mutation = useMutation({
		mutationFn: (data: Record<string, unknown>) =>
			patchSection(reportId, section, data),
		onMutate: () => {
			setState({ status: 'saving', error: null })
		},
		onSuccess: () => {
			setState({ status: 'saved', error: null })
			toast.success('Changes saved', 2000)
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, section],
			})
		},
		onError: (error: Error) => {
			setState({ status: 'error', error: error.message })
			toast.error(`Failed to save: ${error.message}`)
		},
	})

	const flush = useCallback(() => {
		const data = { ...pendingRef.current }
		pendingRef.current = {}

		if (Object.keys(data).length === 0) return

		mutation.mutate(data)
	}, [mutation])

	// Immediately cancel any pending debounce and flush now
	const flushNow = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current)
			timerRef.current = null
		}
		flush()
	}, [flush])

	const scheduleFlush = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current)
		}
		timerRef.current = setTimeout(() => {
			timerRef.current = null
			flush()
		}, debounceMs)
	}, [debounceMs, flush])

	const saveField = useCallback(
		(field: string, value: unknown) => {
			if (disabled) return
			pendingRef.current[field] = value
			scheduleFlush()
		},
		[scheduleFlush, disabled],
	)

	const saveFields = useCallback(
		(data: Record<string, unknown>) => {
			if (disabled) return
			Object.assign(pendingRef.current, data)
			scheduleFlush()
		},
		[scheduleFlush, disabled],
	)

	// Flush pending changes on unmount (tab switch)
	useEffect(() => {
		return () => {
			// Trigger blur on the focused input to capture its current value
			// before we read pendingRef. The blur handler runs synchronously,
			// calling saveField which writes to pendingRef.
			const activeEl = document.activeElement
			if (
				activeEl instanceof HTMLInputElement ||
				activeEl instanceof HTMLTextAreaElement ||
				activeEl instanceof HTMLSelectElement
			) {
				activeEl.blur()
			}

			if (timerRef.current) {
				clearTimeout(timerRef.current)
				timerRef.current = null
			}
			const data = { ...pendingRef.current }
			pendingRef.current = {}
			if (Object.keys(data).length > 0) {
				// Fire-and-forget save on unmount — use raw fetch since mutation may not be available
				patchSection(reportIdRef.current, sectionRef.current, data).catch(() => {
					// Silent fail on unmount flush
				})
			}
		}
	}, [])

	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (Object.keys(pendingRef.current).length > 0 || mutation.isPending) {
				e.preventDefault()
			}
		}
		window.addEventListener('beforeunload', handleBeforeUnload)
		return () => window.removeEventListener('beforeunload', handleBeforeUnload)
	}, [mutation.isPending])

	return { saveField, saveFields, flushNow, state }
}

export { useAutoSave }
export type { UseAutoSaveOptions, AutoSaveState, UseAutoSaveReturn }
