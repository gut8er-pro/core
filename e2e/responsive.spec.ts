import { test, expect } from '@playwright/test'

// Note: The Playwright config defines three projects:
//   - desktop: 1440x900
//   - tablet-landscape: iPad Pro 11 landscape
//   - tablet-portrait: iPad Pro 11 portrait
//
// These tests verify that layout adapts across viewport sizes.
// Some assertions are conditional on the project name, since elements like
// sidebars are hidden at smaller breakpoints.

// This suite has no auth setup, so it covers signed-out pages only: everything
// behind the login gate lives in testing/e2e/, which has a setup project and a
// real session (see testing/README.md).

test.describe('Responsive Behavior — Login Page', () => {
	test('login form is always visible regardless of viewport', async ({ page }) => {
		await page.goto('/login')

		// The login form is always in the right panel (w-full on mobile, lg:w-1/2 on desktop)
		await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
		await expect(page.getByLabel('Email address')).toBeVisible()
		await expect(page.getByLabel('Password')).toBeVisible()
		await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
	})

	test('left branding panel visibility depends on viewport', async ({
		page,
		browserName,
	}, testInfo) => {
		await page.goto('/login')

		// The left branding panel uses "hidden lg:flex" — visible only at lg (1024px+)
		const brandingPanel = page.locator('.hidden.lg\\:flex').first()

		if (testInfo.project.name === 'desktop') {
			// Desktop is 1440px wide — left panel should be visible
			await expect(brandingPanel).toBeVisible()
		} else if (testInfo.project.name === 'tablet-portrait') {
			// iPad Pro 11 portrait is ~834px wide — below lg breakpoint
			await expect(brandingPanel).not.toBeVisible()
		}
		// tablet-landscape varies — iPad Pro 11 landscape is ~1194px which is >= lg
	})
})

test.describe('Responsive Behavior — Signup Stepper', () => {
	test('stepper sidebar vs progress bar depends on viewport', async ({
		page,
	}, testInfo) => {
		await page.goto('/signup/account')

		// StepperSidebar: "hidden lg:flex" — visible at lg (1024px+)
		// StepperProgress: "lg:hidden" — visible below lg
		const sidebarStepper = page.getByLabel('Signup progress')

		if (testInfo.project.name === 'desktop') {
			// At 1440px, the full sidebar stepper should be visible
			await expect(sidebarStepper).toBeVisible()
		} else if (testInfo.project.name === 'tablet-portrait') {
			// At ~834px, the sidebar stepper is hidden; mobile stepper appears instead
			await expect(sidebarStepper).not.toBeVisible()
			// The mobile stepper progress bar should be visible
			const mobileProgress = page.locator('[aria-current="step"]').first()
			await expect(mobileProgress).toBeVisible()
		}
	})
})
