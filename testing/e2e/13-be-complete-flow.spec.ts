import { test, expect } from '@playwright/test'
import path from 'path'

/**
 * Complete BE (Valuation) Report Flow — E2E
 * Verifies BE-specific UI: no accident/opponent, DAT+Manual valuation, correction, BE result labels
 */
test.describe('BE Complete Flow', () => {
	let reportId: string

	test('create BE report', async ({ page }) => {
		await page.goto('/dashboard')
		const res = await page.evaluate(async () => {
			const r = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'PW Complete BE', reportType: 'BE' }),
			})
			return (await r.json()).report.id
		})
		reportId = res
		expect(reportId).toBeTruthy()
	})

	test('upload photos', async ({ page }) => {
		await page.goto(`/reports/${reportId}/gallery`)
		await page.waitForTimeout(1500)
		const imagesDir = path.resolve('testing/testing-images')
		await page.locator('input[type="file"]').first().setInputFiles([
			path.join(imagesDir, 'car1.png'),
			path.join(imagesDir, 'car2.png'),
			path.join(imagesDir, 'car3.png'),
		])
		await page.waitForTimeout(6000)
	})

	test('BE accident info: NO accident day, NO opponent', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)

		const pageText = await page.locator('body').innerText()
		expect(pageText).not.toContain('Accident Day')
		expect(pageText).not.toContain('Opponent in Accident')
		expect(pageText).toContain('Claimant Information')
		expect(pageText).toContain('Visits')
		expect(pageText).toContain('Expert Opinion')
		expect(pageText).toContain('Signatures')
	})

	test('BE tab labels correct', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)
		const pageText = await page.locator('body').innerText()
		expect(pageText).toContain('Valuation')
		expect(pageText).not.toMatch(/Calculation\s*\d+/)
	})

	test('fill claimant for BE', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)
		await page.locator('input[name="claimantFirstName"]').fill('Karl')
		await page.locator('input[name="claimantLastName"]').fill('Fischer')
		await page.locator('input[name="claimantStreet"]').fill('Königstraße 22')
		await page.locator('input[name="claimantPostcode"]').fill('70173')
		await page.locator('input[name="claimantLocation"]').fill('Stuttgart')
		await page.locator('input[name="claimantLocation"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="claimantFirstName"]')).toHaveValue('Karl')
	})

	test('fill vehicle for BE', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/vehicle`)
		await page.waitForTimeout(1500)
		await page.locator('input[name="vin"]').fill('WBA3A5C50FK123456')
		await page.locator('input[name="manufacturer"]').fill('BMW')
		await page.locator('input[name="mainType"]').fill('3er Reihe')
		await page.locator('input[name="subType"]').fill('320d xDrive')
		await page.locator('input[name="subType"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="manufacturer"]')).toHaveValue('BMW')
	})

	test('BE valuation: DAT + Manual visible', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(1500)

		const pageText = await page.locator('body').innerText()
		expect(pageText).toContain('DAT Valuation')
		expect(pageText).toContain('Manual Valuation')
		expect(pageText).toContain('Correction Calculation')
		expect(pageText).toContain('Valuation Results')
		expect(pageText).toContain('Taxation')
		expect(pageText).toContain('Maximum')
		expect(pageText).toContain('Average')
		expect(pageText).toContain('Minimum')
	})

	test('BE valuation: fill max/avg/min and persist', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(1500)

		await page.locator('input[name="valuationMax"]').fill('38500')
		await page.locator('input[name="valuationAvg"]').fill('35200')
		await page.locator('input[name="valuationMin"]').fill('32000')
		await page.locator('input[name="valuationMin"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="valuationMax"]')).toHaveValue('38500')
		await expect(page.locator('input[name="valuationAvg"]')).toHaveValue('35200')
		await expect(page.locator('input[name="valuationMin"]')).toHaveValue('32000')
	})

	test('BE valuation: NO vehicle value/repair/loss of use', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(1500)

		const pageText = await page.locator('body').innerText()
		// BE should NOT have HS-specific sections
		expect(pageText).not.toContain('Replacement value')
		expect(pageText).not.toContain('Residual value')
		expect(pageText).not.toContain('Loss of Use')
		expect(pageText).not.toContain('Dropout group')
	})

	test('fill invoice for BE', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/invoice`)
		await page.waitForTimeout(1500)

		const invNum = await page.locator('input[name="invoiceNumber"]').inputValue()
		expect(invNum).toMatch(/^GH-/)

		await page.locator('input[name="date"]').fill('2026-04-03')
		await page.locator('input[name="date"]').blur()
		await page.waitForTimeout(2000)
	})

	test('export page works for BE', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		await page.waitForTimeout(1500)
		await expect(page.getByText('Export and Send')).toBeVisible()
		await expect(page.getByText('Send Report')).toBeVisible()
	})
})
