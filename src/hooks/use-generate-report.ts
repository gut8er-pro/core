// Hook for consuming the Generate Report SSE pipeline.

import { useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type {
	GenerateEvent,
	GenerationSummary,
	ClassificationResult,
} from '@/lib/ai/types'

type GenerationStatus = {
	isGenerating: boolean
	step: string
	current: number
	total: number
	message: string
	classifications: Map<string, ClassificationResult>
	summary: GenerationSummary | null
	error: string | null
}

const INITIAL_STATUS: GenerationStatus = {
	isGenerating: false,
	step: '',
	current: 0,
	total: 0,
	message: '',
	classifications: new Map(),
	summary: null,
	error: null,
}

function useGenerateReport(reportId: string) {
	const [status, setStatus] = useState<GenerationStatus>(INITIAL_STATUS)
	const abortRef = useRef<AbortController | null>(null)
	const queryClient = useQueryClient()

	const generate = useCallback(async (options?: { incremental?: boolean }) => {
		if (status.isGenerating) return

		const incremental = options?.incremental ?? false

		setStatus({
			...INITIAL_STATUS,
			isGenerating: true,
			message: incremental ? 'Processing new photos...' : 'Starting report generation...',
		})

		const controller = new AbortController()
		abortRef.current = controller

		try {
			const response = await fetch(`/api/reports/${reportId}/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ incremental }),
				signal: controller.signal,
			})

			if (!response.ok) {
				const data = await response.json().catch(() => ({ error: 'Generation failed' }))
				setStatus((prev) => ({
					...prev,
					isGenerating: false,
					error: data.error || 'Generation failed',
				}))
				return
			}

			if (!response.body) {
				setStatus((prev) => ({
					...prev,
					isGenerating: false,
					error: 'No response stream',
				}))
				return
			}

			const reader = response.body.getReader()
			const decoder = new TextDecoder()
			let buffer = ''

			while (true) {
				const { done, value } = await reader.read()
				if (done) break

				buffer += decoder.decode(value, { stream: true })

				// Parse SSE events from buffer
				const lines = buffer.split('\n')
				buffer = lines.pop() || ''

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						try {
							const event = JSON.parse(line.slice(6)) as GenerateEvent
							handleEvent(event, setStatus)
						} catch {
							// Ignore malformed events
						}
					}
				}
			}

			// Process any remaining buffer
			if (buffer.startsWith('data: ')) {
				try {
					const event = JSON.parse(buffer.slice(6)) as GenerateEvent
					handleEvent(event, setStatus)
				} catch {
					// Ignore
				}
			}
		} catch (err) {
			if (controller.signal.aborted) {
				setStatus((prev) => ({
					...prev,
					isGenerating: false,
					message: 'Generation cancelled',
				}))
			} else {
				const message = err instanceof Error ? err.message : 'Generation failed'
				setStatus((prev) => ({
					...prev,
					isGenerating: false,
					error: message,
				}))
			}
		} finally {
			abortRef.current = null
			// Invalidate all report-related queries to refetch fresh data
			queryClient.invalidateQueries({ queryKey: ['report', reportId] })
		}
	}, [reportId, status.isGenerating, queryClient])

	const cancel = useCallback(() => {
		abortRef.current?.abort()
	}, [])

	const reset = useCallback(() => {
		setStatus(INITIAL_STATUS)
	}, [])

	return { status, generate, cancel, reset }
}

function handleEvent(
	event: GenerateEvent,
	setStatus: React.Dispatch<React.SetStateAction<GenerationStatus>>,
) {
	switch (event.type) {
		case 'progress':
			setStatus((prev) => ({
				...prev,
				step: event.step,
				current: event.current,
				total: event.total,
				message: event.message,
			}))
			break

		case 'photo_classified':
			setStatus((prev) => {
				const newClassifications = new Map(prev.classifications)
				newClassifications.set(event.photoId, event.classification)
				return { ...prev, classifications: newClassifications }
			})
			break

		case 'photo_processed':
			// Photo processed — could update per-photo state if needed
			break

		case 'auto_fill':
			setStatus((prev) => ({
				...prev,
				message: `Auto-filled ${event.section}: ${event.fields.join(', ')}`,
			}))
			break

		case 'complete':
			setStatus((prev) => ({
				...prev,
				isGenerating: false,
				summary: event.summary,
				message: `Complete — ${event.summary.totalFieldsFilled} fields auto-filled`,
			}))
			break

		case 'error':
			setStatus((prev) => ({
				...prev,
				isGenerating: false,
				error: event.message,
			}))
			break
	}
}

export { useGenerateReport }
export type { GenerationStatus }
