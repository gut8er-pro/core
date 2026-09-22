import { createHash } from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { prisma } from '@/lib/prisma'
import {
	downloadFromUrl,
	getStoragePath,
	renderVariants,
	uploadBufferToStorage,
} from '@/lib/storage/photos-server'

type RouteContext = {
	params: Promise<{ id: string }>
}

async function POST(request: NextRequest, context: RouteContext) {
	const { user, error: authError } = await getAuthenticatedUser()
	if (authError) return unauthorizedResponse()

	const { id: reportId } = await context.params

	const report = await prisma.report.findFirst({
		where: { id: reportId, userId: user?.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	let body: { photoUrl: string; photoId: string }
	try {
		body = await request.json()
	} catch {
		return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
	}

	const { photoUrl, photoId } = body

	if (!photoUrl || typeof photoUrl !== 'string') {
		return NextResponse.json(
			{ error: 'photoUrl is required and must be a string' },
			{ status: 400 },
		)
	}

	if (!photoId || typeof photoId !== 'string') {
		return NextResponse.json({ error: 'photoId is required and must be a string' }, { status: 400 })
	}

	const photo = await prisma.photo.findFirst({
		where: { id: photoId, reportId },
	})

	if (!photo) {
		return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
	}

	let downloadedBuffer: Buffer
	try {
		downloadedBuffer = await downloadFromUrl(photoUrl)
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to download original image'
		return NextResponse.json({ error: message }, { status: 502 })
	}

	let urls: Awaited<ReturnType<typeof renderVariants>>
	let contentHash: string
	let uprightUrl = photoUrl

	try {
		// Phone cameras store the sensor orientation in EXIF rather than in the
		// pixels. Baking it in here is what keeps sideways photos out of the PDF.
		const upright = await sharp(downloadedBuffer).rotate().jpeg({ quality: 90 }).toBuffer()

		// SHA-256 of the upright bytes — the persistent AI cache key. Identical
		// images uploaded to different reports share AI analysis results.
		contentHash = createHash('sha256').update(upright).digest('hex')

		if (!upright.equals(downloadedBuffer)) {
			uprightUrl = await uploadBufferToStorage(
				upright,
				getStoragePath(reportId, photoId, 'original'),
			)
		}

		urls = await renderVariants(reportId, photoId, upright)
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Image processing failed'
		return NextResponse.json({ error: message }, { status: 500 })
	}

	await prisma.photo.update({
		where: { id: photoId },
		data: {
			url: uprightUrl,
			thumbnailUrl: urls.thumbnail,
			previewUrl: urls.preview,
			aiUrl: urls.ai,
			contentHash,
		},
	})

	return NextResponse.json({
		photoId,
		url: uprightUrl,
		thumbnailUrl: urls.thumbnail,
		previewUrl: urls.preview,
		aiUrl: urls.ai,
		contentHash,
	})
}

export { POST }
