import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { compressImage, getStoragePath, uploadToStorage } from '@/lib/storage/photos'
import {
	MAX_FILE_SIZE,
	MAX_PHOTOS_PER_REPORT,
	validateFileSize,
	validateFileType,
} from '@/lib/validations/photos'
import { PhotoUploadError, useUploadPhoto } from './use-photos'

type UploadState = {
	isUploading: boolean
	progress: number
	error: string | null
	summary: string | null
}

type UsePhotoUploadReturn = {
	uploadState: UploadState
	uploadPhotos: (reportId: string, files: File[], currentCount?: number) => Promise<void>
	reset: () => void
}

const INITIAL_STATE: UploadState = {
	isUploading: false,
	progress: 0,
	error: null,
	summary: null,
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
	const t = useTranslations('report.gallery')
	const [uploadState, setUploadState] = useState<UploadState>(INITIAL_STATE)
	const uploadPhotoMutation = useUploadPhoto(reportId)

	const reset = useCallback(() => {
		setUploadState(INITIAL_STATE)
	}, [])

	const uploadErrorMessage = useCallback(
		(err: unknown) => {
			if (err instanceof PhotoUploadError && err.code === 'max_photos_exceeded') {
				return t('maxPhotosError', { limit: err.limit ?? MAX_PHOTOS_PER_REPORT })
			}
			return t('uploadErrors.uploadFailed')
		},
		[t],
	)

	const uploadPhotos = useCallback(
		async (targetReportId: string, files: File[], currentCount = 0) => {
			if (files.length === 0) {
				return
			}

			setUploadState({
				isUploading: true,
				progress: 0,
				error: null,
				summary: null,
			})

			const errors: string[] = []
			const totalFiles = files.length
			let processedCount = 0
			let uploadedCount = 0

			// The cap counts what the report already holds, not just this batch.
			// Trimming here is what turns "some photos vanished" into a named
			// refusal per file.
			const remainingSlots = Math.max(0, MAX_PHOTOS_PER_REPORT - currentCount)
			const accepted = files.slice(0, remainingSlots)
			const overflow = files.slice(remainingSlots)

			for (const file of overflow) {
				errors.push(`${file.name}: ${t('maxPhotosError', { limit: MAX_PHOTOS_PER_REPORT })}`)
			}

			for (const file of accepted) {
				if (!validateFileType(file.type)) {
					errors.push(`${file.name}: ${t('uploadErrors.invalidFileType')}`)
					processedCount++
					continue
				}

				if (!validateFileSize(file.size)) {
					errors.push(
						`${file.name}: ${t('uploadErrors.fileTooLarge', { limit: MAX_FILE_SIZE / (1024 * 1024) })}`,
					)
					processedCount++
					continue
				}

				let compressed: Blob
				try {
					compressed = await compressImage(file)
				} catch {
					errors.push(`${file.name}: ${t('uploadErrors.compressionFailed')}`)
					processedCount++
					setUploadState((prev) => ({
						...prev,
						progress: Math.round((processedCount / totalFiles) * 100),
					}))
					continue
				}

				try {
					const photoId = crypto.randomUUID()
					const storagePath = getStoragePath(targetReportId, photoId, 'original')
					const url = await uploadToStorage(compressed, storagePath)

					const response = await uploadPhotoMutation.mutateAsync({
						url,
						filename: file.name,
						type: undefined,
					})
					uploadedCount++

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
					errors.push(`${file.name}: ${uploadErrorMessage(err)}`)
				}

				processedCount++
				setUploadState((prev) => ({
					...prev,
					progress: Math.round((processedCount / totalFiles) * 100),
				}))
			}

			const failedCount = totalFiles - uploadedCount

			setUploadState({
				isUploading: false,
				progress: 100,
				error: errors.length > 0 ? errors.join('\n') : null,
				summary:
					failedCount > 0
						? t('uploadSummaryFailed', {
								uploaded: uploadedCount,
								total: totalFiles,
								failed: failedCount,
							})
						: t('uploadSummary', { uploaded: uploadedCount, total: totalFiles }),
			})
		},
		[uploadPhotoMutation, t, uploadErrorMessage],
	)

	return {
		uploadState,
		uploadPhotos,
		reset,
	}
}

export type { UploadState, UsePhotoUploadReturn }
export { usePhotoUpload }
