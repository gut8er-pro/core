import { test as setup, expect } from '@playwright/test'

const AUTH_FILE = 'testing/e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
	// Ensure English locale for consistent test assertions
	await page.context().addCookies([
		{ name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
	])
	await page.goto('/login')
	await page.getByRole('textbox', { name: 'Enter your email' }).fill('ivanvukasino+2@gmail.com')
	await page.getByRole('textbox', { name: 'Enter your password' }).fill('Ivanivan1!')
	await page.getByRole('button', { name: 'Log in' }).click()
	await page.waitForURL('/dashboard')
	await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
	await page.context().storageState({ path: AUTH_FILE })
})
