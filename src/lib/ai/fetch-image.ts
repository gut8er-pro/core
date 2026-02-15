// Fetches an image from a URL and returns it as base64 data.
// This is needed because Supabase Storage URLs may not be publicly
// accessible to Claude's API servers. By fetching server-side and
// sending as base64, we avoid URL accessibility issues.

type ImageData = {
	base64: string
	mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
}

async function fetchImageAsBase64(url: string): Promise<ImageData> {
	const response = await fetch(url)
	if (!response.ok) {
		throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
	}

	const contentType = response.headers.get('content-type') || 'image/jpeg'
	const arrayBuffer = await response.arrayBuffer()
	const base64 = Buffer.from(arrayBuffer).toString('base64')

	// Map content type to allowed Claude media types
	let mediaType: ImageData['mediaType'] = 'image/jpeg'
	if (contentType.includes('png')) mediaType = 'image/png'
	else if (contentType.includes('gif')) mediaType = 'image/gif'
	else if (contentType.includes('webp')) mediaType = 'image/webp'

	return { base64, mediaType }
}

export { fetchImageAsBase64 }
export type { ImageData }
