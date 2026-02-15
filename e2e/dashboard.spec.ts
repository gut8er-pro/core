import { test, expect } from '@playwright/test'

// Note: requires auth setup — mock or seed user before running
// The dashboard is behind auth (AppLayout checks useAuth). Tests below assume
// the user is authenticated (e.g. via storageState, a seeded session cookie,
// or a mocked Supabase auth provider).

test.describe('Dashboard', () => {
	test('dashboard page shows top nav bar with logo, settings, and notifications', async ({
		page,
	}) => {
		await page.goto('/dashboard')

		// Top navigation bar
		const header = page.locator('header')
		await expect(header).toBeVisible()

		// Logo text
		await expect(header.getByText('Gut8er')).toBeVisible()
		await expect(header.getByText('PRO')).toBeVisible()

		// Navigation buttons by their aria-labels
		await expect(header.getByRole('button', { name: 'Settings' })).toBeVisible()
		await expect(header.getByRole('button', { name: 'Notifications' })).toBeVisible()
		await expect(header.getByRole('button', { name: 'Dashboard' })).toBeVisible()
		await expect(header.getByRole('button', { name: 'Statistics' })).toBeVisible()
	})

	test('dashboard shows "Reports" heading', async ({ page }) => {
		await page.goto('/dashboard')

		await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible()
	})

	test('empty state shows descriptive message when no reports exist', async ({ page }) => {
		await page.goto('/dashboard')

		// When there are no reports, the subtitle says "Manage your vehicle assessment reports"
		// (the report count text only appears when data.pagination.total is truthy)
		await expect(
			page.getByText('Manage your vehicle assessment reports'),
		).toBeVisible()
	})

	test('"New Report" button is visible', async ({ page }) => {
		await page.goto('/dashboard')

		const newReportButton = page.getByRole('button', { name: 'New Report' })
		await expect(newReportButton).toBeVisible()
	})
})
