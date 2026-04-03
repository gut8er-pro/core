import { test, expect } from '@playwright/test'

test.describe('Export & Send', () => {
	let reportId: string

	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage()
		await page.goto('http://localhost:3000/dashboard')
		const res = await page.evaluate(async () => {
			const r = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'PW Export Test', reportType: 'HS' }),
			})
			return (await r.json()).report.id
		})
		reportId = res
		await page.close()
	})

	test('export page renders with toggles and email section', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		await expect(page.getByText('Export and Send')).toBeVisible()
		await expect(page.getByText('Vehicle valuation')).toBeVisible()
		await expect(page.getByText('Commission')).toBeVisible()
		await expect(page.getByText('The Invoice')).toBeVisible()
		await expect(page.getByText('Lock Report')).toBeVisible()
		await expect(page.getByText('Email')).toBeVisible()
		await expect(page.getByText('Recipient')).toBeVisible()
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
