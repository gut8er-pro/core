import { expect, test } from '@playwright/test'
import { createAuthPage, createReportViaAPI } from './helpers/test-data'

/**
 * Regression for issue 22 — typing, leaving the tab inside the 800ms auto-save
 * debounce and coming back used to lose the values: the unmount flush raced the
 * next mount's refetch, and the form initialised from the pre-PATCH response.
 *
 * Every step here switches tabs IMMEDIATELY after filling, with no settle wait,
 * which is the sequence the client hit on the demo call.
 */
test.describe('Tab switch during auto-save debounce', () => {
	let reportId: string

	test.beforeAll(async ({ browser }) => {
		const page = await createAuthPage(browser)
		reportId = await createReportViaAPI(page, 'PW Data Loss HS', 'HS')
		await page.context().close()
	})

	async function openTab(page: import('@playwright/test').Page, tab: string) {
		await page.goto(`/reports/${reportId}/details/${tab}`)
		await page.waitForSelector('input, select, textarea', { timeout: 15_000 })
	}

	test('loss of use survives an immediate switch to Invoice and back', async ({ page }) => {
		await openTab(page, 'calculation')

		await page.locator('input[name="costPerDay"]').fill('45.50')
		await page.locator('input[name="repairTimeDays"]').fill('9')
		// No settle wait on purpose — leave inside the debounce window.
		await page.getByRole('tab', { name: /Invoice/i }).click()
		await page.waitForURL(/\/details\/invoice/)

		await page.getByRole('tab', { name: /Calculation|Valuation/i }).click()
		await page.waitForURL(/\/details\/calculation/)

		await expect(page.locator('input[name="costPerDay"]')).toHaveValue('45.5')
		await expect(page.locator('input[name="repairTimeDays"]')).toHaveValue('9')
	})

	test('vehicle value survives an immediate switch and a full reload', async ({ page }) => {
		await openTab(page, 'calculation')

		await page.locator('input[name="replacementValue"]').fill('26500')
		await page.locator('input[name="residualValue"]').fill('19750')
		await page.getByRole('tab', { name: /Condition/i }).click()
		await page.waitForURL(/\/details\/condition/)

		await page.goto(`/reports/${reportId}/details/calculation`)
		await expect(page.locator('input[name="replacementValue"]')).toHaveValue('26500')
		await expect(page.locator('input[name="residualValue"]')).toHaveValue('19750')
	})

	test('an invoice field survives an immediate switch to Calculation and back', async ({
		page,
	}) => {
		await openTab(page, 'invoice')

		const payoutDelay = page.locator('input[name="payoutDelay"]')
		await payoutDelay.fill('21')
		await page.getByRole('tab', { name: /Calculation|Valuation/i }).click()
		await page.waitForURL(/\/details\/calculation/)

		await page.getByRole('tab', { name: /Invoice/i }).click()
		await page.waitForURL(/\/details\/invoice/)

		await expect(page.locator('input[name="payoutDelay"]')).toHaveValue('21')
	})

	/**
	 * The Tires card is collapsed by default, and its fields stay read-only for as
	 * long as the placeholder set stands in for the real one, so waiting for
	 * editable is what makes this deterministic.
	 */
	async function openTires(page: import('@playwright/test').Page) {
		const trigger = page.getByRole('button', { name: /^Tires\b/ }).first()
		if ((await trigger.getAttribute('data-state')) !== 'open') await trigger.click()
		await expect(page.getByLabel('Tire size')).toBeEditable({ timeout: 15_000 })
	}

	test('a tire field survives an immediate switch to Calculation and back', async ({ page }) => {
		await openTab(page, 'condition')
		await openTires(page)

		await page.getByLabel('Tire size').fill('225/45 R17')
		// No settle wait on purpose — leave before the blur save has answered.
		await page.getByRole('tab', { name: /Calculation|Valuation/i }).click()
		await page.waitForURL(/\/details\/calculation/)

		await page.getByRole('tab', { name: /Condition/i }).click()
		await page.waitForURL(/\/details\/condition/)
		await openTires(page)

		await expect(page.getByLabel('Tire size')).toHaveValue('225/45 R17')
	})
})
