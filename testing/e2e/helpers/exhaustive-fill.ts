import { type Page, expect } from '@playwright/test'

/**
 * Helpers for the exhaustive full-fill spec. Each function fills one
 * logical section of the report editor. Functions are idempotent and
 * tolerant of partial AI auto-fill — they only override fields they own.
 *
 * Strategy: trust `name=""` form attributes (stable), use role-based
 * locators for buttons, and fall back to `text=` for collapsible toggles.
 * Each filler ends with a blur + waitForTimeout to let the auto-save
 * debounce settle before the next test step navigates away.
 */

const SAVE_DEBOUNCE_MS = 2000

async function settle(page: Page) {
	// Touch body to release focus then wait for auto-save
	await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {})
	await page.waitForTimeout(SAVE_DEBOUNCE_MS)
}

/** Fill an input by name with graceful skip if not present.
 *  Always blurs after fill — visits and array fields only save on blur.
 *  Waits for the input to become editable (handles accordion animations). */
async function fillInput(page: Page, name: string, value: string) {
	const loc = page.locator(`input[name="${name}"], textarea[name="${name}"]`)
	const count = await loc.count()
	if (count === 0) return false
	try {
		await loc.first().waitFor({ state: 'visible', timeout: 1500 })
	} catch {
		return false
	}
	await loc.first().fill(value)
	await loc.first().blur()
	return true
}

/** Toggle a Radix Checkbox by its element id so it ends up checked. */
async function ensureChecked(page: Page, selector: string) {
	const box = page.locator(selector)
	if ((await box.count()) === 0) return false
	const state = await box.getAttribute('aria-checked').catch(() => null)
	if (state !== 'true') {
		await box.click()
	}
	return true
}

/** Open a collapsible section by its visible title (Radix Accordion trigger). */
async function openCollapsible(page: Page, title: string) {
	const trigger = page.getByRole('button', { name: new RegExp(`^${title}\\b`, 'i') }).first()
	const count = await trigger.count()
	if (count === 0) return false
	const state = await trigger.getAttribute('data-state').catch(() => null)
	if (state !== 'open') {
		await trigger.click()
		await page.waitForTimeout(400)
	}
	return true
}

/* ── Photos ───────────────────────────────────────────────────────── */

export async function uploadPhotos(page: Page, files: string[], waitMs = 12000) {
	const input = page.locator('input[type="file"]').first()
	await input.setInputFiles(files)
	await page.waitForTimeout(waitMs)
}

/* ── AI Generate ──────────────────────────────────────────────────── */

export async function triggerGenerate(page: Page, timeoutMs = 90000) {
	const btn = page.getByRole('button', { name: /Generate Report/i })
	await btn.click()
	// Wait for the SSE stream to finish — the button label flips back to "Generate Report"
	await page.waitForFunction(
		() => {
			const els = Array.from(document.querySelectorAll('button'))
			const generating = els.some((e) => /generating/i.test(e.textContent ?? ''))
			return !generating
		},
		undefined,
		{ timeout: timeoutMs },
	)
	await page.waitForTimeout(2000)
}

/* ── Claimant (full 16 fields) ────────────────────────────────────── */

