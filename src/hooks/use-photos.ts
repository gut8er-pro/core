import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type Annotation = {
	id: string
	photoId: string
	type: string
	color: string
	coordinates: Record<string, unknown>
	fabricJson?: Record<string, unknown>
}

type Photo = {
	id: string
	reportId: string
	url: string
	thumbnailUrl: string | null
	previewUrl: string | null
	aiUrl: string | null
	annotatedUrl: string | null
	filename: string
	type: string | null
	aiClassification: string | null
	aiDescription: string | null
	order: number
	uploadedAt: string
	annotations: Annotation[]
}

async function fetchPhotos(reportId: string): Promise<{ photos: Photo[] }> {
	const response = await fetch(`/api/reports/${reportId}/photos`)
	if (!response.ok) {
		throw new Error('Failed to fetch photos')
	}
	return response.json()
}

const UPLOAD_ERROR_CODES = ['max_photos_exceeded'] as const

type UploadErrorCode = (typeof UPLOAD_ERROR_CODES)[number]

function isUploadErrorCode(value: unknown): value is UploadErrorCode {
	return (UPLOAD_ERROR_CODES as readonly unknown[]).includes(value)
}

/**
 * The upload was refused for a reason the assessor can act on.
 *
 * Its own type because the server answers with a code: the wording belongs to
 * the client, which is the only side that knows what language to use.
 */
class PhotoUploadError extends Error {
	readonly code: UploadErrorCode
	readonly limit?: number

	constructor(code: UploadErrorCode, limit?: number) {
		super(`Photo upload refused: ${code}`)
		this.name = 'PhotoUploadError'
		this.code = code
		this.limit = limit
	}
}

async function uploadPhoto(
	reportId: string,
	data: {
		url: string
		thumbnailUrl?: string
		previewUrl?: string
		filename: string
		type?: string
	},
): Promise<{ photo: Photo }> {
	const response = await fetch(`/api/reports/${reportId}/photos`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})
	if (!response.ok) {
		const body = (await response.json().catch(() => ({}))) as {
			error?: string
			limit?: number
		}
		if (isUploadErrorCode(body.error)) {
			throw new PhotoUploadError(body.error, body.limit)
		}
		throw new Error(body.error || 'Failed to upload photo')
	}
	return response.json()
}

async function deletePhoto(reportId: string, photoId: string): Promise<void> {
	const response = await fetch(`/api/reports/${reportId}/photos/${photoId}`, {
		method: 'DELETE',
	})
	if (!response.ok) {
		throw new Error('Failed to delete photo')
	}
}

function usePhotos(reportId: string) {
	return useQuery({
		queryKey: ['report', reportId, 'photos'],
		queryFn: () => fetchPhotos(reportId),
		enabled: !!reportId,
		staleTime: 30_000,
		refetchOnMount: 'always',
	})
}

function useUploadPhoto(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: {
			url: string
			thumbnailUrl?: string
			previewUrl?: string
			filename: string
			type?: string
		}) => uploadPhoto(reportId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['report', reportId, 'photos'] })
		},
	})
}

function useDeletePhoto(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (photoId: string) => deletePhoto(reportId, photoId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['report', reportId, 'photos'] })
		},
	})
}

export type { Annotation, Photo, UploadErrorCode }
export { fetchPhotos, PhotoUploadError, uploadPhoto, useDeletePhoto, usePhotos, useUploadPhoto }
