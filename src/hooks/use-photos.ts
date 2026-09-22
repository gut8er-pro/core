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

/**
 * Moves one photo to a new index, keeping every other photo's relative position.
 * The result is the id order the server persists, so the drop and the write agree
 * on what the gallery looks like before the refetch lands.
 */
function reorderPhotos(photos: Photo[], fromId: string, toId: string): Photo[] {
	const fromIndex = photos.findIndex((photo) => photo.id === fromId)
	const toIndex = photos.findIndex((photo) => photo.id === toId)

	if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
		return photos
	}

	const next = [...photos]
	const [moved] = next.splice(fromIndex, 1)
	if (!moved) return photos
	next.splice(toIndex, 0, moved)

	return next.map((photo, index) => ({ ...photo, order: index }))
}

async function reorderPhotoRequest(reportId: string, photoIds: string[]): Promise<void> {
	const response = await fetch(`/api/reports/${reportId}/photos/reorder`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ photoIds }),
	})
	if (!response.ok) {
		throw new Error('Failed to reorder photos')
	}
}

async function rotatePhoto(
	reportId: string,
	photoId: string,
	degrees: number,
): Promise<{ photo: Photo }> {
	const response = await fetch(`/api/reports/${reportId}/photos/${photoId}/rotate`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ degrees }),
	})
	if (!response.ok) {
		throw new Error('Failed to rotate photo')
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

function useReorderPhotos(reportId: string) {
	const queryClient = useQueryClient()
	const queryKey = ['report', reportId, 'photos']

	return useMutation({
		mutationFn: ({ photoIds }: { photoIds: string[]; photos: Photo[] }) =>
			reorderPhotoRequest(reportId, photoIds),
		onMutate: async ({ photos }) => {
			await queryClient.cancelQueries({ queryKey })
			const previous = queryClient.getQueryData<{ photos: Photo[] }>(queryKey)
			queryClient.setQueryData(queryKey, { photos })
			return { previous }
		},
		onError: (_err, _vars, context) => {
			if (context?.previous) {
				queryClient.setQueryData(queryKey, context.previous)
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey })
		},
	})
}

function useRotatePhoto(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ photoId, degrees }: { photoId: string; degrees: number }) =>
			rotatePhoto(reportId, photoId, degrees),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['report', reportId, 'photos'] })
		},
	})
}

export type { Annotation, Photo, UploadErrorCode }
export {
	fetchPhotos,
	PhotoUploadError,
	reorderPhotos,
	uploadPhoto,
	useDeletePhoto,
	usePhotos,
	useReorderPhotos,
	useRotatePhoto,
	useUploadPhoto,
}
