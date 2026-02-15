import { NextResponse, type NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { exportConfigSchema } from '@/lib/validations/export'
import { ReportPdfDocument, type ReportData } from '@/lib/pdf/report-template'

type RouteContext = {
	params: Promise<{ id: string }>
}

async function generatePdfResponse(reportId: string, userId: string) {
	// Fetch all report data with related records
	const report = await prisma.report.findFirst({
		where: { id: reportId, userId },
		include: {
			accidentInfo: true,
			claimantInfo: true,
			opponentInfo: true,
			vehicleInfo: true,
			condition: true,
			calculation: true,
			invoice: {
				include: {
					lineItems: {
						orderBy: { order: 'asc' },
					},
				},
			},
			exportConfig: true,
			user: {
				include: {
					business: true,
				},
			},
		},
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	// Build export config with defaults if not set
	const exportConfig = report.exportConfig ?? {
		includeVehicleValuation: false,
		includeInvoice: true,
	}

	// Assemble the data for the PDF template
	const pdfData: ReportData = {
		report: {
			id: report.id,
			title: report.title,
			createdAt: report.createdAt,
			updatedAt: report.updatedAt,
		},
		accidentInfo: report.accidentInfo
			? {
					accidentDay: report.accidentInfo.accidentDay,
					accidentScene: report.accidentInfo.accidentScene,
				}
			: null,
		claimantInfo: report.claimantInfo
			? {
					company: report.claimantInfo.company,
					salutation: report.claimantInfo.salutation,
					firstName: report.claimantInfo.firstName,
					lastName: report.claimantInfo.lastName,
					street: report.claimantInfo.street,
					postcode: report.claimantInfo.postcode,
					location: report.claimantInfo.location,
					email: report.claimantInfo.email,
					phone: report.claimantInfo.phone,
					vehicleMake: report.claimantInfo.vehicleMake,
					licensePlate: report.claimantInfo.licensePlate,
					eligibleForInputTaxDeduction: report.claimantInfo.eligibleForInputTaxDeduction,
					isVehicleOwner: report.claimantInfo.isVehicleOwner,
					representedByLawyer: report.claimantInfo.representedByLawyer,
					involvedLawyer: report.claimantInfo.involvedLawyer,
				}
			: null,
		opponentInfo: report.opponentInfo
			? {
					company: report.opponentInfo.company,
					salutation: report.opponentInfo.salutation,
					firstName: report.opponentInfo.firstName,
					lastName: report.opponentInfo.lastName,
					street: report.opponentInfo.street,
					postcode: report.opponentInfo.postcode,
					location: report.opponentInfo.location,
					email: report.opponentInfo.email,
					phone: report.opponentInfo.phone,
					insuranceCompany: report.opponentInfo.insuranceCompany,
					insuranceNumber: report.opponentInfo.insuranceNumber,
				}
			: null,
		vehicleInfo: report.vehicleInfo
			? {
					vin: report.vehicleInfo.vin,
					datsCode: report.vehicleInfo.datsCode,
					manufacturer: report.vehicleInfo.manufacturer,
					mainType: report.vehicleInfo.mainType,
					subtype: report.vehicleInfo.subtype,
					kbaNumber: report.vehicleInfo.kbaNumber,
					powerKw: report.vehicleInfo.powerKw,
					powerHp: report.vehicleInfo.powerHp,
					engineDesign: report.vehicleInfo.engineDesign,
					cylinders: report.vehicleInfo.cylinders,
					transmission: report.vehicleInfo.transmission,
					engineDisplacementCcm: report.vehicleInfo.engineDisplacementCcm,
					firstRegistration: report.vehicleInfo.firstRegistration,
					lastRegistration: report.vehicleInfo.lastRegistration,
					vehicleType: report.vehicleInfo.vehicleType,
					motorType: report.vehicleInfo.motorType,
					axles: report.vehicleInfo.axles,
					doors: report.vehicleInfo.doors,
					seats: report.vehicleInfo.seats,
					previousOwners: report.vehicleInfo.previousOwners,
				}
			: null,
		condition: report.condition
			? {
					paintType: report.condition.paintType,
					generalCondition: report.condition.generalCondition,
					bodyCondition: report.condition.bodyCondition,
					interiorCondition: report.condition.interiorCondition,
					drivingAbility: report.condition.drivingAbility,
					specialFeatures: report.condition.specialFeatures,
					mileageRead: report.condition.mileageRead,
					unit: report.condition.unit,
					notes: report.condition.notes,
					previousDamageReported: report.condition.previousDamageReported,
					existingDamageNotReported: report.condition.existingDamageNotReported,
					subsequentDamage: report.condition.subsequentDamage,
				}
			: null,
		calculation: report.calculation
			? {
					replacementValue: report.calculation.replacementValue,
					taxRate: report.calculation.taxRate,
					residualValue: report.calculation.residualValue,
					diminutionInValue: report.calculation.diminutionInValue,
					repairMethod: report.calculation.repairMethod,
					risks: report.calculation.risks,
					damageClass: report.calculation.damageClass,
					dropoutGroup: report.calculation.dropoutGroup,
					costPerDay: report.calculation.costPerDay,
					rentalCarClass: report.calculation.rentalCarClass,
					repairTimeDays: report.calculation.repairTimeDays,
					replacementTimeDays: report.calculation.replacementTimeDays,
				}
			: null,
		invoice: report.invoice
			? {
					invoiceNumber: report.invoice.invoiceNumber,
					date: report.invoice.date,
					totalNet: report.invoice.totalNet,
					totalGross: report.invoice.totalGross,
					taxRate: report.invoice.taxRate,
					lineItems: report.invoice.lineItems.map((item) => ({
						description: item.description,
						amount: item.amount,
						quantity: item.quantity,
						rate: item.rate,
						isLumpSum: item.isLumpSum,
						order: item.order,
					})),
				}
			: null,
		exportConfig: {
			includeVehicleValuation: exportConfig.includeVehicleValuation,
			includeInvoice: exportConfig.includeInvoice,
		},
		expert: {
			firstName: report.user.firstName,
			lastName: report.user.lastName,
			companyName: report.user.business?.companyName ?? null,
		},
	}

	// Render the PDF to a buffer
	const pdfBuffer = await renderToBuffer(
		ReportPdfDocument({ data: pdfData }),
	)

	// Convert Node.js Buffer to Uint8Array for NextResponse compatibility
	const pdfBytes = new Uint8Array(pdfBuffer)

	// Build a safe filename from the report title
	const safeTitle = report.title
		.replace(/[^a-zA-Z0-9_\-\s]/g, '')
		.replace(/\s+/g, '_')
		.slice(0, 60)
	const filename = `${safeTitle}_Report.pdf`

	return new NextResponse(pdfBytes, {
		status: 200,
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${filename}"`,
		},
	})
}

async function GET(request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id } = await context.params
	const { searchParams } = new URL(request.url)
	const format = searchParams.get('format')

	// If ?format=pdf, generate and return the PDF
	if (format === 'pdf') {
		try {
			return await generatePdfResponse(id, user!.id)
		} catch (pdfError) {
			console.error('PDF generation failed:', pdfError)
			return NextResponse.json(
				{ error: 'Failed to generate PDF' },
				{ status: 500 },
			)
		}
	}

	// Default: return export config JSON
	const report = await prisma.report.findFirst({
		where: { id, userId: user!.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	let exportConfig = await prisma.exportConfig.findUnique({
		where: { reportId: id },
	})

	if (!exportConfig) {
		exportConfig = await prisma.exportConfig.create({
			data: { reportId: id },
		})
	}

	return NextResponse.json({
		id: exportConfig.id,
		reportId: exportConfig.reportId,
		includeValuation: exportConfig.includeVehicleValuation,
		includeCommission: exportConfig.includeCommission,
		includeInvoice: exportConfig.includeInvoice,
		lockReport: exportConfig.lockReport,
		recipientEmail: exportConfig.recipientEmail,
		recipientName: exportConfig.recipientName,
		emailSubject: exportConfig.subject,
		emailBody: exportConfig.body,
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
	const parsed = exportConfigSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const data = parsed.data
	const updateData: Record<string, unknown> = {}

	if (data.includeValuation !== undefined) updateData.includeVehicleValuation = data.includeValuation
	if (data.includeCommission !== undefined) updateData.includeCommission = data.includeCommission
	if (data.includeInvoice !== undefined) updateData.includeInvoice = data.includeInvoice
	if (data.lockReport !== undefined) updateData.lockReport = data.lockReport
	if (data.recipientEmail !== undefined) updateData.recipientEmail = data.recipientEmail
	if (data.recipientName !== undefined) updateData.recipientName = data.recipientName
	if (data.emailSubject !== undefined) updateData.subject = data.emailSubject
	if (data.emailBody !== undefined) updateData.body = data.emailBody

	const exportConfig = await prisma.exportConfig.upsert({
		where: { reportId: id },
		create: {
			reportId: id,
			...updateData,
		},
		update: updateData,
	})

	// Touch the report's updatedAt timestamp
	await prisma.report.update({
		where: { id },
		data: { updatedAt: new Date() },
	})

	return NextResponse.json({
		id: exportConfig.id,
		reportId: exportConfig.reportId,
		includeValuation: exportConfig.includeVehicleValuation,
		includeCommission: exportConfig.includeCommission,
		includeInvoice: exportConfig.includeInvoice,
		lockReport: exportConfig.lockReport,
		recipientEmail: exportConfig.recipientEmail,
		recipientName: exportConfig.recipientName,
		emailSubject: exportConfig.subject,
		emailBody: exportConfig.body,
	})
}

export { GET, PATCH }
