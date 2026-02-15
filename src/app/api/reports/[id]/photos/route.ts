import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { MAX_PHOTOS_PER_REPORT, createPhotoSchema } from '@/lib/validations/photos'

type RouteContext = {
	params: Promise<{ id: string }>
}

async function GET(_request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id } = await context.params

	const report = await prisma.report.findFirst({
		where: { id, userId: user!.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	const photos = await prisma.photo.findMany({
		where: { reportId: id },
		orderBy: { order: 'asc' },
		include: {
			annotations: true,
		},
	})

	return NextResponse.json({ photos })
}

async function POST(request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id } = await context.params

	const report = await prisma.report.findFirst({
		where: { id, userId: user!.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	if (report.isLocked) {
		return NextResponse.json({ error: 'Report is locked' }, { status: 403 })
	}

	const photoCount = await prisma.photo.count({ where: { reportId: id } })
	if (photoCount >= MAX_PHOTOS_PER_REPORT) {
		return NextResponse.json(
			{ error: `Maximum ${MAX_PHOTOS_PER_REPORT} photos per report` },
			{ status: 400 },
		)
	}

	const body = await request.json()
	const parsed = createPhotoSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const photo = await prisma.photo.create({
		data: {
			reportId: id,
			url: parsed.data.url,
			thumbnailUrl: parsed.data.thumbnailUrl ?? null,
			previewUrl: parsed.data.previewUrl ?? null,
			filename: parsed.data.filename,
			type: parsed.data.type ?? null,
			order: photoCount,
		},
	})

	return NextResponse.json({ photo }, { status: 201 })
}

export { GET, POST }
