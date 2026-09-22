import sharp from 'sharp'
import { createAdminClient } from '@/lib/supabase/server'

const STORAGE_BUCKET = 'photos'

type StorageVariant = 'original' | 'thumbnail' | 'preview' | 'ai' | 'annotated'

type VariantSpec = {
	name: Exclude<StorageVariant, 'original' | 'annotated'>
	width: number
	height: number
	quality: number
}

const VARIANT_SPECS: VariantSpec[] = [
	{ name: 'thumbnail', width: 200, height: 150, quality: 80 },
	{ name: 'preview', width: 800, height: 600, quality: 85 },
	{ name: 'ai', width: 1568, height: 1176, quality: 90 },
]

function getStoragePath(reportId: string, photoId: string, variant: StorageVariant): string {
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

/**
 * Storage serves each variant from a stable path, so a rotated re-encode lands on
 * the URL the browser already cached. The suffix moves the URL without moving the
 * object, which is what makes the new orientation show up without a hard reload.
 */
function withCacheBuster(url: string, version: number): string {
	const separator = url.includes('?') ? '&' : '?'
	return `${url}${separator}v=${version}`
}

async function renderVariants(
	reportId: string,
	photoId: string,
	originalBuffer: Buffer,
): Promise<Record<VariantSpec['name'], string>> {
	const results = await Promise.all(
		VARIANT_SPECS.map(async (spec) => {
			const buffer = await sharp(originalBuffer)
				.resize(spec.width, spec.height, { fit: 'inside', withoutEnlargement: true })
				.jpeg({ quality: spec.quality })
				.toBuffer()

			const url = await uploadBufferToStorage(buffer, getStoragePath(reportId, photoId, spec.name))
			return [spec.name, url] as const
		}),
	)

	return Object.fromEntries(results) as Record<VariantSpec['name'], string>
}

/**
 * Turns the stored bytes, not just the CSS: the PDF and the AI pipeline read the
 * variants straight from storage, so a rotation that lived only in the browser
 * would be invisible to both.
 */
async function rotateStoredPhoto(
	reportId: string,
	photoId: string,
	sourceUrl: string,
	degrees: number,
): Promise<{ url: string } & Record<VariantSpec['name'], string>> {
	const sourceBuffer = await downloadFromUrl(sourceUrl)

	const rotatedBuffer = await sharp(sourceBuffer).rotate(degrees).jpeg({ quality: 90 }).toBuffer()

	const originalUrl = await uploadBufferToStorage(
		rotatedBuffer,
		getStoragePath(reportId, photoId, 'original'),
	)
	const variants = await renderVariants(reportId, photoId, rotatedBuffer)

	const version = Date.now()
	return {
		url: withCacheBuster(originalUrl, version),
		thumbnail: withCacheBuster(variants.thumbnail, version),
		preview: withCacheBuster(variants.preview, version),
		ai: withCacheBuster(variants.ai, version),
	}
}

export type { StorageVariant, VariantSpec }
export {
	downloadFromUrl,
	getStoragePath,
	renderVariants,
	rotateStoredPhoto,
	STORAGE_BUCKET,
	uploadBufferToStorage,
	VARIANT_SPECS,
}
