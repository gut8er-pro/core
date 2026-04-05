import { test, expect } from '@playwright/test'
import path from 'path'

const RECIPIENT = 'ivanvukasino@gmail.com'
const IMAGES_DIR = path.resolve('testing/testing-images')
const IMAGES = ['car1.png', 'car2.png', 'car3.png', 'car4.png', 'car5.png'].map(f => path.join(IMAGES_DIR, f))

type ReportType = 'HS' | 'BE' | 'KG' | 'OT'

async function createReport(page: any, title: string, type: ReportType): Promise<string> {
	await page.goto('http://localhost:3000/dashboard')
	await page.waitForTimeout(1000)
	const id = await page.evaluate(async (args: { title: string; type: string }) => {
		const r = await fetch('/api/reports', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: args.title, reportType: args.type }),
		})
		return (await r.json()).report.id
	}, { title, type })
	return id
}

async function uploadPhotos(page: any, reportId: string) {
	await page.goto(`/reports/${reportId}/gallery`)
	await page.waitForTimeout(2000)
	await page.locator('input[type="file"]').first().setInputFiles(IMAGES)
	await page.waitForTimeout(8000)
}

async function fillClaimant(page: any, reportId: string, data: Record<string, string>) {
	await page.goto(`/reports/${reportId}/details/accident-info`)
	await page.waitForTimeout(1500)
	for (const [name, value] of Object.entries(data)) {
		await page.locator(`input[name="${name}"]`).fill(value)
	}
	await page.locator(`input[name="${Object.keys(data).pop()}"]`).blur()
	await page.waitForTimeout(2000)
}

async function fillVehicleViaAPI(page: any, reportId: string, data: Record<string, unknown>) {
	await page.evaluate(async (args: { rid: string; data: Record<string, unknown> }) => {
		await fetch(`/api/reports/${args.rid}/vehicle`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(args.data),
		})
	}, { rid: reportId, data })
}

async function fillConditionViaAPI(page: any, reportId: string, data: Record<string, unknown>) {
	await page.evaluate(async (args: { rid: string; data: Record<string, unknown> }) => {
		await fetch(`/api/reports/${args.rid}/condition`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ condition: args.data }),
		})
	}, { rid: reportId, data })
}

async function fillCalcViaAPI(page: any, reportId: string, data: Record<string, unknown>) {
	await page.evaluate(async (args: { rid: string; data: Record<string, unknown> }) => {
		await fetch(`/api/reports/${args.rid}/calculation`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(args.data),
		})
	}, { rid: reportId, data })
}

async function fillInvoiceViaAPI(page: any, reportId: string, invData: Record<string, unknown>, lineItems: Record<string, unknown>[]) {
	await page.evaluate(async (args: { rid: string; inv: Record<string, unknown>; items: Record<string, unknown>[] }) => {
		await fetch(`/api/reports/${args.rid}/invoice`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ invoice: args.inv, lineItems: args.items }),
		})
	}, { rid: reportId, inv: invData, items: lineItems })
}

async function addSignature(page: any, reportId: string) {
	await page.evaluate(async (rid: string) => {
		await fetch(`/api/reports/${rid}/accident-info`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ signatures: [{ type: 'DATA_PERMISSION', imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }] }),
		})
	}, reportId)
}

async function sendReport(page: any, reportId: string, subject: string) {
	await page.evaluate(async (args: { rid: string }) => {
		await fetch(`/api/reports/${args.rid}/export`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ includeValuation: true, lockReport: false }),
		})
	}, { rid: reportId })

	await page.goto(`/reports/${reportId}/export`)
	await page.waitForTimeout(2000)
	await page.locator('input[type="email"]').fill(RECIPIENT)
	await page.keyboard.press('Enter')
	await page.waitForTimeout(500)
	await page.locator('input[name="emailSubject"]').fill(subject)
	await page.locator('input[name="emailSubject"]').blur()
	await page.waitForTimeout(500)
	await page.locator('text=Send Report').first().click()
	await page.waitForTimeout(10000)
	const text = await page.locator('body').innerText()
	expect(text).toContain('sent successfully')
}

