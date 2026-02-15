import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { updatePhotoSchema } from '@/lib/validations/photos'

type RouteContext = {
	params: Promise<{ id: string; photoId: string }>
}

async function GET(_request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id, photoId } = await context.params

	const report = await prisma.report.findFirst({
		where: { id, userId: user!.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	const photo = await prisma.photo.findFirst({
		where: { id: photoId, reportId: id },
		include: { annotations: true },
	})

	if (!photo) {
		return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
	}

	return NextResponse.json({ photo })
}

async function PATCH(request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id, photoId } = await context.params

	const report = await prisma.report.findFirst({
		where: { id, userId: user!.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	if (report.isLocked) {
		return NextResponse.json({ error: 'Report is locked' }, { status: 403 })
	}

	const body = await request.json()
	const parsed = updatePhotoSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const { annotations, ...photoData } = parsed.data

	const photo = await prisma.photo.update({
		where: { id: photoId },
		data: photoData,
	})

	// Handle annotations if provided
	if (annotations && annotations.length > 0) {
		// Replace existing annotations for this photo
		await prisma.annotation.deleteMany({ where: { photoId } })
		for (const ann of annotations) {
			await prisma.annotation.create({
				data: {
					photoId,
					type: ann.type,
					color: ann.color,
					coordinates: ann.coordinates as Record<string, unknown> as Parameters<typeof prisma.annotation.create>[0]['data']['coordinates'],
					fabricJson: (ann.fabricJson ?? null) as Parameters<typeof prisma.annotation.create>[0]['data']['fabricJson'],
				},
			})
		}
	}

	const updatedPhoto = await prisma.photo.findUnique({
		where: { id: photoId },
		include: { annotations: true },
	})

	return NextResponse.json({ photo: updatedPhoto })
}

async function DELETE(_request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id, photoId } = await context.params

	const report = await prisma.report.findFirst({
		where: { id, userId: user!.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	if (report.isLocked) {
		return NextResponse.json({ error: 'Report is locked' }, { status: 403 })
	}

	const photo = await prisma.photo.findFirst({
		where: { id: photoId, reportId: id },
	})

	if (!photo) {
		return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
	}

	await prisma.photo.delete({ where: { id: photoId } })

	return NextResponse.json({ success: true })
}

export { GET, PATCH, DELETE }
