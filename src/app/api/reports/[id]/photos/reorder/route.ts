import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { prisma } from '@/lib/prisma'
import { reorderPhotosSchema } from '@/lib/validations/photos'

type RouteContext = {
	params: Promise<{ id: string }>
}

async function PATCH(request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id } = await context.params

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
	const parsed = reorderPhotosSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const { photoIds } = parsed.data
	const existing = await prisma.photo.findMany({
		where: { reportId: id },
		select: { id: true },
	})

	// A partial list would renumber some photos and leave the rest on stale
	// positions, so the whole gallery has to arrive or nothing moves.
	const existingIds = new Set(existing.map((photo) => photo.id))
	const isCompletePermutation =
		photoIds.length === existingIds.size && photoIds.every((photoId) => existingIds.has(photoId))

	if (!isCompletePermutation) {
		return NextResponse.json({ error: 'photoIds must list every photo once' }, { status: 400 })
	}

	await prisma.$transaction(
		photoIds.map((photoId, index) =>
			prisma.photo.update({ where: { id: photoId }, data: { order: index } }),
		),
	)

	const photos = await prisma.photo.findMany({
		where: { reportId: id },
		orderBy: { order: 'asc' },
		include: { annotations: true },
	})

	return NextResponse.json({ photos })
}

export { PATCH }
