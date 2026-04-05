import { test, expect } from '@playwright/test'
import { TEST_ACCOUNT } from './helpers/test-data'

test.describe('Auth Flow', () => {
	test.use({ storageState: { cookies: [], origins: [] } }) // No auth for these tests

	test('landing page loads', async ({ page }) => {
		await page.goto('/')
		await expect(page).toHaveTitle(/Gut8erPRO/)
		await expect(page.getByText('Professional Vehicle Assessment')).toBeVisible()
		await expect(page.getByRole('link', { name: 'Start Free Trial' }).first()).toBeVisible()
		await expect(page.getByText('Log In')).toBeVisible()
	})

	test('login page renders correctly', async ({ page }) => {
		await page.goto('/login')
		await expect(page.getByText('Welcome back')).toBeVisible()
		await expect(page.getByRole('textbox', { name: 'Enter your email' })).toBeVisible()
		await expect(page.getByRole('textbox', { name: 'Enter your password' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible()
		await expect(page.getByText('Login with Google')).toBeVisible()
		await expect(page.getByText('Login with Apple')).toBeVisible()
		await expect(page.getByText('Forgot password?')).toBeVisible()
		await expect(page.getByRole('link', { name: 'Sign Up' })).toBeVisible()
	})

	test('login with wrong credentials shows error', async ({ page }) => {
		await page.goto('/login')
		await page.getByRole('textbox', { name: 'Enter your email' }).fill('wrong@test.com')
		await page.getByRole('textbox', { name: 'Enter your password' }).fill('wrongpass123')
		await page.getByRole('button', { name: 'Log in' }).click()
		await expect(page.getByText('Email or password is incorrect')).toBeVisible()
	})

	test('login with valid credentials redirects to dashboard', async ({ page }) => {
		await page.goto('/login')
		await page.getByRole('textbox', { name: 'Enter your email' }).fill(TEST_ACCOUNT.email)
		await page.getByRole('textbox', { name: 'Enter your password' }).fill(TEST_ACCOUNT.password)
		await page.getByRole('button', { name: 'Log in' }).click()
		await page.waitForURL('/dashboard')
		await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
	})

	test('forgot password page works', async ({ page }) => {
		await page.goto('/forgot-password')
		await expect(page.getByText('Reset password')).toBeVisible()
		await page.getByRole('textbox', { name: 'Enter your email' }).fill('test@example.com')
		await page.getByRole('button', { name: 'Send reset link' }).click()
		await expect(page.getByText('Check your email')).toBeVisible()
	})

	test('reset password page renders', async ({ page }) => {
		await page.goto('/reset-password')
		await expect(page.getByText('Set new password')).toBeVisible()
		await expect(page.getByRole('textbox', { name: 'Enter new password' })).toBeVisible()
		await expect(page.getByRole('textbox', { name: 'Confirm new password' })).toBeVisible()
	})

	test('password eye toggle works', async ({ page }) => {
		await page.goto('/login')
		const passwordInput = page.getByRole('textbox', { name: 'Enter your password' })
		await expect(passwordInput).toHaveAttribute('type', 'password')
		await page.getByRole('button', { name: 'Show password' }).click()
		await expect(passwordInput).toHaveAttribute('type', 'text')
	})
})
