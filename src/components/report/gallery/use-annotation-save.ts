'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { getStoragePath, uploadToStorage } from '@/lib/storage/photos'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'locked'

type SaveArgs = {
	photoId: string
	fabricJson: Record<string, unknown>
	dataUrl: string | null
}

type AnnotationSaveResult = {
	status: SaveStatus
	save: (args: SaveArgs) => Promise<boolean>
	reset: () => void
}

function countObjects(fabricJson: Record<string, unknown>): number {
	const objects = (fabricJson as { objects?: unknown[] }).objects
	return Array.isArray(objects) ? objects.length : 0
}

function useAnnotationSave(reportId: string): AnnotationSaveResult {
	const queryClient = useQueryClient()
	const [status, setStatus] = useState<SaveStatus>('idle')

	const reset = useCallback(() => setStatus('idle'), [])

	const save = useCallback(
		async ({ photoId, fabricJson, dataUrl }: SaveArgs): Promise<boolean> => {
			setStatus('saving')

			const hasAnnotations = countObjects(fabricJson) > 0

			try {
				let annotatedUrl: string | null = null
				if (hasAnnotations && dataUrl) {
					const blob = await (await fetch(dataUrl)).blob()
					annotatedUrl = await uploadToStorage(blob, getStoragePath(reportId, photoId, 'annotated'))
				}

				const response = await fetch(`/api/reports/${reportId}/photos/${photoId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						annotatedUrl,
						annotations: hasAnnotations
							? [{ type: 'fabric', color: '#ff0000', coordinates: {}, fabricJson }]
							: [],
					}),
				})

				if (response.status === 403) {
					setStatus('locked')
					return false
				}

				if (!response.ok) {
					setStatus('error')
					return false
				}

				await queryClient.invalidateQueries({ queryKey: ['report', reportId, 'photos'] })
				setStatus('saved')
				return true
			} catch {
				setStatus('error')
				return false
			}
		},
		[queryClient, reportId],
	)

	return { status, save, reset }
}

export type { AnnotationSaveResult, SaveArgs, SaveStatus }
export { countObjects, useAnnotationSave }
