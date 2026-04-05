import { test, expect } from '@playwright/test'
import { createAuthPage, createReportViaAPI } from './helpers/test-data'

test.describe('Invoice Tab', () => {
	let reportId: string

	test.beforeAll(async ({ browser }) => {
		const page = await createAuthPage(browser)
		reportId = await createReportViaAPI(page, 'PW Invoice Test', 'HS')
		await page.context().close()
	})

	test('invoice page shows green banner', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/invoice`)
		await expect(page.getByText('Invoice Amount')).toBeVisible()
		await expect(page.getByText('Preview Invoice')).toBeVisible()
	})

	test('invoice number auto-generated', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/invoice`)
		const invNum = await page.locator('input[name="invoiceNumber"]').inputValue()
		expect(invNum).toMatch(/^(HB|GH)-/)
	})

	test('BVSK rate table visible', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/invoice`)
		await expect(page.getByText('BVSK')).toBeVisible()
	})

	test('add line item row', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/invoice`)
		await page.locator('text=Add Row').click()
		await page.waitForTimeout(500)
		await expect(page.locator('input[name="lineItems.0.description"]')).toBeVisible()
		await expect(page.locator('input[name="lineItems.0.rate"]')).toBeVisible()
	})

	test('invoice date and payout delay save', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/invoice`)
		await page.waitForTimeout(1000)
		await page.locator('input[name="date"]').fill('2026-04-15')
		await page.locator('input[name="payoutDelay"]').fill('30')
		await page.locator('input[name="payoutDelay"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="date"]')).toHaveValue('2026-04-15')
		await expect(page.locator('input[name="payoutDelay"]')).toHaveValue('30')
	})

	test('e-invoice toggle visible', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/invoice`)
		await expect(page.getByText('E-Invoice')).toBeVisible()
	})
})
