import path from 'path'
import type { Browser } from '@playwright/test'

export const TEST_ACCOUNT = {
	email: 'ivanvukasino+2@gmail.com',
	password: 'Ivanivan1!',
}

const AUTH_FILE = path.join(__dirname, '../.auth/user.json')

/** Create an authenticated page from browser.newPage() in beforeAll */
export async function createAuthPage(browser: Browser) {
	const context = await browser.newContext({ storageState: AUTH_FILE })
	return context.newPage()
}

/** Create a report via API from an authenticated page */
export async function createReportViaAPI(
	page: Awaited<ReturnType<typeof createAuthPage>>,
	title: string,
	reportType: string,
): Promise<string> {
	await page.goto('http://localhost:3000/dashboard')
	await page.waitForTimeout(500)
	const id = await page.evaluate(
		async (args: { title: string; reportType: string }) => {
			const r = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: args.title, reportType: args.reportType }),
			})
			return (await r.json()).report.id
		},
		{ title, reportType },
	)
	return id
}

export const TEST_IMAGES_DIR = 'testing/testing-images'
export const TEST_IMAGES = [
	`${TEST_IMAGES_DIR}/car1.png`,
	`${TEST_IMAGES_DIR}/car2.png`,
	`${TEST_IMAGES_DIR}/car3.png`,
	`${TEST_IMAGES_DIR}/car4.png`,
	`${TEST_IMAGES_DIR}/car5.png`,
]

export const CLAIMANT_DATA = {
	claimantCompany: 'Test GmbH',
	claimantFirstName: 'Max',
	claimantLastName: 'Mustermann',
	claimantStreet: 'Berliner Str. 42',
	claimantPostcode: '10115',
	claimantLocation: 'Berlin',
	claimantEmail: 'max@test.de',
	claimantPhone: '+4930123456',
	claimantLicensePlate: 'B AB 1234',
}

export const VEHICLE_DATA = {
	vin: 'WVWZZZ3CZWE123456',
	manufacturer: 'Volkswagen AG',
	mainType: 'Golf VII',
	subType: 'Golf VII 2.0 TDI',
	kbaNumber: '0603/BGH',
	powerKw: '110',
	displacement: '1968',
	cylinders: '4',
}

export const CALCULATION_DATA = {
	replacementValue: '25000',
	residualValue: '18000',
	diminutionInValue: '3500',
	repairMethod: 'Instandsetzung',
	risks: 'Korrosionsgefahr',
	damageClass: 'III',
	costPerDay: '45.00',
	repairTimeDays: '7',
	replacementTimeDays: '14',
}

/** Report type tab expectations */
export const REPORT_TYPE_TABS = {
	HS: { tab1: 'Accident Info', tab4: 'Calculation', accidentSections: 6, calcSections: 5 },
	BE: { tab1: 'Accident Info', tab4: 'Valuation', accidentSections: 4, calcSections: 3 },
	KG: { tab1: 'Accident Info', tab4: 'Calculation', accidentSections: 6, calcSections: 4 },
	OT: { tab1: 'Customer', tab4: 'Valuation', accidentSections: 4, calcSections: 3 },
}
