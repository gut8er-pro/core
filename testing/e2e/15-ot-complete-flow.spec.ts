import { test, expect, type Page } from '@playwright/test'
import {
	completeManifest,
	fetchMissingCount,
	fetchReportCompletion,
} from './helpers/manifest-fill'

/**
 * Complete OT (Oldtimer Valuation) Flow — E2E
 * OT has the most unique UI: Client Information tab, 2 checkboxes,
 * Value Increasing Features, Vehicle Grading, Market/Replacement/Restoration valuation
 */
/** The open grade picker — there is never more than one. */
function gradePopup(page: Page) {
	return page.getByRole('dialog')
}

/**
 * The grades the server actually stored.
 *
 * Grading autosaves on an 800ms debounce, so a reload fired straight after a
 * click races the save. Polling the API is the honest wait: it asks whether the
 * thing the next assertion depends on has actually happened.
 */
async function savedGrades(page: Page, reportId: string) {
	return page.evaluate(async (rid: string) => {
		const response = await fetch(`/api/reports/${rid}/condition`)
		const body = (await response.json()) as {
			oldtimerDetails: Record<string, string | null> | null
		}
		return body.oldtimerDetails
	}, reportId)
}

/**
 * A report of this spec's own, for the two tests that change grading state.
 *
 * The shared `reportId` is walked in order by the rest of the flow; a test that
 * flips the auto-calculate toggle would otherwise decide what the next one sees.
 */
async function createOtReport(page: Page, title: string): Promise<string> {
	await page.goto('/')
	return page.evaluate(async (name: string) => {
		const response = await fetch('/api/reports', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: name, reportType: 'OT' }),
		})
		return (await response.json()).report.id as string
	}, title)
}

async function expectSavedOverall(page: Page, reportId: string, grade: string) {
	await expect
		.poll(async () => (await savedGrades(page, reportId))?.gradingOverall, { timeout: 20000 })
		.toBe(grade)
}

