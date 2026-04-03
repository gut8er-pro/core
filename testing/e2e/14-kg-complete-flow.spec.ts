import { test, expect } from '@playwright/test'
import path from 'path'

/**
 * Complete KG (Short Report) Flow — E2E
 * KG = same as HS but NO Correction Calculation, NO Result cards
 */
test.describe('KG Complete Flow', () => {
	let reportId: string

	test('create KG report', async ({ page }) => {
		await page.goto('/dashboard')
		const res = await page.evaluate(async () => {
			const r = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'PW Complete KG', reportType: 'KG' }),
			})
			return (await r.json()).report.id
		})
		reportId = res
		expect(reportId).toBeTruthy()
	})

	test('KG has same sections as HS for Accident Info', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)
		const pageText = await page.locator('body').innerText()
		expect(pageText).toContain('Accident Day')
		expect(pageText).toContain('Claimant Information')
		expect(pageText).toContain('Opponent in Accident')
		expect(pageText).toContain('Visits')
		expect(pageText).toContain('Expert Opinion')
	})

	test('KG tab labels: Calculation not Valuation', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)
		const pageText = await page.locator('body').innerText()
		expect(pageText).toMatch(/Calculation\s*\d+\/4/)
		expect(pageText).not.toMatch(/Valuation\s*\d+/)
	})

	test('KG Calculation: NO Correction, NO Results', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(1500)
		const pageText = await page.locator('body').innerText()
		expect(pageText).toContain('Vehicle Value')
		expect(pageText).toContain('Loss of Use')
		expect(pageText).not.toContain('Correction Calculation')
		expect(pageText).not.toContain('Results without repair')
		expect(pageText).not.toContain('Results with repair')
	})

	test('KG Calculation: Vehicle Value + Repair side by side', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(1500)
		await expect(page.locator('input[name="replacementValue"]')).toBeVisible()
		await expect(page.locator('input[name="residualValue"]')).toBeVisible()
		await expect(page.locator('input[name="repairMethod"]')).toBeVisible()
		await expect(page.locator('input[name="costPerDay"]')).toBeVisible()
	})

	test('fill and save KG calculation', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(1500)
		await page.locator('input[name="replacementValue"]').fill('22000')
		await page.locator('input[name="residualValue"]').fill('18500')
		await page.locator('input[name="repairMethod"]').fill('Spot Repair')
		await page.locator('input[name="costPerDay"]').fill('28')
		await page.locator('input[name="repairTimeDays"]').fill('3')
		await page.locator('input[name="repairTimeDays"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="replacementValue"]')).toHaveValue('22000')
		await expect(page.locator('input[name="repairMethod"]')).toHaveValue('Spot Repair')
	})

	test('fill claimant + opponent for KG', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)
		await page.locator('input[name="claimantFirstName"]').fill('Peter')
		await page.locator('input[name="claimantLastName"]').fill('Meier')
		await page.locator('input[name="claimantStreet"]').fill('Industrieweg 15')
		await page.locator('input[name="claimantLocation"]').fill('Hannover')
		await page.locator('input[name="claimantLocation"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="claimantFirstName"]')).toHaveValue('Peter')
	})

	test('export page works for KG', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		await page.waitForTimeout(1500)
		await expect(page.getByText('Export and Send')).toBeVisible()
		await expect(page.getByText('Send Report')).toBeVisible()
	})
})
