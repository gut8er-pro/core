// POST /api/reports/:id/calculation/auto-fill
// Analyzes damage photos and returns calculation-relevant auto-fill data.

import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { fetchImageAsBase64 } from '@/lib/ai/fetch-image'
import { extractCalculationData } from '@/lib/ai/calculation-extractor'

type RouteContext = {
	params: Promise<{ id: string }>
}

async function POST(request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id: reportId } = await context.params

	const report = await prisma.report.findFirst({
		where: { id: reportId, userId: user!.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	if (!process.env.ANTHROPIC_API_KEY) {
		return NextResponse.json({ error: 'AI service is not configured' }, { status: 503 })
	}

	const body = await request.json() as { photoIds?: string[] }
	const photoIds = body.photoIds

	// If no photo IDs provided, use all damage-type photos
	let photos
	if (photoIds && photoIds.length > 0) {
		photos = await prisma.photo.findMany({
			where: { id: { in: photoIds }, reportId },
		})
	} else {
		photos = await prisma.photo.findMany({
			where: { reportId, type: 'DAMAGE_OVERVIEW' },
			take: 5,
		})
		// If no damage photos, fall back to any photos
		if (photos.length === 0) {
			photos = await prisma.photo.findMany({
				where: { reportId },
				take: 3,
				orderBy: { order: 'asc' },
			})
		}
	}

	if (photos.length === 0) {
		return NextResponse.json({ error: 'No photos available for analysis' }, { status: 400 })
	}

	try {
		// Fetch images as base64
		const images = await Promise.all(
			photos.map((p) => fetchImageAsBase64(p.aiUrl || p.url)),
		)

		// Extract calculation data
		const result = await extractCalculationData(images)

		// Auto-fill calculation record
		const calcData: Record<string, unknown> = {}
		if (result.damageClass) calcData.damageClass = result.damageClass
		if (result.repairMethod) calcData.repairMethod = result.repairMethod
		if (result.risks) calcData.risks = result.risks
		if (result.wheelAlignment) calcData.wheelAlignment = result.wheelAlignment
		if (result.bodyMeasurements) calcData.bodyMeasurements = result.bodyMeasurements
		if (result.bodyPaint) calcData.bodyPaint = result.bodyPaint
		if (result.plasticRepair !== null) calcData.plasticRepair = result.plasticRepair
		if (result.estimatedRepairDays) calcData.repairTimeDays = result.estimatedRepairDays

		if (Object.keys(calcData).length > 0) {
			await prisma.calculation.upsert({
				where: { reportId },
				create: { reportId, ...calcData },
				update: calcData,
			})
		}

		return NextResponse.json({ result, fieldsUpdated: Object.keys(calcData) })
	} catch (err) {
		console.error('Calculation auto-fill failed:', err)
		const message = err instanceof Error ? err.message : 'Auto-fill failed'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

export { POST }
