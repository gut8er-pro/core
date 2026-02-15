import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
	test('login page loads with email and password fields and social login buttons', async ({
		page,
	}) => {
		await page.goto('/login')

		await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
		await expect(page.getByText('Sign in to your account to continue')).toBeVisible()

		// Email and password fields
		await expect(page.getByLabel('Email address')).toBeVisible()
		await expect(page.getByLabel('Password')).toBeVisible()

		// Sign in button
		await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()

		// Social login buttons
		await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Continue with Apple' })).toBeVisible()
	})

	test('login page has "Forgot password?" and signup links', async ({ page }) => {
		await page.goto('/login')

		const forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' })
		await expect(forgotPasswordLink).toBeVisible()
		await expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password')

		const createAccountLink = page.getByRole('link', { name: 'Create account' })
		await expect(createAccountLink).toBeVisible()
		await expect(createAccountLink).toHaveAttribute('href', '/signup/account')
	})
})

test.describe('Signup Wizard', () => {
	test('step 1 (account) shows email, password, and confirm password fields', async ({
		page,
	}) => {
		await page.goto('/signup/account')

		await expect(
			page.getByRole('heading', { name: 'Create your account' }),
		).toBeVisible()
		await expect(
			page.getByText('Start with your email and a secure password'),
		).toBeVisible()

		await expect(page.getByLabel('Email address')).toBeVisible()
		await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
		await expect(page.getByLabel('Confirm password')).toBeVisible()

		// Continue button
		await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
	})

	test('step 1 shows correct stepper sidebar highlighting on desktop', async ({
		page,
		browserName,
	}) => {
		// The stepper sidebar is hidden on smaller viewports (lg:flex)
		// This test is most relevant on desktop
		await page.goto('/signup/account')

		// The stepper sidebar should show step labels
		const stepperNav = page.getByLabel('Signup steps')

		// On large viewports the sidebar is visible
		if ((await stepperNav.isVisible()) === true) {
			await expect(stepperNav.getByText('Account')).toBeVisible()
			await expect(stepperNav.getByText('Personal')).toBeVisible()
			await expect(stepperNav.getByText('Business')).toBeVisible()
			await expect(stepperNav.getByText('Plan')).toBeVisible()
			await expect(stepperNav.getByText('Integrations')).toBeVisible()

			// Step 1 should be the current step
			const step1Indicator = page.locator('[aria-current="step"]').first()
			await expect(step1Indicator).toBeVisible()
		}
	})

	test('signup step 2 (personal) loads at /signup/personal', async ({ page }) => {
		await page.goto('/signup/personal')

		await expect(
			page.getByRole('heading', { name: 'Personal details' }),
		).toBeVisible()
		await expect(page.getByText('Tell us about yourself')).toBeVisible()

		await expect(page.getByLabel('First name')).toBeVisible()
		await expect(page.getByLabel('Last name')).toBeVisible()
		await expect(page.getByLabel('Phone number')).toBeVisible()
	})

	test('signup step 3 (business) loads at /signup/business', async ({ page }) => {
		await page.goto('/signup/business')

		// Business step should have its own heading
		const heading = page.locator('h2').first()
		await expect(heading).toBeVisible()
	})

	test('signup step 4 (plan) loads at /signup/plan', async ({ page }) => {
		await page.goto('/signup/plan')

		// Plan step should be visible
		const heading = page.locator('h2').first()
		await expect(heading).toBeVisible()
	})

	test('signup step 5 (integrations) loads at /signup/integrations', async ({ page }) => {
		await page.goto('/signup/integrations')

		// Integrations step should be visible
		const heading = page.locator('h2').first()
		await expect(heading).toBeVisible()
	})

	test('each signup step shows the correct stepper sidebar step indicator', async ({
		page,
	}) => {
		const stepRoutes = [
			{ path: '/signup/account', stepNumber: '1' },
			{ path: '/signup/personal', stepNumber: '2' },
			{ path: '/signup/business', stepNumber: '3' },
			{ path: '/signup/plan', stepNumber: '4' },
			{ path: '/signup/integrations', stepNumber: '5' },
		]

		for (const { path, stepNumber } of stepRoutes) {
			await page.goto(path)

			// Check that the current step indicator is present
			const currentStepIndicator = page.locator('[aria-current="step"]').first()
			await expect(currentStepIndicator).toBeVisible()

			// On smaller viewports, the mobile stepper progress bar is used;
			// on desktop, the sidebar stepper is shown. Either way, the
			// aria-current="step" marker should contain or correspond to the step number.
			const indicatorText = await currentStepIndicator.textContent()
			expect(indicatorText).toContain(stepNumber)
		}
	})
})
