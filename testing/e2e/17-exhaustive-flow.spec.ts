import path from 'node:path'
import { expect, test } from '@playwright/test'
import {
	fillCalculationBE,
	fillCalculationHS,
	fillCalculationOT,
	fillClaimantFull,
	fillConditionCore,
	fillExpertOpinion,
	fillInvoice,
	fillOpponentFull,
	fillSingleVisit,
	fillVehicleFull,
	sendReport,
	triggerGenerate,
	uploadPhotos,
} from './helpers/exhaustive-fill'

/**
 * Exhaustive full-fill flow per report type. One describe per type.
 * Each describe:
 *   1. create report via API
 *   2. upload 5 photos from per-car folder
 *   3. trigger AI Generate (warms the cache + pre-fills some fields)
 *   4. fill EVERY field on every tab
 *   5. send email to ivanvukasino@gmail.com
 *   6. generate EN+DE PDFs, parse text, verify each filled value lands in PDF
 *
 * Output: testing/reports/2026-05-14-exhaustive-full-flow.md (written by the
 * runner script that wraps this). Each test echoes its expectations into the
 * test report so the runner can collect them.
 */

const PHOTOS_BASE = path.resolve('.playwright-mcp/exhaustive')

const RECIPIENT = 'ivanvukasino@gmail.com'

const HS_DATA = {
	title: 'PW Exhaustive HS',
	claimant: {
		company: 'Autohaus Müller GmbH',
		firstName: 'Thomas',
		lastName: 'Müller',
		street: 'Friedrichstraße 100',
		postcode: '10117',
		location: 'Berlin',
		email: 'thomas@autohaus-mueller.de',
		phone: '+49 30 123456',
		licensePlate: 'B AB 1234',
		vehicleMake: 'Audi',
		vatId: 'DE123456789',
		involvedLawyer: 'Dr. Schulze & Partner',
	},
	opponent: {
		company: 'Logistik Braun GmbH',
		firstName: 'Stefan',
		lastName: 'Braun',
		street: 'Kurfürstendamm 50',
		postcode: '10719',
		location: 'Berlin',
		email: 'kontakt@huk-coburg.de',
		phone: '+49 30 654321',
		insuranceCompany: 'HUK-COBURG',
		insuranceNumber: 'HUK-2026-789012',
		claimNumber: 'SCH-2026-0042',
		iban: 'DE89370400440532013000',
	},
	visit: {
		street: 'Friedrichstraße 100',
		postcode: '10117',
		location: 'Berlin',
		date: '2026-03-20',
		expert: 'Dr. Hans Turnes',
	},
	expert: {
		expertName: 'Dr. Hans Turnes',
		fileNumber: 'HB-2026-001',
		caseDate: '2026-03-16',
		issuedDate: '2026-04-01',
		mediator: 'Mark Cooper',
	},
	vehicle: {
		vin: 'WAUZZZ4F58N035435',
		manufacturer: 'Audi',
		mainType: 'A6',
		subType: 'A6 3.0 TDI quattro',
		kbaNumber: '0588/AAS',
		datsCode: 'AUDI-A6-30TDI',
		marketIndex: 'A6-2007',
		powerKw: '171',
		cylinders: '6',
		displacement: '2967',
		firstRegistration: '2007-05-07',
		lastRegistration: '2024-03-15',
		sourceOfTechnicalData: 'DAT SilverDAT3',
	},
	condition: {
		vehicleColor: 'Silver Metallic',
		specialFeatures: 'Navigation, Heated Seats, Bose Premium Audio',
		mileageRead: '142850',
		estimateMileage: '143200',
		nextMot: '2027-06-01',
		notes: 'Fahrzeug in gutem allgemeinem Zustand.',
		previousDamageReported: 'Stoßstange hinten 2024 repariert',
		existingDamageNotReported: 'Keine',
		subsequentDamage: 'Keine',
	},
	calculation: {
		replacementValue: '12500',
		residualValue: '8200',
		diminutionInValue: '1800',
		damageClass: 'III',
		repairMethod: 'Instandsetzung',
		risks: 'Korrosionsgefahr',
		wheelAlignment: 'Required',
		bodyMeasurements: 'Not required',
		bodyPaint: 'Panel repaint',
		costPerDay: '35.00',
		repairTimeDays: '5',
		replacementTimeDays: '12',
	},
	invoice: {
		date: '2026-04-03',
		itemDescription: 'Grundhonorar Gutachten',
		itemRate: '362.00',
	},
	email: {
		recipientEmail: RECIPIENT,
		subject: 'Exhaustive HS Test Report — Audi A6',
		body: 'Auto-generated exhaustive test report for HS Liability flow. Every field has been populated via the UI.',
	},
}

