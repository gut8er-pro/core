import { createAdminClient } from '@/lib/supabase/server'

const STORAGE_BUCKET = 'photos'

type StorageVariant = 'original' | 'thumbnail' | 'preview' | 'ai'

function getStoragePath(
	reportId: string,
	photoId: string,
	variant: StorageVariant,
): string {
	return `reports/${reportId}/photos/${photoId}/${variant}.jpg`
}

async function uploadBufferToStorage(
	buffer: Buffer,
	path: string,
	contentType: string = 'image/jpeg',
): Promise<string> {
	const supabase = createAdminClient()

	const { error } = await supabase.storage
		.from(STORAGE_BUCKET)
		.upload(path, buffer, { contentType, upsert: true })

	if (error) {
		throw new Error(`Storage upload failed: ${error.message}`)
	}

	const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
	return data.publicUrl
}

async function downloadFromUrl(url: string): Promise<Buffer> {
	const response = await fetch(url)

	if (!response.ok) {
		throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
	}

	const arrayBuffer = await response.arrayBuffer()
	return Buffer.from(arrayBuffer)
}

export {
	uploadBufferToStorage,
	downloadFromUrl,
	getStoragePath,
	STORAGE_BUCKET,
}
export type { StorageVariant }
