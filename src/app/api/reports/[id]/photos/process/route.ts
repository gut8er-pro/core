import { NextResponse, type NextRequest } from 'next/server'
import sharp from 'sharp'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import {
	uploadBufferToStorage,
	downloadFromUrl,
	getStoragePath,
} from '@/lib/storage/photos-server'

type RouteContext = {
	params: Promise<{ id: string }>
}

type VariantConfig = {
	name: 'thumbnail' | 'preview' | 'ai'
	width: number
	height: number
	quality: number
}

const VARIANT_CONFIGS: VariantConfig[] = [
	{ name: 'thumbnail', width: 200, height: 150, quality: 80 },
	{ name: 'preview', width: 800, height: 600, quality: 85 },
	{ name: 'ai', width: 1568, height: 1176, quality: 90 },
]

async function POST(request: NextRequest, context: RouteContext) {
	const { user, error: authError } = await getAuthenticatedUser()
	if (authError) return unauthorizedResponse()

	const { id: reportId } = await context.params

	const report = await prisma.report.findFirst({
		where: { id: reportId, userId: user!.id },
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
		return NextResponse.json(
			{ error: 'photoId is required and must be a string' },
			{ status: 400 },
		)
	}

	const photo = await prisma.photo.findFirst({
		where: { id: photoId, reportId },
	})

	if (!photo) {
		return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
	}

	let originalBuffer: Buffer
	try {
		originalBuffer = await downloadFromUrl(photoUrl)
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to download original image'
		return NextResponse.json({ error: message }, { status: 502 })
	}

	const urls: Record<string, string> = {}

	try {
		const results = await Promise.all(
			VARIANT_CONFIGS.map(async (config) => {
				const resizedBuffer = await sharp(originalBuffer)
					.resize(config.width, config.height, { fit: 'inside', withoutEnlargement: true })
					.jpeg({ quality: config.quality })
					.toBuffer()

				const storagePath = getStoragePath(reportId, photoId, config.name)
				const publicUrl = await uploadBufferToStorage(resizedBuffer, storagePath)

				return { name: config.name, url: publicUrl }
			}),
		)

		for (const result of results) {
			urls[result.name] = result.url
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Image processing failed'
		return NextResponse.json({ error: message }, { status: 500 })
	}

	await prisma.photo.update({
		where: { id: photoId },
		data: {
			thumbnailUrl: urls['thumbnail'],
			previewUrl: urls['preview'],
			aiUrl: urls['ai'],
		},
	})

	return NextResponse.json({
		photoId,
		thumbnailUrl: urls['thumbnail'],
		previewUrl: urls['preview'],
		aiUrl: urls['ai'],
	})
}

export { POST }