export async function fillClaimantFull(
	page: Page,
	d: {
		company: string
		firstName: string
		lastName: string
		street: string
		postcode: string
		location: string
		email: string
		phone: string
		licensePlate: string
		vehicleMake: string
		vatId: string
		involvedLawyer: string
	},
) {
	await fillInput(page, 'claimantCompany', d.company)
	await fillInput(page, 'claimantFirstName', d.firstName)
	await fillInput(page, 'claimantLastName', d.lastName)
	await fillInput(page, 'claimantStreet', d.street)
	await fillInput(page, 'claimantPostcode', d.postcode)
	await fillInput(page, 'claimantLocation', d.location)
	await fillInput(page, 'claimantEmail', d.email)
	await fillInput(page, 'claimantPhone', d.phone)
	await fillInput(page, 'claimantLicensePlate', d.licensePlate)
	await fillInput(page, 'claimantVehicleMake', d.vehicleMake)

	// Tax-deduction checkbox unlocks claimantVatId (Radix → button#id)
	await ensureChecked(page, '#claimant-eligible-input-tax')
	await page.waitForTimeout(400)
	await fillInput(page, 'claimantVatId', d.vatId)

	// Lawyer checkbox unlocks claimantInvolvedLawyer
	await ensureChecked(page, '#claimant-represented-by-lawyer')
	await page.waitForTimeout(400)
	await fillInput(page, 'claimantInvolvedLawyer', d.involvedLawyer)

	await settle(page)

	// Belt-and-suspenders: re-assert licensePlate. The initial form reset()
	// may have wiped our early fill if AI's data arrived mid-fill.
	const plate = page.locator('input[name="claimantLicensePlate"]')
	if ((await plate.count()) > 0) {
		const cur = await plate.first().inputValue().catch(() => '')
		if (cur !== d.licensePlate) {
			await plate.first().fill(d.licensePlate)
			await plate.first().blur()
			await page.waitForTimeout(SAVE_DEBOUNCE_MS)
		}
	}
}

/* ── Opponent (collapsed by default) ───────────────────────────────── */

export async function fillOpponentFull(
	page: Page,
	d: {
		company: string
		firstName: string
		lastName: string
		street: string
		postcode: string
		location: string
		email: string
		phone: string
		insuranceCompany: string
		insuranceNumber: string
		claimNumber: string
		iban: string
	},
) {
	await openCollapsible(page, 'Opponent in Accident')
	await fillInput(page, 'opponentCompany', d.company)
	await fillInput(page, 'opponentFirstName', d.firstName)
	await fillInput(page, 'opponentLastName', d.lastName)
	await fillInput(page, 'opponentStreet', d.street)
	await fillInput(page, 'opponentPostcode', d.postcode)
	await fillInput(page, 'opponentLocation', d.location)
	await fillInput(page, 'opponentEmail', d.email)
	await fillInput(page, 'opponentPhone', d.phone)
	await fillInput(page, 'opponentInsuranceCompany', d.insuranceCompany)
	await fillInput(page, 'opponentInsuranceNumber', d.insuranceNumber)
	await fillInput(page, 'opponentClaimNumber', d.claimNumber)
	await fillInput(page, 'opponentIban', d.iban)
	await settle(page)
}

/* ── Visits (single visit — multi-visit handling is fragile so we keep 1) ─ */

export async function fillSingleVisit(
	page: Page,
	d: { street: string; postcode: string; location: string; date: string; expert: string },
) {
	await openCollapsible(page, 'Visits')
	// Add a visit only if none exist yet (AI fill might have added one)
	const existing = await page.locator('input[name^="visits.0."]').count()
	if (existing === 0) {
		await page.getByRole('button', { name: /Add Visit/i }).click()
		await page.waitForTimeout(500)
	}
	await fillInput(page, 'visits.0.street', d.street)
	await fillInput(page, 'visits.0.postcode', d.postcode)
	await fillInput(page, 'visits.0.location', d.location)
	await fillInput(page, 'visits.0.date', d.date)
	await fillInput(page, 'visits.0.expert', d.expert)
	await settle(page)
}

/* ── Expert Opinion ────────────────────────────────────────────────── */

export async function fillExpertOpinion(
	page: Page,
	d: { expertName: string; fileNumber: string; caseDate: string; issuedDate: string; mediator: string },
) {
	await openCollapsible(page, 'Expert Opinion Characteristics')
	await fillInput(page, 'expertName', d.expertName)
	await fillInput(page, 'fileNumber', d.fileNumber)
	await fillInput(page, 'caseDate', d.caseDate)
	await fillInput(page, 'issuedDate', d.issuedDate)
	await fillInput(page, 'mediator', d.mediator)
	await settle(page)
}

/* ── Vehicle (identification + spec + chip selectors) ────────────────── */

