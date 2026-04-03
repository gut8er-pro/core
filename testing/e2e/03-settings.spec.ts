import { test, expect } from '@playwright/test'

test.describe('Settings', () => {
	test('profile tab loads with fields', async ({ page }) => {
		await page.goto('/settings')
		await expect(page.getByText('Account Settings')).toBeVisible()
		await expect(page.getByText('Personal Information')).toBeVisible()
		await expect(page.locator('input[name="firstName"]')).toBeVisible()
		await expect(page.locator('input[name="lastName"]')).toBeVisible()
		await expect(page.getByText('Instagram')).toBeVisible()
		await expect(page.getByText('Facebook')).toBeVisible()
		await expect(page.getByText('Linkedin')).toBeVisible()
	})

	test('business tab loads with fields', async ({ page }) => {
		await page.goto('/settings')
		await page.locator('text=Business').first().click()
		await page.waitForTimeout(500)
		await expect(page.locator('input[name="companyName"]')).toBeVisible()
		await expect(page.locator('input[name="street"]')).toBeVisible()
		await expect(page.locator('input[name="taxId"]')).toBeVisible()
	})

	test('integrations tab shows DAT', async ({ page }) => {
		await page.goto('/settings')
		await page.locator('text=Integrations').first().click()
		await page.waitForTimeout(500)
		await expect(page.getByText('DAT')).toBeVisible()
	})

	test('billing tab shows plan', async ({ page }) => {
		await page.goto('/settings')
		await page.locator('text=Billing').first().click()
		await page.waitForTimeout(500)
		await expect(page.locator('text=/Pro Plan|Free Plan/')).toBeVisible()
	})

	test('templates tab has add button', async ({ page }) => {
		await page.goto('/settings')
		await page.locator('text=Templates').first().click()
		await page.waitForTimeout(500)
		await expect(page.getByText('Add Template')).toBeVisible()
	})
})
