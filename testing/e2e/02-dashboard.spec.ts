import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
	test('dashboard loads with report list', async ({ page }) => {
		await page.goto('/dashboard')
		await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
		await expect(page.getByText('Total Revenue')).toBeVisible()
		await expect(page.getByText('Recent Reports')).toBeVisible()
	})

	test('revenue chart has period selector', async ({ page }) => {
		await page.goto('/dashboard')
		await expect(page.getByText('Yearly')).toBeVisible()
		await expect(page.getByText('Monthly')).toBeVisible()
		await expect(page.getByText('Weekly')).toBeVisible()
	})

	test('nav bar elements visible', async ({ page }) => {
		await page.goto('/dashboard')
		await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Statistics' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible()
	})

	test('create HS report via API', async ({ page }) => {
		await page.goto('/dashboard')
		const response = await page.evaluate(async () => {
			const r = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Playwright Test HS', reportType: 'HS' }),
			})
			return r.json()
		})
		expect(response.report.id).toBeTruthy()
		expect(response.report.reportType).toBe('HS')
	})

	test('statistics page loads', async ({ page }) => {
		await page.goto('/statistics')
		await expect(page.getByText('Financial Analytics')).toBeVisible()
	})

	test('notifications page loads', async ({ page }) => {
		await page.goto('/notifications')
		await expect(page.getByText('Notifications')).toBeVisible()
	})
})
