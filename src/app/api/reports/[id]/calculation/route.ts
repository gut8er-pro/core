import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { calculationPatchSchema } from '@/lib/validations/calculation'

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

	const calculation = await prisma.calculation.findUnique({
		where: { reportId: id },
		include: {
			additionalCosts: { orderBy: { id: 'asc' } },
		},
	})

	return NextResponse.json({
		calculation: calculation
			? {
					id: calculation.id,
					reportId: calculation.reportId,
					replacementValue: calculation.replacementValue,
					taxRate: calculation.taxRate,
					residualValue: calculation.residualValue,
					diminutionInValue: calculation.diminutionInValue,
					wheelAlignment: calculation.wheelAlignment,
					bodyMeasurements: calculation.bodyMeasurements,
					bodyPaint: calculation.bodyPaint,
					plasticRepair: calculation.plasticRepair,
					repairMethod: calculation.repairMethod,
					risks: calculation.risks,
					damageClass: calculation.damageClass,
					dropoutGroup: calculation.dropoutGroup,
					costPerDay: calculation.costPerDay,
					rentalCarClass: calculation.rentalCarClass,
					repairTimeDays: calculation.repairTimeDays,
					replacementTimeDays: calculation.replacementTimeDays,
				}
			: null,
		additionalCosts: calculation?.additionalCosts ?? [],
	})
}

async function PATCH(request: NextRequest, context: RouteContext) {
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

	const body = await request.json()
	const parsed = calculationPatchSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const data = parsed.data
	const results: Record<string, unknown> = {}

	// Ensure a Calculation record exists (upsert)
	let calculation = await prisma.calculation.findUnique({
		where: { reportId: id },
	})

	if (!calculation) {
		calculation = await prisma.calculation.create({
			data: { reportId: id },
		})
	}

	// Update calculation fields
	if (data.calculation) {
		const updateData: Record<string, unknown> = {}

		if (data.calculation.replacementValue !== undefined) updateData.replacementValue = data.calculation.replacementValue
		if (data.calculation.taxRate !== undefined) updateData.taxRate = data.calculation.taxRate
		if (data.calculation.residualValue !== undefined) updateData.residualValue = data.calculation.residualValue
		if (data.calculation.diminutionInValue !== undefined) updateData.diminutionInValue = data.calculation.diminutionInValue
		if (data.calculation.wheelAlignment !== undefined) updateData.wheelAlignment = data.calculation.wheelAlignment
		if (data.calculation.bodyMeasurements !== undefined) updateData.bodyMeasurements = data.calculation.bodyMeasurements
		if (data.calculation.bodyPaint !== undefined) updateData.bodyPaint = data.calculation.bodyPaint
		if (data.calculation.plasticRepair !== undefined) updateData.plasticRepair = data.calculation.plasticRepair
		if (data.calculation.repairMethod !== undefined) updateData.repairMethod = data.calculation.repairMethod
		if (data.calculation.risks !== undefined) updateData.risks = data.calculation.risks
		if (data.calculation.damageClass !== undefined) updateData.damageClass = data.calculation.damageClass
		if (data.calculation.dropoutGroup !== undefined) updateData.dropoutGroup = data.calculation.dropoutGroup
		if (data.calculation.costPerDay !== undefined) updateData.costPerDay = data.calculation.costPerDay
		if (data.calculation.rentalCarClass !== undefined) updateData.rentalCarClass = data.calculation.rentalCarClass
		if (data.calculation.repairTimeDays !== undefined) updateData.repairTimeDays = data.calculation.repairTimeDays
		if (data.calculation.replacementTimeDays !== undefined) updateData.replacementTimeDays = data.calculation.replacementTimeDays

		if (Object.keys(updateData).length > 0) {
			results.calculation = await prisma.calculation.update({
				where: { id: calculation.id },
				data: updateData,
			})
		}
	}

	// Handle additional costs
	if (data.additionalCosts) {
		const costResults = []
		for (const cost of data.additionalCosts) {
			const { id: costId, ...costData } = cost
			if (costId) {
				const existing = await prisma.additionalCost.findFirst({
					where: { id: costId, calculationId: calculation.id },
				})
				if (existing) {
					const updated = await prisma.additionalCost.update({
						where: { id: costId },
						data: costData,
					})
					costResults.push(updated)
				}
			} else {
				const created = await prisma.additionalCost.create({
					data: {
						calculationId: calculation.id,
						...costData,
					},
				})
				costResults.push(created)
			}
		}
		results.additionalCosts = costResults
	}

	// Delete additional costs
	if (data.deleteAdditionalCostIds && data.deleteAdditionalCostIds.length > 0) {
		await prisma.additionalCost.deleteMany({
			where: {
				id: { in: data.deleteAdditionalCostIds },
				calculationId: calculation.id,
			},
		})
		results.deletedAdditionalCosts = data.deleteAdditionalCostIds
	}

	// Touch the report's updatedAt timestamp
	await prisma.report.update({
		where: { id },
		data: { updatedAt: new Date() },
	})

	return NextResponse.json(results)
}

export { GET, PATCH }
