import { test, expect } from '@playwright/test'
import { createAuthPage, createReportViaAPI } from './helpers/test-data'

test.describe('Export & Send', () => {
	let reportId: string

	test.beforeAll(async ({ browser }) => {
		const page = await createAuthPage(browser)
		reportId = await createReportViaAPI(page, 'PW Export Test', 'HS')
		await page.context().close()
	})

	test('export page renders with toggles and email section', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		await expect(page.getByText('Export and Send')).toBeVisible()
		await expect(page.getByText('Vehicle valuation')).toBeVisible()
		await expect(page.getByText('Commission')).toBeVisible()
		await expect(page.getByText('The Invoice')).toBeVisible()
		await expect(page.getByText('Lock Report')).toBeVisible()
		await expect(page.getByRole('heading', { name: 'Email' })).toBeVisible()
		await expect(page.getByText('Recipient', { exact: true })).toBeVisible()
		await expect(page.getByText('Subject')).toBeVisible()
		await expect(page.getByText('Send Report')).toBeVisible()
	})

	test('rich text editor toolbar visible', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		// Editor toolbar should have formatting buttons
		await expect(page.locator('[class*="editor"], [class*="toolbar"], [role="toolbar"]').first()).toBeVisible()
	})

	test('sidebar navigation works on export page', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		await expect(page.getByText('Gallery')).toBeVisible()
		await expect(page.getByText('Report Details')).toBeVisible()
		await expect(page.getByText('Export & Send')).toBeVisible()
	})
})