export async function fillVehicleFull(
	page: Page,
	d: {
		vin: string
		manufacturer: string
		mainType: string
		subType: string
		kbaNumber: string
		datsCode: string
		marketIndex: string
		powerKw: string
		cylinders: string
		displacement: string
		firstRegistration: string
		lastRegistration: string
		sourceOfTechnicalData: string
	},
) {
	await fillInput(page, 'vin', d.vin)
	await fillInput(page, 'manufacturer', d.manufacturer)
	await fillInput(page, 'mainType', d.mainType)
	await fillInput(page, 'subType', d.subType)
	await fillInput(page, 'kbaNumber', d.kbaNumber)
	await fillInput(page, 'datsCode', d.datsCode)
	await fillInput(page, 'marketIndex', d.marketIndex)

	await openCollapsible(page, 'Specification')
	await fillInput(page, 'powerKw', d.powerKw)
	await fillInput(page, 'cylinders', d.cylinders)
	await fillInput(page, 'displacement', d.displacement)
	await fillInput(page, 'firstRegistration', d.firstRegistration)
	await fillInput(page, 'lastRegistration', d.lastRegistration)
	await fillInput(page, 'sourceOfTechnicalData', d.sourceOfTechnicalData)

	await settle(page)
}

/* ── Condition (core fields + dropdowns) ────────────────────────────── */

export async function fillConditionCore(
	page: Page,
	d: {
		vehicleColor: string
		specialFeatures: string
		mileageRead: string
		estimateMileage: string
		nextMot: string
		notes: string
		previousDamageReported: string
		existingDamageNotReported: string
		subsequentDamage: string
	},
) {
	// 7 dropdowns (paintType / hard / paintCondition / generalCondition / bodyCondition / interiorCondition / drivingAbility)
	for (let i = 0; i < 7; i++) {
		try {
			await page.locator('[role="combobox"]').nth(i).click()
			await page.waitForTimeout(250)
			await page.locator('[role="option"]').first().click()
			await page.waitForTimeout(200)
		} catch {
			// some dropdowns may not be visible for this report type
		}
	}

	await fillInput(page, 'vehicleColor', d.vehicleColor)
	await fillInput(page, 'specialFeatures', d.specialFeatures)
	await fillInput(page, 'mileageRead', d.mileageRead)
	await fillInput(page, 'estimateMileage', d.estimateMileage)
	await fillInput(page, 'nextMot', d.nextMot)
	await fillInput(page, 'notes', d.notes)

	await openCollapsible(page, 'Prior and Existing Damage')
	await fillInput(page, 'previousDamageReported', d.previousDamageReported)
	await fillInput(page, 'existingDamageNotReported', d.existingDamageNotReported)
	await fillInput(page, 'subsequentDamage', d.subsequentDamage)

	await settle(page)
}

/* ── Calculation (HS variant) ────────────────────────────────────────── */

export async function fillCalculationHS(
	page: Page,
	d: {
		replacementValue: string
		residualValue: string
		diminutionInValue: string
		damageClass: string
		repairMethod: string
		risks: string
		wheelAlignment: string
		bodyMeasurements: string
		bodyPaint: string
		costPerDay: string
		repairTimeDays: string
		replacementTimeDays: string
	},
) {
	await fillInput(page, 'replacementValue', d.replacementValue)
	await fillInput(page, 'residualValue', d.residualValue)
	await fillInput(page, 'diminutionInValue', d.diminutionInValue)
	await fillInput(page, 'damageClass', d.damageClass)
	await fillInput(page, 'repairMethod', d.repairMethod)
	await fillInput(page, 'risks', d.risks)
	await fillInput(page, 'wheelAlignment', d.wheelAlignment)
	await fillInput(page, 'bodyMeasurements', d.bodyMeasurements)
	await fillInput(page, 'bodyPaint', d.bodyPaint)
	await fillInput(page, 'costPerDay', d.costPerDay)
	await fillInput(page, 'repairTimeDays', d.repairTimeDays)
	await fillInput(page, 'replacementTimeDays', d.replacementTimeDays)
	await settle(page)
}

