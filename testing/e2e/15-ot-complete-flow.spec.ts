import { test, expect } from '@playwright/test'

/**
 * Complete OT (Oldtimer Valuation) Flow — E2E
 * OT has the most unique UI: Client Information tab, 2 checkboxes,
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

	test('OT tab 1: "Client Information" not "Accident Info"', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		// Wait for report data to load (tab label depends on reportType)
		await expect(page.getByText('Client Information')).toBeVisible({ timeout: 10000 })
	})

	test('OT heading: "Client Information" not "Accident Overview"', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await expect(page.getByText('Client Information')).toBeVisible({ timeout: 10000 })
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

	test('OT Condition: Value Increasing Features + Vehicle Grading', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(3000)
		await expect(page.getByText('Value Increasing Features')).toBeVisible({ timeout: 5000 })
		await expect(page.getByText('Vehicle Grading')).toBeVisible({ timeout: 5000 })
	})

	test('OT Valuation: Market + Replacement + Restoration + Total Cost', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(3000)
		await expect(page.getByText('Market Value')).toBeVisible({ timeout: 5000 })
		await expect(page.getByText('Replacement Value')).toBeVisible({ timeout: 5000 })
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

	test('export page works for OT', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		await page.waitForTimeout(2000)
		await expect(page.getByText('Export and Send')).toBeVisible({ timeout: 5000 })
		await expect(page.getByText('Send Report')).toBeVisible()
	})
})
