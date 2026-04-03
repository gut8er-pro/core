import { test, expect } from '@playwright/test'

/**
 * Complete OT (Oldtimer Valuation) Flow — E2E
 * OT has the most unique UI: Customer tab, Client heading, 2 checkboxes,
 * Value Increasing Features, Vehicle Grading, Market/Replacement/Restoration valuation
 */
test.describe('OT Complete Flow', () => {
	let reportId: string

	test('create OT report', async ({ page }) => {
		await page.goto('/dashboard')
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

	test('OT tab 1: "Customer" not "Accident Info"', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)
		const text = await page.locator('body').innerText()
		expect(text).toContain('Customer')
		expect(text).not.toMatch(/Accident Info\s*\d+/)
	})

	test('OT heading: "Client Information" not "Accident Overview"', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)
		await expect(page.getByText('Client Information')).toBeVisible()
	})

	test('OT section title: "Client" not "Claimant Information"', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)
		const text = await page.locator('body').innerText()
		expect(text).not.toContain('Claimant Information')
	})

	test('OT: NO Accident Day/Scene', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)
		const text = await page.locator('body').innerText()
		expect(text).not.toContain('Accident Day')
		expect(text).not.toContain('Accident Scene')
	})

	test('OT: NO Opponent section', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)
		const text = await page.locator('body').innerText()
		expect(text).not.toContain('Opponent in Accident')
	})

	test('OT: only 2 checkboxes (no lawyer)', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)
		await expect(page.getByText('Eligible for input tax deduction')).toBeVisible()
		await expect(page.getByText('Is the vehicle owner')).toBeVisible()
		const text = await page.locator('body').innerText()
		expect(text).not.toContain('Represented by a lawyer')
	})

	test('OT tab 4: "Valuation" not "Calculation"', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)
		const text = await page.locator('body').innerText()
		expect(text).toMatch(/Valuation\s*\d+\/3/)
	})

	test('OT Condition: Value Increasing Features + Vehicle Grading', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1500)
		await expect(page.getByText('Value Increasing Features')).toBeVisible()
		await expect(page.getByText('Vehicle Grading')).toBeVisible()
	})

	test('OT Valuation: Market + Replacement + Restoration + Total Cost', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(1500)
		await expect(page.getByText('Market value')).toBeVisible()
		await expect(page.getByText('Replacement value')).toBeVisible()
		await expect(page.getByText('Restoration Value')).toBeVisible()
		await expect(page.getByText('Total Cost')).toBeVisible()
	})

	test('OT Valuation: NO Correction, NO Loss of Use, NO Repair', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(1500)
		const text = await page.locator('body').innerText()
		expect(text).not.toContain('Correction Calculation')
		expect(text).not.toContain('Loss of Use')
		expect(text).not.toContain('Repair Method')
	})

	test('OT Valuation: fill and save market + replacement', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(1500)
		await page.locator('input[name="marketValue"]').fill('185000')
		await page.locator('input[name="replacementValue"]').fill('210000')
		await page.locator('input[name="replacementValue"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="marketValue"]')).toHaveValue('185000')
		await expect(page.locator('input[name="replacementValue"]')).toHaveValue('210000')
	})

	test('OT fill client and save', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)
		await page.locator('input[name="claimantCompany"]').fill('Oldtimer Club e.V.')
		await page.locator('input[name="claimantFirstName"]').fill('Werner')
		await page.locator('input[name="claimantLastName"]').fill('Hartmann')
		await page.locator('input[name="claimantLocation"]').fill('München')
		await page.locator('input[name="claimantLocation"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="claimantFirstName"]')).toHaveValue('Werner')
	})

	test('export page works for OT', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		await page.waitForTimeout(1500)
		await expect(page.getByText('Export and Send')).toBeVisible()
	})
})