const CONDITION_DATA = {
	paintType: 'Metallic', hard: 'Original manufacturer paint', paintCondition: 'Good',
	generalCondition: 'Well maintained', bodyCondition: 'Minor cosmetic',
	interiorCondition: 'Clean, no structural damage.', drivingAbility: 'Roadworthy',
	specialFeatures: 'Klimaanlage, Navi', mileageRead: 75000, estimateMileage: 76000,
	unit: 'km', nextMot: '2027-06-01', fullServiceHistory: true,
	notes: 'Fahrzeug in gutem Zustand.', previousDamageReported: 'Keine',
	existingDamageNotReported: 'Keine', subsequentDamage: 'Keine',
}

const VEHICLE_DATA = {
	vin: 'WVWZZZ3CZWE999999', manufacturer: 'Volkswagen', mainType: 'Golf',
	subType: 'Golf VII 2.0 TDI', kbaNumber: '0603/BGH',
	powerKw: 110, powerHp: 150, engineDesign: 'Inline', displacement: 1968,
	cylinders: 4, transmission: 'Manual (6-speed)',
	firstRegistration: '2020-01-15', sourceOfTechnicalData: 'DAT SilverDAT3',
	vehicleType: 'compact', motorType: 'diesel',
	axles: 2, drivenAxles: 1, doors: 4, seats: 5, previousOwners: 1,
}

// ─────────────────────────────────────────────────────────────