/* ── Calculation (BE — Valuation Section with selects + Max/Avg/Min/Date) ── */

export async function fillCalculationBE(
	page: Page,
	d: {
		generalCondition: string
		taxation: string
		dataSource: string
		valuationMax: string
		valuationAvg: string
		valuationMin: string
		valuationDate: string
	},
) {
	// Native <select> for generalCondition
	const gc = page.locator('select[name="generalCondition"]')
	if ((await gc.count()) > 0) await gc.selectOption(d.generalCondition).catch(() => {})
	// Taxation chips — find button by label text (e.g. "19%")
	const taxBtn = page.getByRole('button', { name: new RegExp(`^${d.taxation}%`) }).first()
	if ((await taxBtn.count()) > 0) await taxBtn.click().catch(() => {})
	// Native <select> for dataSource
	const ds = page.locator('select[name="dataSource"]')
	if ((await ds.count()) > 0) await ds.selectOption(d.dataSource).catch(() => {})
	await fillInput(page, 'valuationMax', d.valuationMax)
	await fillInput(page, 'valuationAvg', d.valuationAvg)
	await fillInput(page, 'valuationMin', d.valuationMin)
	await fillInput(page, 'valuationDate', d.valuationDate)
	await settle(page)
}

/* ── Calculation (OT — Oldtimer Valuation) ──────────────────────────── */

export async function fillCalculationOT(
	page: Page,
	d: {
		marketValue: string
		replacementValue: string
		baseVehicleValue: string
		restorationValue: string
	},
) {
	await openCollapsible(page, 'Value')
	await fillInput(page, 'marketValue', d.marketValue)
	await fillInput(page, 'replacementValue', d.replacementValue)
	// Restoration is collapsed behind a "Restoration value" button
	const reveal = page.getByRole('button', { name: /Restoration value/i }).first()
	if ((await reveal.count()) > 0) {
		await reveal.click().catch(() => {})
		await page.waitForTimeout(400)
	}
	await fillInput(page, 'baseVehicleValue', d.baseVehicleValue)
	await fillInput(page, 'restorationValue', d.restorationValue)
	await settle(page)
}

/* ── Invoice ─────────────────────────────────────────────────────────── */

export async function fillInvoice(
	page: Page,
	d: { date: string; itemDescription: string; itemRate: string },
) {
	// invoice number is auto-generated
	await fillInput(page, 'date', d.date)
	const existing = await page.locator('input[name^="lineItems.0."]').count()
	if (existing === 0) {
		const addRow = page.getByRole('button', { name: /Add (Row|Line Item)/i }).first()
		if ((await addRow.count()) > 0) {
			await addRow.click()
			await page.waitForTimeout(500)
		}
	}
	await fillInput(page, 'lineItems.0.description', d.itemDescription)
	await fillInput(page, 'lineItems.0.rate', d.itemRate)
	await settle(page)
}

/* ── Send via Export & Send page ─────────────────────────────────────── */

export async function sendReport(
	page: Page,
	d: { recipientEmail: string; subject: string; body: string },
) {
	// Recipient chip input
	const emailInput = page.getByRole('textbox', { name: /Add recipient email/i })
	await emailInput.fill(d.recipientEmail)
	await emailInput.press('Enter')
	await page.waitForTimeout(300)

	// Subject
	await page.getByRole('textbox', { name: /Subject/i }).fill(d.subject)
	await page.waitForTimeout(200)

	// Body
	await page.getByRole('textbox', { name: /Email body/i }).fill(d.body)
	await page.waitForTimeout(200)

	await page.getByRole('button', { name: /Send Report/i }).click()
	// Wait for the send response — toast or status change
	await page.waitForTimeout(8000)
}

/* ── Assertion helpers ───────────────────────────────────────────────── */

export async function expectTabBadgeFilled(page: Page, tabName: string) {
	// Tab badges show "X/Y" when incomplete; after fill they show ✓ or hide the count
	await expect(page.locator(`text=${tabName} 0/`)).toHaveCount(0)
}
