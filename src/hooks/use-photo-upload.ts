import { useCallback, useState } from 'react'
import { compressImage, getStoragePath, uploadToStorage } from '@/lib/storage/photos'
import { MAX_PHOTOS_PER_REPORT, validateFileSize, validateFileType } from '@/lib/validations/photos'
import { useUploadPhoto } from './use-photos'

type UploadState = {
	isUploading: boolean
	progress: number
	error: string | null
}

type UsePhotoUploadReturn = {
	uploadState: UploadState
	uploadPhotos: (reportId: string, files: File[]) => Promise<void>
	reset: () => void
}

const INITIAL_STATE: UploadState = {
	isUploading: false,
	progress: 0,
	error: null,
}

async function processPhotoWithRetry(
	reportId: string,
	body: { photoUrl: string; photoId: string },
): Promise<void> {
	const url = `/api/reports/${reportId}/photos/process`
	const init: RequestInit = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	}
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			const res = await fetch(url, init)
			if (res.ok) return
			// 502/503/504 → retry; other statuses are likely permanent (4xx auth, etc.)
			if (![502, 503, 504].includes(res.status)) {
				throw new Error(`process failed: ${res.status}`)
			}
		} catch (err) {
			if (attempt === 1) throw err
		}
		// Backoff before retry
		await new Promise((r) => setTimeout(r, 2000))
	}
}

function usePhotoUpload(reportId: string): UsePhotoUploadReturn {
	const [uploadState, setUploadState] = useState<UploadState>(INITIAL_STATE)
	const uploadPhotoMutation = useUploadPhoto(reportId)

	const reset = useCallback(() => {
		setUploadState(INITIAL_STATE)
	}, [])

	const uploadPhotos = useCallback(
		async (targetReportId: string, files: File[]) => {
			if (files.length === 0) {
				return
			}

			if (files.length > MAX_PHOTOS_PER_REPORT) {
				setUploadState({
					isUploading: false,
					progress: 0,
					error: `Maximum ${MAX_PHOTOS_PER_REPORT} photos allowed per report`,
				})
				return
			}

			setUploadState({
				isUploading: true,
				progress: 0,
				error: null,
			})

			const errors: string[] = []
			const totalFiles = files.length
			let processedCount = 0

			for (const file of files) {
				if (!validateFileType(file.type)) {
					errors.push(`${file.name}: Invalid file type. Only JPEG, PNG, and WebP are allowed.`)
					processedCount++
					continue
				}

				if (!validateFileSize(file.size)) {
					errors.push(`${file.name}: File size exceeds the 10MB limit.`)
					processedCount++
					continue
				}

				try {
					const compressed = await compressImage(file)
					const photoId = crypto.randomUUID()
					const storagePath = getStoragePath(targetReportId, photoId, 'original')
					const url = await uploadToStorage(compressed, storagePath)

					const response = await uploadPhotoMutation.mutateAsync({
						url,
						filename: file.name,
						type: undefined,
					})

					// Trigger server-side image processing (thumbnail, preview, ai variants).
					// Fire and forget — variants generate in the background. Retry once on
					// transient Supabase blips (we saw a 60s 502 in real-photo testing);
					// without a retry the photo would have no variants, forcing the AI
					// pipeline to fall back to the 1920px `original` (more tokens, no
					// preview-variant cost saving).
					processPhotoWithRetry(targetReportId, {
						photoUrl: url,
						photoId: response.photo.id,
					}).catch((err) => {
						console.warn('[upload] photo variant generation failed:', err)
					})
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Unknown error'
					errors.push(`${file.name}: ${message}`)
				}

				processedCount++
				setUploadState((prev) => ({
					...prev,
					progress: Math.round((processedCount / totalFiles) * 100),
				}))
			}

			setUploadState((prev) => ({
				...prev,
				isUploading: false,
				error: errors.length > 0 ? errors.join('\n') : null,
			}))
		},
		[uploadPhotoMutation],
	)

	return {
		uploadState,
		uploadPhotos,
		reset,
	}
}

export type { UploadState, UsePhotoUploadReturn }
export { usePhotoUpload }
