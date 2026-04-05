import { test, expect } from '@playwright/test'
import { REPORT_TYPE_TABS, createAuthPage, createReportViaAPI } from './helpers/test-data'

test.describe('Report Type Differences', () => {
	let reportIds: Record<string, string> = {}

	test.beforeAll(async ({ browser }) => {
		const page = await createAuthPage(browser)
		for (const type of ['HS', 'BE', 'KG', 'OT']) {
			reportIds[type] = await createReportViaAPI(page, `PW Test ${type}`, type)
		}
		await page.context().close()
	})

	test('HS: Accident Info has all sections', async ({ page }) => {
		await page.goto(`/reports/${reportIds.HS}/details/accident-info`)
		await expect(page.getByText('Accident Information')).toBeVisible()
		await expect(page.getByText('Claimant Information')).toBeVisible()
		await expect(page.getByText('Opponent in Accident')).toBeVisible()
		await expect(page.getByText('Visits')).toBeVisible()
		await expect(page.getByText('Expert Opinion Characteristics')).toBeVisible()
		await expect(page.getByText('Signatures')).toBeVisible()
	})

	test('HS: Calculation has Correction + Result cards', async ({ page }) => {
		await page.goto(`/reports/${reportIds.HS}/details/calculation`)
		await expect(page.getByText('Correction Calculation')).toBeVisible()
		await expect(page.getByText('Results without repair')).toBeVisible()
		await expect(page.getByText('Results with repair')).toBeVisible()
	})

	test('BE: NO Accident/Opponent sections', async ({ page }) => {
		await page.goto(`/reports/${reportIds.BE}/details/accident-info`)
		await expect(page.getByText('Accident Overview')).toBeVisible()
		await expect(page.getByText('Claimant Information')).toBeVisible()
		// These should NOT be visible
		await expect(page.getByText('Accident Information').first()).not.toBeVisible()
		await expect(page.locator('text=Opponent in Accident')).not.toBeVisible()
	})

	test('BE: Valuation tab with DAT + Manual', async ({ page }) => {
		await page.goto(`/reports/${reportIds.BE}/details/calculation`)
		await expect(page.getByRole('tab', { name: /Valuation/ })).toBeVisible()
		await expect(page.getByText('DAT Valuation')).toBeVisible()
		await expect(page.getByText('Manual Valuation')).toBeVisible()
		await expect(page.getByText('Correction Calculation')).toBeVisible()
	})

	test('KG: Calculation has NO Correction, NO Result cards', async ({ page }) => {
		await page.goto(`/reports/${reportIds.KG}/details/calculation`)
		await expect(page.getByText('Vehicle Value')).toBeVisible()
		await expect(page.getByText('Loss of Use')).toBeVisible()
		await expect(page.locator('text=Correction Calculation')).not.toBeVisible()
		await expect(page.locator('text=Results without repair')).not.toBeVisible()
	})

	test('OT: Client Information tab label + heading', async ({ page }) => {
		await page.goto(`/reports/${reportIds.OT}/details/accident-info`)
		await expect(page.getByText('Client Information').first()).toBeVisible({ timeout: 10000 })
	})

	test('OT: Only 2 checkboxes (no lawyer)', async ({ page }) => {
		await page.goto(`/reports/${reportIds.OT}/details/accident-info`)
		await expect(page.getByText('Eligible for input tax deduction')).toBeVisible()
		await expect(page.getByText('Is the vehicle owner')).toBeVisible()
		await expect(page.locator('text=Represented by a lawyer')).not.toBeVisible()
	})

	test('OT: NO Accident/Opponent sections', async ({ page }) => {
		await page.goto(`/reports/${reportIds.OT}/details/accident-info`)
		await expect(page.locator('text=Accident Information').first()).not.toBeVisible()
		await expect(page.locator('text=Opponent in Accident')).not.toBeVisible()
	})

	test('OT: Valuation tab with Market/Replacement/Restoration', async ({ page }) => {
		await page.goto(`/reports/${reportIds.OT}/details/calculation`)
		await expect(page.getByText('Vehicle Value')).toBeVisible()
		await expect(page.getByText('Market value')).toBeVisible()
		await expect(page.getByText('Replacement value')).toBeVisible()
		await expect(page.getByText('Restoration Value')).toBeVisible()
		await expect(page.getByText('Total Cost')).toBeVisible()
		await expect(page.locator('text=Correction Calculation')).not.toBeVisible()
	})
})