test.describe.serial('All 4 Reports — Create, Fill, Send', () => {
	test.setTimeout(120000)

	test('HS — Complete Liability Report', async ({ page }) => {
		const id = await createReport(page, 'PW Run - HS Liability', 'HS')
		await uploadPhotos(page, id)
		await fillClaimant(page, id, {
			claimantFirstName: 'Thomas', claimantLastName: 'Müller',
			claimantStreet: 'Friedrichstr. 100', claimantPostcode: '10117', claimantLocation: 'Berlin',
			claimantEmail: 'thomas@test.de', claimantLicensePlate: 'B TM 2026',
		})
		await addSignature(page, id)
		await fillVehicleViaAPI(page, id, VEHICLE_DATA)
		await fillConditionViaAPI(page, id, CONDITION_DATA)
		await fillCalcViaAPI(page, id, {
			calculation: { replacementValue: 25000, residualValue: 18000, diminutionInValue: 3500,
				repairMethod: 'Instandsetzung', damageClass: 'III', costPerDay: 35, repairTimeDays: 5, replacementTimeDays: 12 },
			additionalCosts: [{ description: 'Abschleppkosten', amount: 180 }],
		})
		await fillInvoiceViaAPI(page, id, { invoiceNumber: 'PW-HS-001', date: '2026-04-03T00:00:00Z' }, [
			{ description: 'Gutachten', rate: 362, amount: 362, quantity: 1, isLumpSum: true, order: 0 },
			{ description: 'Fotos', rate: 7.5, amount: 7.5, quantity: 1, isLumpSum: true, order: 1 },
			{ description: 'Fahrtkosten', rate: 40, amount: 40, quantity: 1, isLumpSum: true, order: 2 },
		])
		await sendReport(page, id, 'PW Run — HS Liability Report')
	})

	test('BE — Complete Valuation Report', async ({ page }) => {
		const id = await createReport(page, 'PW Run - BE Valuation', 'BE')
		await uploadPhotos(page, id)
		await fillClaimant(page, id, {
			claimantFirstName: 'Karl', claimantLastName: 'Fischer',
			claimantStreet: 'Königstr. 22', claimantPostcode: '70173', claimantLocation: 'Stuttgart',
			claimantEmail: 'karl@test.de',
		})
		await addSignature(page, id)
		await fillVehicleViaAPI(page, id, { ...VEHICLE_DATA, manufacturer: 'BMW', mainType: '3er', subType: '320d xDrive', vin: 'WBA3A5C50FK999999' })
		await fillConditionViaAPI(page, id, CONDITION_DATA)
		await fillCalcViaAPI(page, id, {
			calculation: { generalCondition: 'good', taxation: '2.4', dataSource: 'mobile.de',
				valuationMax: 38500, valuationAvg: 35200, valuationMin: 32000, valuationDate: '2026-03' },
		})
		await fillInvoiceViaAPI(page, id, { invoiceNumber: 'PW-BE-001', date: '2026-04-03T00:00:00Z' }, [
			{ description: 'Bewertungsgutachten', rate: 450, amount: 450, quantity: 1, isLumpSum: true, order: 0 },
			{ description: 'Fotos', rate: 7.5, amount: 7.5, quantity: 1, isLumpSum: true, order: 1 },
		])
		await sendReport(page, id, 'PW Run — BE Valuation Report')
	})

	test('KG — Complete Short Report', async ({ page }) => {
		const id = await createReport(page, 'PW Run - KG Short Report', 'KG')
		await uploadPhotos(page, id)
		await fillClaimant(page, id, {
			claimantFirstName: 'Peter', claimantLastName: 'Meier',
			claimantStreet: 'Industrieweg 15', claimantPostcode: '30159', claimantLocation: 'Hannover',
			claimantEmail: 'peter@test.de',
		})
		await addSignature(page, id)
		await fillVehicleViaAPI(page, id, { ...VEHICLE_DATA, manufacturer: 'VW', mainType: 'Tiguan', subType: 'Tiguan 2.0 TDI', vin: 'WVWZZZ1KZAW999999' })
		await fillConditionViaAPI(page, id, CONDITION_DATA)
		await fillCalcViaAPI(page, id, {
			calculation: { replacementValue: 22000, residualValue: 18500, repairMethod: 'Spot Repair', costPerDay: 28, repairTimeDays: 3 },
			additionalCosts: [{ description: 'Mietwagen', amount: 196 }],
		})
		await fillInvoiceViaAPI(page, id, { invoiceNumber: 'PW-KG-001', date: '2026-04-03T00:00:00Z' }, [
			{ description: 'Kurzgutachten', rate: 250, amount: 250, quantity: 1, isLumpSum: true, order: 0 },
			{ description: 'Fahrtkosten', rate: 30, amount: 30, quantity: 1, isLumpSum: true, order: 1 },
		])
		await sendReport(page, id, 'PW Run — KG Short Report')
	})

	test('OT — Complete Oldtimer Valuation', async ({ page }) => {
		const id = await createReport(page, 'PW Run - OT Oldtimer', 'OT')
		await uploadPhotos(page, id)
		await fillClaimant(page, id, {
			claimantCompany: 'Oldtimer-Garage e.V.', claimantFirstName: 'Werner', claimantLastName: 'Hartmann',
			claimantStreet: 'Leopoldstr. 42', claimantPostcode: '80802', claimantLocation: 'München',
			claimantEmail: 'werner@test.de', claimantLicensePlate: 'M OT 1965',
		})
		await addSignature(page, id)
		await fillVehicleViaAPI(page, id, {
			vin: 'WDB1110231A999999', manufacturer: 'Mercedes-Benz', mainType: 'W111',
			subType: '280 SE 3.5 Coupé', kbaNumber: '0710/AAA',
			powerKw: 147, powerHp: 200, engineDesign: 'V-Type', displacement: 3499,
			cylinders: 8, transmission: 'Automatic',
			firstRegistration: '1971-06-15', sourceOfTechnicalData: 'Historische Fahrzeugdaten',
			vehicleType: 'coupe', motorType: 'petrol', axles: 2, doors: 2, seats: 4, previousOwners: 5,
		})
		await fillConditionViaAPI(page, id, {
			...CONDITION_DATA, specialFeatures: 'Original Becker-Radio, Chromstoßstangen',
			mileageRead: 89450, notes: 'W111 Coupé, restauriert 2018, Matching Numbers.',
		})
		await fillCalcViaAPI(page, id, {
			calculation: { marketValue: 185000, replacementValue: 210000, baseVehicleValue: 95000, restorationValue: 78000 },
		})
		await fillInvoiceViaAPI(page, id, { invoiceNumber: 'PW-OT-001', date: '2026-04-03T00:00:00Z' }, [
			{ description: 'Oldtimer-Wertgutachten', rate: 850, amount: 850, quantity: 1, isLumpSum: true, order: 0 },
			{ description: 'Historische Recherche', rate: 150, amount: 150, quantity: 1, isLumpSum: true, order: 1 },
			{ description: 'Fahrtkosten', rate: 45, amount: 45, quantity: 1, isLumpSum: true, order: 2 },
		])
		await sendReport(page, id, 'PW Run — OT Oldtimer Valuation')
	})
})