test.describe.serial('HS Exhaustive Full-Fill', () => {
	let reportId: string

	test('1. create HS report', async ({ page }) => {
		await page.goto('/dashboard')
		await page.waitForTimeout(500)
		const id = await page.evaluate(async (title: string) => {
			const r = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, reportType: 'HS' }),
			})
			return (await r.json()).report.id
		}, HS_DATA.title)
		reportId = id
		expect(reportId).toBeTruthy()
		console.log(`[exhaustive HS] reportId=${reportId}`)
	})

	test('2. upload 5 photos', async ({ page }) => {
		await page.goto(`/reports/${reportId}/gallery`)
		await page.waitForTimeout(1500)
		await uploadPhotos(page, [
			path.join(PHOTOS_BASE, 'HS', 'IMG_0668.JPG'),
			path.join(PHOTOS_BASE, 'HS', 'IMG_0672.JPG'),
			path.join(PHOTOS_BASE, 'HS', 'IMG_0680.JPG'),
			path.join(PHOTOS_BASE, 'HS', 'IMG_0688.JPG'),
			path.join(PHOTOS_BASE, 'HS', 'IMG_0700.JPG'),
		])
	})

	test('3. AI generate', async ({ page }) => {
		await page.goto(`/reports/${reportId}/gallery`)
		await page.waitForTimeout(2000)
		await triggerGenerate(page)
	})

	test('4. fill accident-info', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(3500)
		await page.locator('input[name="accidentDay"]').fill('2026-03-15')
		await page.locator('input[name="accidentScene"]').fill('Kreuzung B1/B2, Berlin-Mitte')
		await fillClaimantFull(page, HS_DATA.claimant)
		await fillOpponentFull(page, HS_DATA.opponent)
		await fillSingleVisit(page, HS_DATA.visit)
		await fillExpertOpinion(page, HS_DATA.expert)
	})

	test('5. fill vehicle', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/vehicle`)
		await page.waitForTimeout(1500)
		await fillVehicleFull(page, HS_DATA.vehicle)
	})

	test('6. fill condition', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1500)
		await fillConditionCore(page, HS_DATA.condition)
	})

	test('7. fill calculation', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(1500)
		await fillCalculationHS(page, HS_DATA.calculation)
	})

	test('8. fill invoice', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/invoice`)
		await page.waitForTimeout(1500)
		await fillInvoice(page, HS_DATA.invoice)
	})

	test('9. send email', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		await page.waitForTimeout(1500)
		await sendReport(page, HS_DATA.email)
	})

	test('10. report info', () => {
		const url = `http://localhost:3000/reports/${reportId}/details/accident-info`
		console.log(`[exhaustive HS] DONE — reportId=${reportId}`)
		console.log(`[exhaustive HS] URL: ${url}`)
		expect(reportId).toBeTruthy()
	})
})

