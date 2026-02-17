import { useRef, useCallback, useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

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
	state: AutoSaveState
}

async function patchSection(
	reportId: string,
	section: string,
	data: Record<string, unknown>,
): Promise<unknown> {
	const response = await fetch(`/api/reports/${reportId}/${section}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
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
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const pendingRef = useRef<Record<string, unknown>>({})
	const [state, setState] = useState<AutoSaveState>({
		status: 'idle',
		error: null,
	})

	const mutation = useMutation({
		mutationFn: (data: Record<string, unknown>) =>
			patchSection(reportId, section, data),
		onMutate: () => {
			setState({ status: 'saving', error: null })
		},
		onSuccess: () => {
			setState({ status: 'saved', error: null })
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, section],
			})
		},
		onError: (error: Error) => {
			setState({ status: 'error', error: error.message })
		},
	})

	const flush = useCallback(() => {
		const data = { ...pendingRef.current }
		pendingRef.current = {}

		if (Object.keys(data).length === 0) return

		mutation.mutate(data)
	}, [mutation])

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

	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (Object.keys(pendingRef.current).length > 0 || mutation.isPending) {
				e.preventDefault()
			}
		}
		window.addEventListener('beforeunload', handleBeforeUnload)
		return () => window.removeEventListener('beforeunload', handleBeforeUnload)
	}, [mutation.isPending])

	return { saveField, saveFields, state }
}

export { useAutoSave }
export type { UseAutoSaveOptions, AutoSaveState, UseAutoSaveReturn }
