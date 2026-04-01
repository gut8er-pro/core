import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { prisma } from '@/lib/prisma'
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
					datCalculationResult: calculation.datCalculationResult,
					// BE valuation
					generalCondition: calculation.generalCondition,
					taxation: calculation.taxation,
					dataSource: calculation.dataSource,
					valuationMax: calculation.valuationMax,
					valuationAvg: calculation.valuationAvg,
					valuationMin: calculation.valuationMin,
					valuationDate: calculation.valuationDate,
					// OT valuation
					marketValue: calculation.marketValue,
					baseVehicleValue: calculation.baseVehicleValue,
					restorationValue: calculation.restorationValue,
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

	// Update calculation fields — pass through all validated fields
	if (data.calculation) {
		const updateData: Record<string, unknown> = {}
		for (const [key, val] of Object.entries(data.calculation)) {
			if (val !== undefined) updateData[key] = val
		}

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
