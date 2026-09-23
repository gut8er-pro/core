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

/**
 * These mutate the rows, so each takes its own report — sharing one made the
 * results depend on the order the specs happened to run in.
 */
test.describe('Invoice default rows and per-unit pricing', () => {
	async function openFreshInvoice(
		page: import('@playwright/test').Page,
		browser: import('@playwright/test').Browser,
		title: string,
	) {
		const setup = await createAuthPage(browser)
		const reportId = await createReportViaAPI(setup, title, 'HS')
		await setup.context().close()

		await page.goto(`/reports/${reportId}/details/invoice`)
		await expect(page.locator('input[name="lineItems.3.description"]')).toBeVisible({
			timeout: 30_000,
		})
		return reportId
	}

	test('seeds the four default rows', async ({ page, browser }) => {
		await openFreshInvoice(page, browser, 'PW Invoice Rows seed')

		await expect(page.locator('input[name="lineItems.0.description"]')).toHaveValue('Grundhonorar')
		await expect(page.locator('input[name="lineItems.1.description"]')).toHaveValue('Anfahrt')
		await expect(page.locator('input[name="lineItems.2.description"]')).toHaveValue(
			'Druck & Versand',
		)
		await expect(page.locator('input[name="lineItems.3.description"]')).toHaveValue('Fotografien')
	})

	test('seeds the JVEG per-unit prices', async ({ page, browser }) => {
		await openFreshInvoice(page, browser, 'PW Invoice Rows prices')
		await expect(page.locator('input[name="lineItems.1.rate"]')).toHaveValue('0.7')
		await expect(page.locator('input[name="lineItems.2.rate"]')).toHaveValue('15')
		await expect(page.locator('input[name="lineItems.3.rate"]')).toHaveValue('2')
	})

	test('offers a quantity only on the rows that are priced per unit', async ({ page, browser }) => {
		await openFreshInvoice(page, browser, 'PW Invoice Rows quantity')

		// Grundhonorar and Druck & Versand are Pauschale only.
		await expect(page.locator('input[name="lineItems.0.quantity"]')).toHaveCount(0)
		await expect(page.locator('input[name="lineItems.2.quantity"]')).toHaveCount(0)
		await expect(page.locator('input[name="lineItems.1.quantity"]')).toBeVisible()
	})

	test('amounts a per-unit row as rate times quantity and totals it in the banner', async ({
		page,
		browser,
	}) => {
		await openFreshInvoice(page, browser, 'PW Invoice Rows amount')

		await page.locator('input[name="lineItems.3.rate"]').fill('2')
		await page.locator('input[name="lineItems.3.quantity"]').fill('30')
		await page.locator('input[name="lineItems.3.quantity"]').blur()

		// The Fotografien row bills 30 photos at 2,00 €.
		await expect(page.getByText('60,00 €')).toBeVisible()
		// Plus the 15,00 € print-and-postage lump sum, in the banner.
		await expect(page.getByText('Before tax 75,00 €')).toBeVisible()
	})

	test('removes a row and keeps it removed', async ({ page, browser }) => {
		await openFreshInvoice(page, browser, 'PW Invoice Rows remove')

		await page.getByRole('button', { name: 'Remove row' }).first().click()
		await expect(page.locator('input[name="lineItems.0.description"]')).toHaveValue('Anfahrt')
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await expect(page.locator('input[name="lineItems.0.description"]')).toHaveValue('Anfahrt')
		await expect(page.locator('input[name="lineItems.3.description"]')).toHaveCount(0)
	})
})
