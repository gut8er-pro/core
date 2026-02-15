import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { updateReportSchema } from '@/lib/validations/reports'

type RouteContext = {
	params: Promise<{ id: string }>
}

async function GET(_request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id } = await context.params

	const report = await prisma.report.findFirst({
		where: { id, userId: user!.id },
		include: {
			_count: { select: { photos: true } },
		},
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	return NextResponse.json({ report })
}

async function PATCH(request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id } = await context.params

	const existing = await prisma.report.findFirst({
		where: { id, userId: user!.id },
	})

	if (!existing) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	if (existing.isLocked) {
		return NextResponse.json({ error: 'Report is locked' }, { status: 403 })
	}

	const body = await request.json()
	const parsed = updateReportSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const report = await prisma.report.update({
		where: { id },
		data: parsed.data,
	})

	return NextResponse.json({ report })
}

async function DELETE(_request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id } = await context.params

	const existing = await prisma.report.findFirst({
		where: { id, userId: user!.id },
	})

	if (!existing) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	await prisma.report.delete({ where: { id } })

	return NextResponse.json({ success: true })
}

export { GET, PATCH, DELETE }
