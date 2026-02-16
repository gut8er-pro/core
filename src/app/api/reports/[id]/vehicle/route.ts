import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { vehicleInfoSchema } from '@/lib/validations/vehicle'

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

	const vehicleInfo = await prisma.vehicleInfo.findUnique({
		where: { reportId: id },
	})

	return NextResponse.json(vehicleInfo)
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
	const parsed = vehicleInfoSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const data = parsed.data

	// Build the data object, converting string fields to proper types
	const dbData: Record<string, unknown> = {}

	// String fields — pass through directly
	const stringFields = [
		'vin', 'datsCode', 'marketIndex', 'manufacturer',
		'mainType', 'subType', 'kbaNumber', 'engineDesign',
		'transmission', 'sourceOfTechnicalData', 'vehicleType', 'motorType',
	] as const
	for (const field of stringFields) {
		if (data[field] !== undefined) {
			dbData[field] = data[field]
		}
	}

	// Numeric fields — ensure they are numbers or null
	const numericFields = [
		'powerKw', 'powerHp', 'cylinders', 'displacement',
		'axles', 'drivenAxles', 'doors', 'seats', 'previousOwners',
	] as const
	for (const field of numericFields) {
		if (data[field] !== undefined) {
			const value = data[field]
			if (value === null || value === undefined) {
				dbData[field] = null
			} else {
				const num = Number(value)
				dbData[field] = isNaN(num) ? null : num
			}
		}
	}

	// Date fields — convert strings to Date objects
	if (data.firstRegistration !== undefined) {
		dbData.firstRegistration = data.firstRegistration
			? new Date(data.firstRegistration)
			: null
	}
	if (data.lastRegistration !== undefined) {
		dbData.lastRegistration = data.lastRegistration
			? new Date(data.lastRegistration)
			: null
	}

	const vehicleInfo = await prisma.vehicleInfo.upsert({
		where: { reportId: id },
		create: {
			reportId: id,
			...dbData,
		},
		update: dbData,
	})

	// Touch the report's updatedAt timestamp
	await prisma.report.update({
		where: { id },
		data: { updatedAt: new Date() },
	})

	return NextResponse.json(vehicleInfo)
}

export { GET, PATCH }
