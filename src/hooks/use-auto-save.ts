import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
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
		throw new Error((errorBody as { error?: string }).error ?? `Failed to save ${section}`)
	}

	return response.json()
}

/**
 * Silent auto-save hook with batching, queuing, and no success toasts.
 *
 * - Collects field changes into a pending batch
 * - Debounces by 800ms (configurable), then sends one PATCH
 * - If a save is in-flight when a new flush triggers, queues the data
 *   and retries after the current save completes (no data loss)
 * - Only shows toast on errors, never on success (status indicator is enough)
 * - Flushes pending data on unmount / tab switch
 */
function useAutoSave({
	reportId,
	section,
	debounceMs = 800,
	disabled = false,
}: UseAutoSaveOptions): UseAutoSaveReturn {
	const queryClient = useQueryClient()
	const toast = useToastStore()

	const pendingRef = useRef<Record<string, unknown>>({})
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const inflightRef = useRef(false)
	const retryRef = useRef(false)
	const mountedRef = useRef(true)

	const reportIdRef = useRef(reportId)
	const sectionRef = useRef(section)
	const disabledRef = useRef(disabled)
	reportIdRef.current = reportId
	sectionRef.current = section
	disabledRef.current = disabled

	const [state, setState] = useState<AutoSaveState>({ status: 'idle', error: null })

	const flush = useCallback(() => {
		if (disabledRef.current) return

		const data = { ...pendingRef.current }
		pendingRef.current = {}

		if (Object.keys(data).length === 0) return

		// If a save is already in-flight, put data back and mark for retry
		if (inflightRef.current) {
			Object.assign(pendingRef.current, data)
			retryRef.current = true
			return
		}

		inflightRef.current = true
		if (mountedRef.current) setState({ status: 'saving', error: null })

		patchSection(reportIdRef.current, sectionRef.current, data)
			.then(() => {
				inflightRef.current = false
				if (mountedRef.current) {
					setState({ status: 'saved', error: null })
					// Clear "saved" indicator after 2s
					setTimeout(() => {
						if (mountedRef.current) {
							setState((prev) => (prev.status === 'saved' ? { status: 'idle', error: null } : prev))
						}
					}, 2000)
				}
				// Silently update the cache instead of invalidating (which triggers
				// refetch → form reset → wiping unsaved fields)
				queryClient.invalidateQueries({
					queryKey: ['report', reportIdRef.current, sectionRef.current],
					refetchType: 'none',
				})
				// If new changes came in while we were saving, flush again
				if (retryRef.current) {
					retryRef.current = false
					flush()
				}
			})
			.catch((error: Error) => {
				inflightRef.current = false
				if (mountedRef.current) {
					setState({ status: 'error', error: error.message })
					toast.error(`Save failed: ${error.message}`)
				}
				// Put data back so it can be retried
				Object.assign(pendingRef.current, data)
				if (retryRef.current) {
					retryRef.current = false
				}
			})
	}, [queryClient, toast])

	const scheduleFlush = useCallback(() => {
		if (timerRef.current) clearTimeout(timerRef.current)
		timerRef.current = setTimeout(() => {
			timerRef.current = null
			flush()
		}, debounceMs)
	}, [debounceMs, flush])

	const flushNow = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current)
			timerRef.current = null
		}
		flush()
	}, [flush])

	const saveField = useCallback(
		(field: string, value: unknown) => {
			if (disabledRef.current) return
			pendingRef.current[field] = value
			scheduleFlush()
		},
		[scheduleFlush],
	)

	const saveFields = useCallback(
		(data: Record<string, unknown>) => {
			if (disabledRef.current) return
			Object.assign(pendingRef.current, data)
			scheduleFlush()
		},
		[scheduleFlush],
	)

	// Flush on unmount (tab switch)
	useEffect(() => {
		mountedRef.current = true
		return () => {
			mountedRef.current = false

			// Blur active input to capture its current value
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
				// Fire-and-forget on unmount
				patchSection(reportIdRef.current, sectionRef.current, data).catch(() => {})
			}
		}
	}, [])

	// Warn on page close with unsaved data
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (Object.keys(pendingRef.current).length > 0 || inflightRef.current) {
				e.preventDefault()
			}
		}
		window.addEventListener('beforeunload', handleBeforeUnload)
		return () => window.removeEventListener('beforeunload', handleBeforeUnload)
	}, [])

	return { saveField, saveFields, flushNow, state }
}

export type { AutoSaveState, UseAutoSaveOptions, UseAutoSaveReturn }
export { useAutoSave }