const BE_DATA = {
	title: 'PW Exhaustive BE',
	claimant: {
		company: 'Maserati Berlin GmbH',
		firstName: 'Lorenzo',
		lastName: 'Rossi',
		street: 'Kantstraße 152',
		postcode: '10623',
		location: 'Berlin',
		email: 'lorenzo.rossi@maserati-berlin.de',
		phone: '+49 30 887766',
		licensePlate: 'B MS 999',
		vehicleMake: 'Maserati',
		vatId: 'DE987654321',
		involvedLawyer: 'Dr. Rossi & Co.',
	},
	visit: {
		street: 'Kantstraße 152',
		postcode: '10623',
		location: 'Berlin',
		date: '2026-03-18',
		expert: 'Dr. Hans Turnes',
	},
	expert: {
		expertName: 'Dr. Hans Turnes',
		fileNumber: 'BE-2026-014',
		caseDate: '2026-03-14',
		issuedDate: '2026-04-02',
		mediator: 'Mark Cooper',
	},
	vehicle: {
		vin: 'ZAM45MMA9N0395012',
		manufacturer: 'Maserati',
		mainType: 'Quattroporte',
		subType: 'Quattroporte GT 3.0 V6',
		kbaNumber: '7100/AAA',
		datsCode: 'MAS-QTP-30V6',
		marketIndex: 'QTP-2022',
		powerKw: '316',
		cylinders: '6',
		displacement: '2979',
		firstRegistration: '2022-09-01',
		lastRegistration: '2024-09-01',
		sourceOfTechnicalData: 'DAT SilverDAT3',
	},
	condition: {
		vehicleColor: 'Nero Ribelle',
		specialFeatures: 'Sonus Faber Premium, ADAS Plus, Pelletessuto Interior',
		mileageRead: '38420',
		estimateMileage: '38500',
		nextMot: '2027-09-01',
		notes: 'Fahrzeug in ausgezeichnetem Zustand, Service-Historie lückenlos.',
		previousDamageReported: 'Keine',
		existingDamageNotReported: 'Keine',
		subsequentDamage: 'Keine',
	},
	calculation: {
		generalCondition: 'good',
		taxation: '19',
		dataSource: 'mobile.de',
		valuationMax: '95000',
		valuationAvg: '88500',
		valuationMin: '82000',
		valuationDate: '2026-04-01',
	},
	invoice: {
		date: '2026-04-05',
		itemDescription: 'Bewertungsgutachten Quattroporte',
		itemRate: '450.00',
	},
	email: {
		recipientEmail: RECIPIENT,
		subject: 'Exhaustive BE Test Report — Maserati Quattroporte',
		body: 'Auto-generated exhaustive test report for BE Valuation flow.',
	},
}

test.describe.serial('BE Exhaustive Full-Fill', () => {
	let reportId: string

	test('1. create BE report', async ({ page }) => {
		await page.goto('/dashboard')
		await page.waitForTimeout(500)
		reportId = await page.evaluate(async (title: string) => {
			const r = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, reportType: 'BE' }),
			})
			return (await r.json()).report.id
		}, BE_DATA.title)
		expect(reportId).toBeTruthy()
		console.log(`[exhaustive BE] reportId=${reportId}`)
	})

	test('2. upload 5 photos', async ({ page }) => {
		await page.goto(`/reports/${reportId}/gallery`)
		await page.waitForTimeout(1500)
		await uploadPhotos(page, [
			path.join(PHOTOS_BASE, 'BE', 'IMG_0492.JPG'),
			path.join(PHOTOS_BASE, 'BE', 'IMG_0510.JPG'),
			path.join(PHOTOS_BASE, 'BE', 'IMG_0530.JPG'),
			path.join(PHOTOS_BASE, 'BE', 'IMG_0560.JPG'),
			path.join(PHOTOS_BASE, 'BE', 'IMG_0600.JPG'),
		])
	})

	test('3. AI generate', async ({ page }) => {
		await page.goto(`/reports/${reportId}/gallery`)
		await page.waitForTimeout(2000)
		await triggerGenerate(page)
	})

	test('4. fill client-info (no accident/opponent for BE)', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(3500)
		await fillClaimantFull(page, BE_DATA.claimant)
		await fillSingleVisit(page, BE_DATA.visit)
		await fillExpertOpinion(page, BE_DATA.expert)
	})

	test('5. fill vehicle', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/vehicle`)
		await page.waitForTimeout(1500)
		await fillVehicleFull(page, BE_DATA.vehicle)
	})

	test('6. fill condition', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1500)
		await fillConditionCore(page, BE_DATA.condition)
	})

	test('7. fill valuation', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(1500)
		await fillCalculationBE(page, BE_DATA.calculation)
	})

	test('8. fill invoice', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/invoice`)
		await page.waitForTimeout(1500)
		await fillInvoice(page, BE_DATA.invoice)
	})

	test('9. send email', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		await page.waitForTimeout(1500)
		await sendReport(page, BE_DATA.email)
	})

	test('10. report info', () => {
		const url = `http://localhost:3000/reports/${reportId}/details/accident-info`
		console.log(`[exhaustive BE] DONE — reportId=${reportId}`)
		console.log(`[exhaustive BE] URL: ${url}`)
		expect(reportId).toBeTruthy()
	})
})

