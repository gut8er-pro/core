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

	test('business website, email and phone are editable and persist', async ({ page }) => {
		await page.goto('/settings')
		await page.locator('text=Business').first().click()
		await page.waitForTimeout(500)

		const website = page.locator('input[name="website"]')
		const email = page.locator('input[name="email"]')
		const phone = page.locator('input[name="phone"]')

		await expect(website).toBeEnabled()
		await expect(email).toBeEnabled()
		await expect(phone).toBeEnabled()
		await expect(phone).toHaveAttribute('placeholder', /^\+49/)

		const suffix = Date.now().toString().slice(-5)
		await website.fill(`www.kfz-${suffix}.de`)
		await email.fill(`kontakt${suffix}@kfz-gutachten.de`)
		await phone.fill(`+49 30 ${suffix}`)

		await page.getByRole('button', { name: 'Update' }).first().click()
		await page.waitForTimeout(1500)

		await page.reload()
		await page.locator('text=Business').first().click()
		await page.waitForTimeout(1000)

		await expect(page.locator('input[name="website"]')).toHaveValue(`www.kfz-${suffix}.de`)
		await expect(page.locator('input[name="email"]')).toHaveValue(
			`kontakt${suffix}@kfz-gutachten.de`,
		)
		await expect(page.locator('input[name="phone"]')).toHaveValue(`+49 30 ${suffix}`)
	})

	test('integrations tab shows DAT', async ({ page }) => {
		await page.goto('/settings')
		await page.locator('text=Integrations').first().click()
		await page.waitForTimeout(500)
		await expect(page.getByText('DAT', { exact: true })).toBeVisible()
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
