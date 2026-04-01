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

					// Trigger server-side image processing (thumbnail, preview, ai variants)
					// Fire and forget — variant generation happens in the background
					fetch(`/api/reports/${targetReportId}/photos/process`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ photoUrl: url, photoId: response.photo.id }),
					}).catch(() => {})
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
