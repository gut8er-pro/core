import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { prisma } from '@/lib/prisma'
import { rotateStoredPhoto } from '@/lib/storage/photos-server'
import { rotatePhotoSchema } from '@/lib/validations/photos'

type RouteContext = {
	params: Promise<{ id: string; photoId: string }>
}

async function POST(request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id, photoId } = await context.params

	const report = await prisma.report.findFirst({
		where: { id, userId: user?.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	if (report.isLocked) {
		return NextResponse.json({ error: 'Report is locked' }, { status: 403 })
	}

	const body = await request.json().catch(() => null)
	const parsed = rotatePhotoSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const photo = await prisma.photo.findFirst({
		where: { id: photoId, reportId: id },
	})

	if (!photo) {
		return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
	}

	let rotated: Awaited<ReturnType<typeof rotateStoredPhoto>>
	try {
		rotated = await rotateStoredPhoto(id, photoId, photo.url, parsed.data.degrees)
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Rotation failed'
		return NextResponse.json({ error: message }, { status: 500 })
	}

	// The markings were drawn against the old orientation, so they no longer line
	// up with anything. v1 drops them; the client warns before asking for this.
	await prisma.annotation.deleteMany({ where: { photoId } })

	const updatedPhoto = await prisma.photo.update({
		where: { id: photoId },
		data: {
			url: rotated.url,
			thumbnailUrl: rotated.thumbnail,
			previewUrl: rotated.preview,
			aiUrl: rotated.ai,
			annotatedUrl: null,
		},
		include: { annotations: true },
	})

	return NextResponse.json({ photo: updatedPhoto })
}

export { POST }