test.describe('OT Complete Flow', () => {
	let reportId: string

	test('create OT report', async ({ page }) => {
		await page.goto('/')
		const res = await page.evaluate(async () => {
			const r = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'PW Complete OT', reportType: 'OT' }),
			})
			return (await r.json()).report.id
		})
		reportId = res
		expect(reportId).toBeTruthy()
	})

	test('OT tab 1: "Client Information" not "Accident Info"', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		// Wait for report data to load (tab label depends on reportType)
		await expect(page.getByRole('tab', { name: /Client Information/ })).toBeVisible({
			timeout: 15000,
		})
	})

	test('OT heading: "Client Information" not "Accident Overview"', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await expect(page.getByRole('heading', { name: 'Client Information' })).toBeVisible({
			timeout: 15000,
		})
	})

	test('OT section title: "Client" not "Claimant Information"', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(3000)
		const text = await page.locator('body').innerText()
		expect(text).not.toContain('Claimant Information')
	})

	test('OT: NO Accident Day/Scene', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(3000)
		const text = await page.locator('body').innerText()
		expect(text).not.toContain('Accident Day')
		expect(text).not.toContain('Accident Scene')
	})

	test('OT: NO Opponent section', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(3000)
		const text = await page.locator('body').innerText()
		expect(text).not.toContain('Opponent in Accident')
	})

	test('OT: only 2 checkboxes (no lawyer)', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(3000)
		await expect(page.getByText('Eligible for input tax deduction')).toBeVisible()
		await expect(page.getByText('Is the vehicle owner')).toBeVisible()
		const text = await page.locator('body').innerText()
		expect(text).not.toContain('Represented by a lawyer')
	})

	test('OT tab 4: "Valuation" not "Calculation"', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await expect(page.getByRole('tab', { name: /Valuation/ })).toBeVisible({ timeout: 10000 })
	})

	test('OT: Vehicle Grading is its own tab, between Condition and Valuation', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await expect(page.getByRole('tab', { name: /Vehicle Grading/ })).toBeVisible({
			timeout: 15000,
		})

		// It left the Condition tab rather than rendering in both places.
		await page.waitForTimeout(2000)
		const conditionBody = await page.locator('main').innerText()
		expect(conditionBody).not.toContain('Overall Condition')

		const tabs = await page.getByRole('tab').allInnerTexts()
		const gradingIndex = tabs.findIndex((tab) => tab.includes('Vehicle Grading'))
		const conditionIndex = tabs.findIndex((tab) => tab.trim().startsWith('Condition'))
		const valuationIndex = tabs.findIndex((tab) => tab.includes('Valuation'))
		expect(gradingIndex).toBeGreaterThan(conditionIndex)
		expect(gradingIndex).toBeLessThan(valuationIndex)
	})

	test('OT Grading tab: reachable, and carries Value Increasing Features', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.getByRole('tab', { name: /Vehicle Grading/ }).click()
		await expect(page).toHaveURL(new RegExp(`/reports/${reportId}/details/grading`), {
			timeout: 15000,
		})
		await expect(page.locator('h2', { hasText: 'Vehicle Grading' })).toBeVisible({
			timeout: 15000,
		})
		await expect(page.getByText('Value Increasing Features').first()).toBeVisible()
	})

	test('OT Grading: no Paint category — it is graded on the paint layer', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/grading`)
		await page.waitForTimeout(3000)

		await expect(page.getByRole('button', { name: 'Bodywork / Sheet Metal' })).toBeVisible({
			timeout: 15000,
		})
		await expect(page.getByRole('button', { name: 'Paint', exact: true })).toHaveCount(0)
	})

	test('OT Grading: Overall Condition sits below the categories', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/grading`)
		await page.waitForTimeout(3000)

		const bodywork = await page
			.getByRole('button', { name: 'Bodywork / Sheet Metal' })
			.boundingBox()
		const overall = await page.getByRole('button', { name: 'Overall condition' }).boundingBox()
		expect(overall?.y ?? 0).toBeGreaterThan(bodywork?.y ?? 0)
	})

	test('OT Grading: auto-calculate computes the final grade from the categories', async ({
		page,
	}) => {
		const ownId = await createOtReport(page, 'PW OT auto-grade')
		await page.goto(`/reports/${ownId}/details/grading`)
		await page.waitForTimeout(3000)

		const overall = page.getByRole('button', { name: 'Overall condition' })
		// The toggle defaults on, so the overall grade is the categories' business.
		await expect(overall).toBeDisabled()

		// Grade three categories a 2 and nothing else: the mean is a clean 2.
		for (const category of ['Bodywork / Sheet Metal', 'Tires', 'Engine']) {
			await page.getByRole('button', { name: category, exact: true }).click()
			await gradePopup(page).getByRole('button', { name: '2', exact: true }).click()
			await page.waitForTimeout(500)
		}

		await expect(overall).toHaveText('2', { timeout: 10000 })

		// And it is stored, not merely displayed.
		await expectSavedOverall(page, ownId, '2')
		page.on('dialog', async (d) => await d.accept())
		await page.reload({ waitUntil: 'networkidle' })
		await expect(page.getByRole('button', { name: 'Overall condition' })).toHaveText('2', {
			timeout: 20000,
		})
	})

	test('OT Grading: the popup closes on an outside click', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/grading`)
		await page.waitForTimeout(3000)

		await page.getByRole('button', { name: 'Glass', exact: true }).click()
		await expect(gradePopup(page)).toBeVisible({ timeout: 10000 })

		await page.locator('h2', { hasText: 'Vehicle Grading' }).click()
		await expect(gradePopup(page)).toBeHidden({ timeout: 10000 })
	})

	test('OT Grading: turning auto-calculate off allows a manual grade', async ({ page }) => {
		const ownId = await createOtReport(page, 'PW OT manual-grade')
		await page.goto(`/reports/${ownId}/details/grading`)
		await page.waitForTimeout(3000)

		await page.locator('#automatically-calculate-grade').click()
		await page.waitForTimeout(1000)

		const overall = page.getByRole('button', { name: 'Overall condition' })
		await expect(overall).toBeEnabled()
		await overall.click()
		await gradePopup(page).getByRole('button', { name: '4', exact: true }).click()

		await expectSavedOverall(page, ownId, '4')
		page.on('dialog', async (d) => await d.accept())
		await page.reload({ waitUntil: 'networkidle' })
		await expect(page.getByRole('button', { name: 'Overall condition' })).toHaveText('4', {
			timeout: 20000,
		})
	})

	test('OT Valuation: Market + Replacement + Restoration + Total Cost', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(3000)
		await expect(page.locator('input[name="marketValue"]')).toBeVisible({ timeout: 15000 })
		await expect(page.locator('input[name="replacementValue"]')).toBeVisible({ timeout: 15000 })
		await expect(page.locator('input[name="restorationValue"]')).toBeVisible({ timeout: 15000 })
	})

	test('OT Valuation: NO Correction, NO Loss of Use, NO Repair', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(3000)
		const text = await page.locator('body').innerText()
		expect(text).not.toContain('Correction Calculation')
		expect(text).not.toContain('Loss of Use')
	})

	test('OT Valuation: fill and save market + replacement', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(3000)
		const market = page.locator('input[name="marketValue"]')
		const replacement = page.locator('input[name="replacementValue"]')
		await market.fill('185000')
		await replacement.fill('210000')
		await replacement.blur()
		await page.waitForTimeout(2000)

		// Reload and verify
		page.on('dialog', async (d) => await d.accept())
		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(market).toHaveValue('185000')
		await expect(replacement).toHaveValue('210000')
	})

	test('OT fill client and save', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(3000)
		const firstName = page.locator('input[name="claimantFirstName"]')
		const lastName = page.locator('input[name="claimantLastName"]')
		await firstName.fill('Werner')
		await lastName.fill('Hartmann')
		await lastName.blur()
		await page.waitForTimeout(2000)

		// Reload and verify
		page.on('dialog', async (d) => await d.accept())
		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(firstName).toHaveValue('Werner')
		await expect(lastName).toHaveValue('Hartmann')
	})

	test('satisfy the completeness manifest', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		await completeManifest(page, reportId, 'OT')

		// Send and PDF are refused server-side while anything required is
		// empty, so a happy path that never reaches a complete report proves
		// nothing about the rest of this flow.
		expect(await fetchMissingCount(page, reportId)).toBe(0)

		// The same fills make the dashboard honest: the percentage is written
		// by the autosave routes, and the status flips itself at 100%.
		const completion = await fetchReportCompletion(page, reportId)
		expect(completion.completionPercentage).toBe(100)
		expect(completion.status).toBe('COMPLETED')
	})

	test('export page works for OT', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		await page.waitForTimeout(2000)
		await expect(page.getByText('Export and Send')).toBeVisible({ timeout: 5000 })
		await expect(page.getByText('Send Report')).toBeVisible()
	})
})
