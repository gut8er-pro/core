import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import {
	createReportSchema,
	reportListParamsSchema,
} from '@/lib/validations/reports'

async function GET(request: NextRequest) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { searchParams } = request.nextUrl
	const params = reportListParamsSchema.safeParse({
		page: searchParams.get('page') ?? undefined,
		limit: searchParams.get('limit') ?? undefined,
		status: searchParams.get('status') ?? undefined,
		sortBy: searchParams.get('sortBy') ?? undefined,
		sortOrder: searchParams.get('sortOrder') ?? undefined,
	})

	if (!params.success) {
		return NextResponse.json(
			{ error: 'Invalid parameters', details: params.error.issues },
			{ status: 400 },
		)
	}

	const { page, limit, status, sortBy, sortOrder } = params.data
	const skip = (page - 1) * limit

	const where = {
		userId: user!.id,
		...(status ? { status } : {}),
	}

	const [reports, total] = await Promise.all([
		prisma.report.findMany({
			where,
			orderBy: { [sortBy]: sortOrder },
			skip,
			take: limit,
			include: {
				_count: { select: { photos: true } },
			},
		}),
		prisma.report.count({ where }),
	])

	return NextResponse.json({
		reports,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	})
}

async function POST(request: NextRequest) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const body = await request.json()
	const parsed = createReportSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const report = await prisma.report.create({
		data: {
			userId: user!.id,
			title: parsed.data.title,
		},
	})

	return NextResponse.json({ report }, { status: 201 })
}

export { GET, POST }
