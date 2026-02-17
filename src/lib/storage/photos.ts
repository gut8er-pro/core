import { createClient } from '@/lib/supabase/client'

const STORAGE_BUCKET = 'photos'

type StorageVariant = 'original' | 'thumbnail' | 'preview' | 'ai' | 'annotated'

function getStoragePath(
	reportId: string,
	photoId: string,
	variant: StorageVariant,
): string {
	return `reports/${reportId}/photos/${photoId}/${variant}.jpg`
}

async function compressImage(
	file: File,
	maxWidth: number = 1920,
	quality: number = 0.85,
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		const url = URL.createObjectURL(file)

		img.onload = () => {
			URL.revokeObjectURL(url)

			let { width, height } = img

			if (width > maxWidth) {
				height = Math.round((height * maxWidth) / width)
				width = maxWidth
			}

			const canvas = document.createElement('canvas')
			canvas.width = width
			canvas.height = height

			const ctx = canvas.getContext('2d')
			if (!ctx) {
				reject(new Error('Failed to get canvas 2D context'))
				return
			}

			ctx.drawImage(img, 0, 0, width, height)

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						reject(new Error('Failed to compress image'))
						return
					}
					resolve(blob)
				},
				'image/jpeg',
				quality,
			)
		}

		img.onerror = () => {
			URL.revokeObjectURL(url)
			reject(new Error('Failed to load image for compression'))
		}

		img.src = url
	})
}

async function uploadToStorage(file: File | Blob, path: string): Promise<string> {
	const supabase = createClient()

	const { error } = await supabase.storage
		.from(STORAGE_BUCKET)
		.upload(path, file, {
			contentType: 'image/jpeg',
			upsert: true,
		})

	if (error) {
		throw new Error(`Failed to upload file: ${error.message}`)
	}

	const { data: urlData } = supabase.storage
		.from(STORAGE_BUCKET)
		.getPublicUrl(path)

	return urlData.publicUrl
}

async function deleteFromStorage(path: string): Promise<void> {
	const supabase = createClient()

	const { error } = await supabase.storage
		.from(STORAGE_BUCKET)
		.remove([path])

	if (error) {
		throw new Error(`Failed to delete file: ${error.message}`)
	}
}

export {
	getStoragePath,
	compressImage,
	uploadToStorage,
	deleteFromStorage,
	STORAGE_BUCKET,
}
export type { StorageVariant }