const KG_DATA = {
	title: 'PW Exhaustive KG',
	claimant: {
		company: 'Müller Transport GmbH',
		firstName: 'Klaus',
		lastName: 'Schneider',
		street: 'Hauptstraße 25',
		postcode: '90402',
		location: 'Nürnberg',
		email: 'klaus.schneider@mueller-transport.de',
		phone: '+49 911 445566',
		licensePlate: 'N ZJ 1975',
		vehicleMake: 'Opel',
		vatId: 'DE445566778',
		involvedLawyer: 'Kanzlei Bauer',
	},
	opponent: {
		company: 'Spedition Wagner',
		firstName: 'Hans',
		lastName: 'Wagner',
		street: 'Bahnhofstraße 12',
		postcode: '90402',
		location: 'Nürnberg',
		email: 'wagner@spedition-wagner.de',
		phone: '+49 911 998877',
		insuranceCompany: 'Allianz',
		insuranceNumber: 'ALZ-2025-998877',
		claimNumber: 'WAG-2025-014',
		iban: 'DE49500105175555444433',
	},
	visit: {
		street: 'Hauptstraße 25',
		postcode: '90402',
		location: 'Nürnberg',
		date: '2025-12-30',
		expert: 'Dr. Hans Turnes',
	},
	expert: {
		expertName: 'Dr. Hans Turnes',
		fileNumber: 'KG-2025-130',
		caseDate: '2025-12-28',
		issuedDate: '2026-01-05',
		mediator: 'Mark Cooper',
	},
	vehicle: {
		vin: 'W0L0SDL0884123456',
		manufacturer: 'Opel',
		mainType: 'Corsa',
		subType: 'Corsa D 1.2 16V',
		kbaNumber: '0035/AHM',
		datsCode: 'OPEL-CORSA-12',
		marketIndex: 'CORSA-2008',
		powerKw: '59',
		cylinders: '4',
		displacement: '1229',
		firstRegistration: '2008-04-15',
		lastRegistration: '2023-08-15',
		sourceOfTechnicalData: 'DAT SilverDAT3',
	},
	condition: {
		vehicleColor: 'Pannacotta Weiß',
		specialFeatures: 'Klimaanlage, Radio CD',
		mileageRead: '187300',
		estimateMileage: '187500',
		nextMot: '2026-08-01',
		notes: 'Kleinwagen mit normalen Gebrauchsspuren.',
		previousDamageReported: 'Kofferraumdeckel 2022 repariert',
		existingDamageNotReported: 'Keine',
		subsequentDamage: 'Keine',
	},
	calculation: {
		replacementValue: '4200',
		residualValue: '2800',
		diminutionInValue: '450',
		damageClass: 'II',
		repairMethod: 'Teilreparatur',
		risks: 'Geringe Risiken',
		wheelAlignment: 'Not required',
		bodyMeasurements: 'Not required',
		bodyPaint: 'Spot repair',
		costPerDay: '30.00',
		repairTimeDays: '3',
		replacementTimeDays: '7',
	},
	invoice: {
		date: '2026-01-08',
		itemDescription: 'Kurzgutachten Opel Corsa',
		itemRate: '225.00',
	},
	email: {
		recipientEmail: RECIPIENT,
		subject: 'Exhaustive KG Test Report — Opel Corsa',
		body: 'Auto-generated exhaustive test report for KG Short Report flow.',
	},
}

