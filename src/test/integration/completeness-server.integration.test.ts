/**
 * The server-side completeness seam, against a real database.
 *
 * The pure engine is covered at `src/lib/completeness/compute.test.ts`. What is
 * only testable here is the adapter: `getMissingInfo` feeds Prisma rows to the
 * same `*FromApi` mappers the browser uses, and those mappers call `.split()` on
 * date fields. A raw `Date` object throws there, so the serialisation step is
 * the thing under test as much as the manifest is.
 *
 * Requires DATABASE_URL and a database migrated to the current schema; skipped
 * otherwise. Everything it writes hangs off one throwaway user and is cascaded
 * away afterwards.
 *
 * @vitest-environment node
 */

import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getMissingInfo } from '@/lib/completeness/server'
import { prisma } from '@/lib/prisma'

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip

describeWithDb('getMissingInfo', () => {
	let userId: string

	beforeAll(async () => {
		const user = await prisma.user.create({
			data: { email: `completeness-${randomUUID()}@gut8erpro.test` },
		})
		userId = user.id
	})

	afterAll(async () => {
		// Reports, and everything hanging off them, cascade from the user.
		await prisma.user.delete({ where: { id: userId } })
	})

	async function createReport(reportType: string) {
		const report = await prisma.report.create({
			data: { userId, reportType, title: `${reportType} completeness test` },
		})
		return report.id
	}

	it('reports a freshly created liability report as incomplete', async () => {
		const reportId = await createReport('HS')

		const missingInfo = await getMissingInfo(reportId, userId)

		expect(missingInfo).not.toBeNull()
		expect(missingInfo?.isComplete).toBe(false)
		expect(missingInfo?.tabs.gallery.missingPaths).toContain('photos')
		expect(missingInfo?.tabs.accidentInfo.missingPaths).toContain('accidentDay')
		expect(missingInfo?.tabs.condition.missingPaths).toContain('airbagsDeployed')
		expect(missingInfo?.tabs.invoice.missingPaths).toContain('recipientId')
	})

	it('does not choke on the date columns, and counts them as filled', async () => {
		const reportId = await createReport('HS')

		await prisma.accidentInfo.create({
			data: { reportId, accidentDay: new Date('2026-03-01'), accidentScene: 'A7, km 42' },
		})
		await prisma.expertOpinion.create({
			data: {
				reportId,
				expertName: 'Kent Torres',
				fileNumber: 'HB3351',
				caseDate: new Date('2026-03-02'),
				issuedDate: new Date('2026-03-05'),
			},
		})
		await prisma.visit.create({
			data: {
				reportId,
				type: 'claimant_residence',
				location: 'Bremen',
				date: new Date('2026-03-02'),
				expert: 'Kent Torres',
			},
		})
		await prisma.vehicleInfo.create({
			data: { reportId, firstRegistration: new Date('2018-04-01') },
		})
		await prisma.vehicleCondition.create({
			data: { reportId, nextMot: new Date('2027-04-01') },
		})
		await prisma.invoice.create({ data: { reportId, date: new Date('2026-03-06') } })

		const missingInfo = await getMissingInfo(reportId, userId)

		expect(missingInfo?.tabs.accidentInfo.missingPaths).not.toContain('accidentDay')
		expect(missingInfo?.tabs.accidentInfo.missingPaths).not.toContain('caseDate')
		expect(missingInfo?.tabs.accidentInfo.missingPaths).not.toContain('issuedDate')
		expect(missingInfo?.tabs.accidentInfo.missingPaths).not.toContain('visits.0.date')
		expect(missingInfo?.tabs.vehicle.missingPaths).not.toContain('firstRegistration')
		expect(missingInfo?.tabs.condition.missingPaths).not.toContain('nextMot')
		expect(missingInfo?.tabs.invoice.missingPaths).not.toContain('date')
	})

	it('reads the BE valuation date, which is a date column on the wire and a string in the form', async () => {
		const reportId = await createReport('BE')

		await prisma.calculation.create({
			data: { reportId, valuationDate: new Date('2026-03-04') },
		})

		const missingInfo = await getMissingInfo(reportId, userId)

		expect(missingInfo?.tabs.calculation.missingPaths).not.toContain('valuationDate')
	})

	it('distinguishes an explicit "no" from an unanswered finding', async () => {
		const reportId = await createReport('HS')
		await prisma.vehicleCondition.create({
			data: { reportId, airbagsDeployed: false },
		})

		const missingInfo = await getMissingInfo(reportId, userId)

		expect(missingInfo?.tabs.condition.missingPaths).not.toContain('airbagsDeployed')
		expect(missingInfo?.tabs.condition.missingPaths).toContain('errorMemoryRead')
	})

	it('reads the oldtimer grading table an OT report is judged on', async () => {
		const reportId = await createReport('OT')

		const before = await getMissingInfo(reportId, userId)
		expect(before?.tabs.condition.missingPaths).toContain('gradingBodywork')
		expect(before?.tabs.condition.missingPaths).toContain('gradingOverall')

		await prisma.oldtimerDetails.create({
			data: {
				reportId,
				gradingBodywork: '2',
				gradingTires: '3',
				gradingPaint: '2',
				gradingInterior: '2',
				gradingChrome: '3',
				gradingEngineBay: '2',
				gradingSeals: '3',
				gradingEngine: '2',
				gradingGlass: '2',
				gradingTrunk: '3',
				gradingOverall: '2',
			},
		})

		const after = await getMissingInfo(reportId, userId)

		expect(after?.tabs.condition.missingPaths.some((path) => path.startsWith('grading'))).toBe(
			false,
		)
	})

	it('reports a fully filled liability report as complete', async () => {
		const reportId = await createReport('HS')

		await prisma.photo.create({
			data: { reportId, url: 'https://example.test/front.jpg', filename: 'front.jpg' },
		})
		await prisma.accidentInfo.create({
			data: { reportId, accidentDay: new Date('2026-03-01'), accidentScene: 'A7, km 42' },
		})
		await prisma.claimantInfo.create({
			data: {
				reportId,
				lastName: 'Müller',
				street: 'Bahnhofstraße 12',
				postcode: '28195',
				location: 'Bremen',
				email: 'hans@mueller.test',
				licensePlate: 'HB AB 1234',
				representedByLawyer: false,
			},
		})
		await prisma.opponentInfo.create({
			data: {
				reportId,
				lastName: 'Schmidt',
				insuranceCompany: 'HUK',
				insuranceNumber: 'VS-1234',
			},
		})
		await prisma.visit.create({
			data: {
				reportId,
				type: 'claimant_residence',
				location: 'Bremen',
				date: new Date('2026-03-02'),
				expert: 'Kent Torres',
			},
		})
		await prisma.expertOpinion.create({
			data: {
				reportId,
				expertName: 'Kent Torres',
				fileNumber: 'HB3351',
				caseDate: new Date('2026-03-02'),
				issuedDate: new Date('2026-03-05'),
			},
		})
		await prisma.signature.create({
			data: { reportId, type: 'DATA_PERMISSION', imageUrl: 'data:image/png;base64,x' },
		})
		await prisma.vehicleInfo.create({
			data: {
				reportId,
				vin: 'WVWZZZ3CZWE123456',
				manufacturer: 'Volkswagen AG',
				mainType: 'Golf VII',
				kbaNumber: '0603/BGH',
				firstRegistration: new Date('2018-04-01'),
				powerKw: 110,
				engineDisplacementCcm: 1968,
				transmission: 'Manual (6-speed)',
				sourceOfTechnicalData: 'KBA',
				vehicleType: 'compact',
				motorType: 'diesel',
				doors: 4,
				seats: 5,
			},
		})
		const condition = await prisma.vehicleCondition.create({
			data: {
				reportId,
				mileageRead: 125450,
				nextMot: new Date('2027-04-01'),
				vehicleColor: 'Schwarz',
				paintType: 'Metallic',
				paintCondition: 'Good',
				generalCondition: 'Average',
				bodyCondition: 'Minor cosmetic',
				interiorCondition: 'Minor wear',
				drivingAbility: 'Roadworthy',
				airbagsDeployed: true,
				errorMemoryRead: false,
				previousDamageReported: 'Keine',
			},
		})
		await prisma.damageMarker.create({ data: { conditionId: condition.id, x: 10, y: 10 } })
		await prisma.paintMarker.create({
			data: { conditionId: condition.id, x: 10, y: 10, thickness: 120 },
		})
		const tireSet = await prisma.tireSet.create({
			data: { conditionId: condition.id, setNumber: 1 },
		})
		await prisma.tire.create({
			data: { tireSetId: tireSet.id, position: 'VL', size: '205/55 R16', profileLevel: '6' },
		})
		await prisma.calculation.create({
			data: {
				reportId,
				replacementValue: 25000,
				residualValue: 18000,
				taxRate: '19',
				damageClass: 'III',
				diminutionInValue: 3500,
				repairMethod: 'Instandsetzung',
				dropoutGroup: 'C',
				costPerDay: 59,
				repairTimeDays: 7,
			},
		})
		const invoice = await prisma.invoice.create({
			data: {
				reportId,
				invoiceNumber: 'GH-3552-2026',
				date: new Date('2026-03-06'),
				recipientId: 'individual',
			},
		})
		await prisma.invoiceLineItem.create({
			data: { invoiceId: invoice.id, description: 'BVSK Appraisal Fee', rate: 890 },
		})

		const missingInfo = await getMissingInfo(reportId, userId)

		expect(missingInfo?.missingCount).toBe(0)
		expect(missingInfo?.isComplete).toBe(true)
		expect(missingInfo?.completionPercentage).toBe(100)
	})

	it('refuses to answer for a report belonging to someone else', async () => {
		const reportId = await createReport('HS')

		expect(await getMissingInfo(reportId, randomUUID())).toBeNull()
	})
})
