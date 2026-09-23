import { renderToBuffer } from '@react-pdf/renderer'
import type { MissingInfoReport } from '@/lib/completeness'
import { getMissingInfo, isDelivered } from '@/lib/completeness/server'
import { prisma } from '@/lib/prisma'
import { type ReportData, ReportPdfDocument } from './report-template'
import { type PdfSectionSelection, sectionsFromToggles } from './sections'
import { getPdfTranslations } from './translations'

type PdfResult =
	| { buffer: Buffer; filename: string }
	/** `missingInfo` present means the gate refused, not that anything broke. */
	| { error: string; missingInfo?: MissingInfoReport }

/**
 * Generates a PDF buffer for a report.
 *
 * The single choke point both the export route (download) and the send route
 * (email attachment) call, and therefore where the completeness gate lives: an
 * incomplete Gutachten cannot be walked around by downloading it and sending it
 * by hand.
 */
async function generateReportPdfBuffer(
	reportId: string,
	userId: string,
	locale?: string,
	/** Overrides the stored toggles — the preview/send params (ticket 30). */
	sections?: PdfSectionSelection,
): Promise<PdfResult> {
	const report = await prisma.report.findFirst({
		where: { id: reportId, userId },
		include: {
			accidentInfo: true,
			claimantInfo: true,
			ownerInfo: true,
			opponentInfo: true,
			vehicleInfo: true,
			condition: {
				include: {
					damageMarkers: true,
					paintMarkers: true,
					tireSets: {
						include: { tires: { orderBy: { position: 'asc' } } },
						orderBy: { setNumber: 'asc' },
					},
				},
			},
			calculation: {
				include: {
					additionalCosts: { orderBy: { id: 'asc' } },
				},
			},
			visits: { orderBy: { date: 'asc' } },
			expertOpinion: true,
			signatures: true,
			photos: {
				orderBy: { order: 'asc' },
				select: {
					id: true,
					url: true,
					previewUrl: true,
					annotatedUrl: true,
					filename: true,
					aiClassification: true,
					aiDescription: true,
				},
			},
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
		return { error: 'Report not found' }
	}

	// A report already delivered stays downloadable forever: it passed at send
	// time, and tightening the manifest later must not retract it.
	if (!isDelivered(report)) {
		const missingInfo = await getMissingInfo(reportId, userId)
		if (missingInfo && !missingInfo.isComplete) {
			return { error: 'incomplete', missingInfo }
		}
	}

	// The composer's toggles are the default; an explicit selection (preview and
	// send pass one) wins, so what was on screen is what renders.
	const storedToggles = {
		includeVehicleValuation: report.exportConfig?.includeVehicleValuation ?? true,
		includeCommission: report.exportConfig?.includeCommission ?? true,
		includeInvoice: report.exportConfig?.includeInvoice ?? true,
	}
	const selectedSections = sections ?? sectionsFromToggles(storedToggles)

	const pdfData: ReportData = {
		report: {
			id: report.id,
			title: report.title,
			reportType: report.reportType ?? 'HS',
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
					licensePlate: report.claimantInfo.licensePlate,
					iban: report.claimantInfo.iban,
					eligibleForInputTaxDeduction: report.claimantInfo.eligibleForInputTaxDeduction,
					isVehicleOwner: report.claimantInfo.isVehicleOwner,
					representedByLawyer: report.claimantInfo.representedByLawyer,
					involvedLawyer: report.claimantInfo.involvedLawyer,
					lawyerFirm: report.claimantInfo.lawyerFirm,
					lawyerStreet: report.claimantInfo.lawyerStreet,
					lawyerPostcode: report.claimantInfo.lawyerPostcode,
					lawyerLocation: report.claimantInfo.lawyerLocation,
					lawyerEmail: report.claimantInfo.lawyerEmail,
					lawyerPhone: report.claimantInfo.lawyerPhone,
				}
			: null,
		ownerInfo: report.ownerInfo
			? {
					company: report.ownerInfo.company,
					salutation: report.ownerInfo.salutation,
					firstName: report.ownerInfo.firstName,
					lastName: report.ownerInfo.lastName,
					street: report.ownerInfo.street,
					postcode: report.ownerInfo.postcode,
					location: report.ownerInfo.location,
					email: report.ownerInfo.email,
					phone: report.ownerInfo.phone,
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
					iban: report.opponentInfo.iban,
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
					hard: report.condition.hard,
					paintCondition: report.condition.paintCondition,
					vehicleColor: report.condition.vehicleColor,
					generalCondition: report.condition.generalCondition,
					bodyCondition: report.condition.bodyCondition,
					interiorCondition: report.condition.interiorCondition,
					drivingAbility: report.condition.drivingAbility,
					emissionGroup: report.condition.emissionGroup,
					specialFeatures: report.condition.specialFeatures,
					parkingSensors: report.condition.parkingSensors,
					mileageRead: report.condition.mileageRead,
					estimateMileage: report.condition.estimateMileage,
					unit: report.condition.unit,
					nextMot: report.condition.nextMot,
					fullServiceHistory: report.condition.fullServiceHistory,
					testDrivePerformed: report.condition.testDrivePerformed,
					errorMemoryRead: report.condition.errorMemoryRead,
					airbagsDeployed: report.condition.airbagsDeployed,
					notes: report.condition.notes,
					previousDamageReported: report.condition.previousDamageReported,
					existingDamageNotReported: report.condition.existingDamageNotReported,
					subsequentDamage: report.condition.subsequentDamage,
					damageMarkers: report.condition.damageMarkers.map((m) => ({
						x: m.x,
						y: m.y,
						comment: m.comment,
					})),
					paintMarkers: report.condition.paintMarkers.map((m) => ({
						position: m.position,
						thickness: m.thickness,
					})),
					tireSets: report.condition.tireSets.map((ts) => ({
						setNumber: ts.setNumber,
						matchAndAlloy: ts.matchAndAlloy ? String(ts.matchAndAlloy) : null,
						tires: ts.tires.map((t) => ({
							position: t.position,
							size: t.size,
							profileLevel: t.profileLevel != null ? Number(t.profileLevel) : null,
							manufacturer: t.manufacturer,
							dotCode: t.dotCode,
							tireType: t.tireType,
						})),
					})),
				}
			: null,
		visits: (report.visits ?? []).map((v) => ({
			type: v.type,
			street: v.street,
			postcode: v.postcode,
			location: v.location,
			date: v.date,
			expert: v.expert,
			vehicleCondition: v.vehicleCondition,
		})),
		expertOpinion: report.expertOpinion
			? {
					expertName: report.expertOpinion.expertName,
					fileNumber: report.expertOpinion.fileNumber,
					caseDate: report.expertOpinion.caseDate,
					orderWasPlacement: report.expertOpinion.orderWasPlacement,
					issuedDate: report.expertOpinion.issuedDate,
					orderByClaimant: report.expertOpinion.orderByClaimant,
					mediator: report.expertOpinion.mediator,
				}
			: null,
		signatures: (report.signatures ?? []).map((s) => ({
			type: s.type,
			imageUrl: s.imageUrl,
		})),
		calculation: report.calculation
			? {
					replacementValue: report.calculation.replacementValue,
					taxRate: report.calculation.taxRate,
					residualValue: report.calculation.residualValue,
					diminutionInValue: report.calculation.diminutionInValue,
					wheelAlignment: report.calculation.wheelAlignment,
					bodyMeasurements: report.calculation.bodyMeasurements,
					bodyPaint: report.calculation.bodyPaint,
					plasticRepair: report.calculation.plasticRepair,
					repairMethod: report.calculation.repairMethod,
					risks: report.calculation.risks,
					damageClass: report.calculation.damageClass,
					dropoutGroup: report.calculation.dropoutGroup,
					costPerDay: report.calculation.costPerDay,
					rentalCarClass: report.calculation.rentalCarClass,
					repairTimeDays: report.calculation.repairTimeDays,
					replacementTimeDays: report.calculation.replacementTimeDays,
					// BE valuation
					generalCondition: report.calculation.generalCondition,
					taxation: report.calculation.taxation,
					dataSource: report.calculation.dataSource,
					valuationMax: report.calculation.valuationMax,
					valuationAvg: report.calculation.valuationAvg,
					valuationMin: report.calculation.valuationMin,
					valuationDate: report.calculation.valuationDate,
					// OT valuation
					marketValue: report.calculation.marketValue,
					baseVehicleValue: report.calculation.baseVehicleValue,
					restorationValue: report.calculation.restorationValue,
					additionalCosts: report.calculation.additionalCosts.map((ac) => ({
						description: ac.description,
						amount: ac.amount,
					})),
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
		photos: report.photos.map((p) => ({
			id: p.id,
			url: p.url,
			previewUrl: p.previewUrl,
			annotatedUrl: p.annotatedUrl,
			filename: p.filename,
			aiClassification: p.aiClassification,
			aiDescription: p.aiDescription,
		})),
		expert: {
			firstName: report.user.firstName,
			lastName: report.user.lastName,
			companyName: report.user.business?.companyName ?? null,
			street: report.user.business?.street ?? null,
			postcode: report.user.business?.postcode ?? null,
			city: report.user.business?.city ?? null,
			website: report.user.business?.website ?? null,
			email: report.user.business?.email ?? null,
			phone: report.user.business?.phone ?? null,
		},
	}

	const pdfLocale = locale ?? 'en'
	const t = getPdfTranslations(pdfLocale)
	const pdfBuffer = await renderToBuffer(
		ReportPdfDocument({ data: pdfData, t, locale: pdfLocale, sections: selectedSections }),
	)

	const safeTitle = report.title
		.replace(/[^a-zA-Z0-9_\-\s]/g, '')
		.replace(/\s+/g, '_')
		.slice(0, 60)
	const invoiceOnly = selectedSections.invoice && !selectedSections.report
	const filename = `${safeTitle}_${invoiceOnly ? 'Invoice' : 'Report'}.pdf`

	return { buffer: pdfBuffer, filename }
}

export type { PdfResult }
export { generateReportPdfBuffer }
