import { test, expect } from '@playwright/test'
import { CLAIMANT_DATA, VEHICLE_DATA, CALCULATION_DATA, createAuthPage, createReportViaAPI } from './helpers/test-data'

test.describe('Save & Reload Persistence', () => {
	let reportId: string

	test.beforeAll(async ({ browser }) => {
		const page = await createAuthPage(browser)
		reportId = await createReportViaAPI(page, 'PW Save Test', 'HS')
		await page.context().close()
	})

	test('claimant fields persist after reload', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1000)

		// Fill all claimant fields
		for (const [name, value] of Object.entries(CLAIMANT_DATA)) {
			await page.locator(`input[name="${name}"]`).fill(value)
		}
		await page.locator(`input[name="claimantLicensePlate"]`).blur()
		await page.waitForTimeout(2000)

		// Reload
		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)

		// Verify
		for (const [name, value] of Object.entries(CLAIMANT_DATA)) {
			await expect(page.locator(`input[name="${name}"]`)).toHaveValue(value)
		}
	})

	test('vehicle fields persist after reload', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/vehicle`)
		await page.waitForTimeout(1000)

		// Fill identification
		for (const name of ['vin', 'manufacturer', 'mainType', 'subType', 'kbaNumber']) {
			await page.locator(`input[name="${name}"]`).fill(VEHICLE_DATA[name as keyof typeof VEHICLE_DATA])
		}
		await page.locator('input[name="kbaNumber"]').blur()
		await page.waitForTimeout(1000)

		// Expand specification and fill
		await page.locator('text=Specification').first().click()
		await page.waitForTimeout(500)
		for (const name of ['powerKw', 'displacement', 'cylinders']) {
			await page.locator(`input[name="${name}"]`).fill(VEHICLE_DATA[name as keyof typeof VEHICLE_DATA])
		}
		await page.locator('input[name="cylinders"]').blur()
		await page.waitForTimeout(2000)

		// Reload
		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)

		// Verify identification
		for (const name of ['vin', 'manufacturer', 'mainType', 'subType', 'kbaNumber']) {
			await expect(page.locator(`input[name="${name}"]`)).toHaveValue(VEHICLE_DATA[name as keyof typeof VEHICLE_DATA])
		}

		// Expand and verify specification
		await page.locator('text=Specification').first().click()
		await page.waitForTimeout(500)
		await expect(page.locator('input[name="powerKw"]')).toHaveValue('110')
		await expect(page.locator('input[name="displacement"]')).toHaveValue('1968')
		await expect(page.locator('input[name="cylinders"]')).toHaveValue('4')
	})

	test('calculation fields persist after reload', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(1000)

		// Fill all calculation fields
		for (const [name, value] of Object.entries(CALCULATION_DATA)) {
			await page.locator(`input[name="${name}"]`).fill(value)
		}
		await page.locator('input[name="replacementTimeDays"]').blur()
		await page.waitForTimeout(2000)

		// Reload
		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)

		// Verify
		await expect(page.locator('input[name="replacementValue"]')).toHaveValue('25000')
		await expect(page.locator('input[name="residualValue"]')).toHaveValue('18000')
		await expect(page.locator('input[name="diminutionInValue"]')).toHaveValue('3500')
		await expect(page.locator('input[name="repairMethod"]')).toHaveValue('Instandsetzung')
		await expect(page.locator('input[name="risks"]')).toHaveValue('Korrosionsgefahr')
		await expect(page.locator('input[name="damageClass"]')).toHaveValue('III')
		await expect(page.locator('input[name="repairTimeDays"]')).toHaveValue('7')
		await expect(page.locator('input[name="replacementTimeDays"]')).toHaveValue('14')
	})
})