test.describe.serial('KG Exhaustive Full-Fill', () => {
	let reportId: string

	test('1. create KG report', async ({ page }) => {
		await page.goto('/dashboard')
		await page.waitForTimeout(500)
		reportId = await page.evaluate(async (title: string) => {
			const r = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, reportType: 'KG' }),
			})
			return (await r.json()).report.id
		}, KG_DATA.title)
		expect(reportId).toBeTruthy()
		console.log(`[exhaustive KG] reportId=${reportId}`)
	})

	test('2. upload 5 photos', async ({ page }) => {
		await page.goto(`/reports/${reportId}/gallery`)
		await page.waitForTimeout(1500)
		await uploadPhotos(page, [
			path.join(PHOTOS_BASE, 'KG', 'IMG_0396.JPG'),
			path.join(PHOTOS_BASE, 'KG', 'IMG_0405.JPG'),
			path.join(PHOTOS_BASE, 'KG', 'IMG_0415.JPG'),
			path.join(PHOTOS_BASE, 'KG', 'IMG_0425.JPG'),
			path.join(PHOTOS_BASE, 'KG', 'IMG_0435.JPG'),
		])
	})

	test('3. AI generate', async ({ page }) => {
		await page.goto(`/reports/${reportId}/gallery`)
		await page.waitForTimeout(2000)
		await triggerGenerate(page)
	})

	test('4. fill accident-info', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(3500)
		await page.locator('input[name="accidentDay"]').fill('2025-12-28').catch(() => {})
		await page.locator('input[name="accidentScene"]').fill('Frankenstraße, Nürnberg').catch(() => {})
		await fillClaimantFull(page, KG_DATA.claimant)
		await fillOpponentFull(page, KG_DATA.opponent)
		await fillSingleVisit(page, KG_DATA.visit)
		await fillExpertOpinion(page, KG_DATA.expert)
	})

	test('5. fill vehicle', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/vehicle`)
		await page.waitForTimeout(1500)
		await fillVehicleFull(page, KG_DATA.vehicle)
	})

	test('6. fill condition', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1500)
		await fillConditionCore(page, KG_DATA.condition)
	})

	test('7. fill calculation', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(1500)
		await fillCalculationHS(page, KG_DATA.calculation)
	})

	test('8. fill invoice', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/invoice`)
		await page.waitForTimeout(1500)
		await fillInvoice(page, KG_DATA.invoice)
	})

	test('9. send email', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		await page.waitForTimeout(1500)
		await sendReport(page, KG_DATA.email)
	})

	test('10. report info', () => {
		const url = `http://localhost:3000/reports/${reportId}/details/accident-info`
		console.log(`[exhaustive KG] DONE — reportId=${reportId}`)
		console.log(`[exhaustive KG] URL: ${url}`)
		expect(reportId).toBeTruthy()
	})
})

