import {
	useQuery,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'

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
	filename: string
	type: string | null
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

async function uploadPhoto(
	reportId: string,
	data: { url: string; thumbnailUrl?: string; previewUrl?: string; filename: string; type?: string },
): Promise<{ photo: Photo }> {
	const response = await fetch(`/api/reports/${reportId}/photos`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})
	if (!response.ok) {
		const error = await response.json()
		throw new Error(error.error || 'Failed to upload photo')
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
	})
}

function useUploadPhoto(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: { url: string; thumbnailUrl?: string; previewUrl?: string; filename: string; type?: string }) =>
			uploadPhoto(reportId, data),
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

export { usePhotos, useUploadPhoto, useDeletePhoto, fetchPhotos }
export type { Photo, Annotation }