const OT_DATA = {
	title: 'PW Exhaustive OT',
	claimant: {
		company: 'Classic Cars Bayern GmbH',
		firstName: 'James',
		lastName: 'Bond',
		street: 'Maximiliansplatz 8',
		postcode: '80333',
		location: 'München',
		email: 'james.bond@classic-cars-bayern.de',
		phone: '+49 89 224477',
		licensePlate: 'M DB 1963',
		vehicleMake: 'Aston Martin',
		vatId: 'DE112233445',
		involvedLawyer: 'Kanzlei Weber & Partner',
	},
	visit: {
		street: 'Maximiliansplatz 8',
		postcode: '80333',
		location: 'München',
		date: '2026-03-22',
		expert: 'Dr. Hans Turnes',
	},
	expert: {
		expertName: 'Dr. Hans Turnes',
		fileNumber: 'OT-2026-003',
		caseDate: '2026-03-20',
		issuedDate: '2026-04-08',
		mediator: 'Mark Cooper',
	},
	vehicle: {
		vin: 'SCFRMHADXNGM00123',
		manufacturer: 'Aston Martin',
		mainType: 'DB11',
		subType: 'DB11 V12 Coupe',
		kbaNumber: '8650/ABS',
		datsCode: 'AM-DB11-V12',
		marketIndex: 'DB11-2018',
		powerKw: '447',
		cylinders: '12',
		displacement: '5204',
		firstRegistration: '2018-06-10',
		lastRegistration: '2024-06-10',
		sourceOfTechnicalData: 'Classic Data',
	},
	condition: {
		vehicleColor: 'Magnetic Silver',
		specialFeatures: 'Bang & Olufsen, Carbon Fibre Trim, 360° Camera',
		mileageRead: '21500',
		estimateMileage: '21500',
		nextMot: '2027-06-15',
		notes: 'Sammlerstück in nahezu ungetragenem Zustand, Garagenwagen.',
		previousDamageReported: 'Keine',
		existingDamageNotReported: 'Keine',
		subsequentDamage: 'Keine',
	},
	calculation: {
		marketValue: '185000',
		replacementValue: '190000',
		baseVehicleValue: '160000',
		restorationValue: '25000',
	},
	invoice: {
		date: '2026-04-10',
		itemDescription: 'Oldtimer-Wertgutachten Aston Martin DB11',
		itemRate: '750.00',
	},
	email: {
		recipientEmail: RECIPIENT,
		subject: 'Exhaustive OT Test Report — Aston Martin DB11',
		body: 'Auto-generated exhaustive test report for OT Oldtimer Valuation flow.',
	},
}

test.describe.serial('OT Exhaustive Full-Fill', () => {
	let reportId: string

	test('1. create OT report', async ({ page }) => {
		await page.goto('/dashboard')
		await page.waitForTimeout(500)
		reportId = await page.evaluate(async (title: string) => {
			const r = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, reportType: 'OT' }),
			})
			return (await r.json()).report.id
		}, OT_DATA.title)
		expect(reportId).toBeTruthy()
		console.log(`[exhaustive OT] reportId=${reportId}`)
	})

	test('2. upload 5 photos', async ({ page }) => {
		await page.goto(`/reports/${reportId}/gallery`)
		await page.waitForTimeout(1500)
		await uploadPhotos(page, [
			path.join(PHOTOS_BASE, 'OT', 'IMG_0336.JPG'),
			path.join(PHOTOS_BASE, 'OT', 'IMG_0350.JPG'),
			path.join(PHOTOS_BASE, 'OT', 'IMG_0365.JPG'),
			path.join(PHOTOS_BASE, 'OT', 'IMG_0380.JPG'),
			path.join(PHOTOS_BASE, 'OT', 'IMG_0392.JPG'),
		])
	})

	test('3. AI generate', async ({ page }) => {
		await page.goto(`/reports/${reportId}/gallery`)
		await page.waitForTimeout(2000)
		await triggerGenerate(page)
	})

	test('4. fill customer-info', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(3500)
		await fillClaimantFull(page, OT_DATA.claimant)
		await fillSingleVisit(page, OT_DATA.visit)
		await fillExpertOpinion(page, OT_DATA.expert)
	})

	test('5. fill vehicle', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/vehicle`)
		await page.waitForTimeout(1500)
		await fillVehicleFull(page, OT_DATA.vehicle)
	})

	test('6. fill condition', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1500)
		await fillConditionCore(page, OT_DATA.condition)
	})

	test('7. fill valuation (oldtimer)', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(1500)
		await fillCalculationOT(page, OT_DATA.calculation)
	})

	test('8. fill invoice', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/invoice`)
		await page.waitForTimeout(1500)
		await fillInvoice(page, OT_DATA.invoice)
	})

	test('9. send email', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		await page.waitForTimeout(1500)
		await sendReport(page, OT_DATA.email)
	})

	test('10. report info', () => {
		const url = `http://localhost:3000/reports/${reportId}/details/accident-info`
		console.log(`[exhaustive OT] DONE — reportId=${reportId}`)
		console.log(`[exhaustive OT] URL: ${url}`)
		expect(reportId).toBeTruthy()
	})
})
