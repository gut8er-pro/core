import { test, expect } from '@playwright/test'

// Note: The Playwright config defines three projects:
//   - desktop: 1440x900
//   - tablet-landscape: iPad Pro 11 landscape
//   - tablet-portrait: iPad Pro 11 portrait
//
// These tests verify that layout adapts across viewport sizes.
// Some assertions are conditional on the project name, since elements like
// sidebars are hidden at smaller breakpoints.

// Note: auth-gated pages require auth setup — mock or seed user before running

const REPORT_ID = 'test-report-1'

test.describe('Responsive Behavior — Landing Page', () => {
	test('navigation and hero render correctly at all viewport sizes', async ({ page }) => {
		await page.goto('/')

		// Navigation header is always visible
		await expect(page.locator('header').first()).toBeVisible()

		// Hero text is always visible
		await expect(page.getByText('Professional Vehicle')).toBeVisible()
		await expect(page.getByText('Damage Assessment')).toBeVisible()
	})

	test('footer is visible at all viewport sizes', async ({ page }) => {
		await page.goto('/')

		await expect(page.locator('footer')).toBeVisible()
	})
})

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

test.describe('Responsive Behavior — Report Sidebar', () => {
	test('report sidebar visibility depends on viewport', async ({ page }, testInfo) => {
		await page.goto(`/reports/${REPORT_ID}/gallery`)

		// ReportSidebar: "hidden lg:block" — only visible at lg (1024px+)
		const reportSidebar = page.getByLabel('Report navigation')

		if (testInfo.project.name === 'desktop') {
			await expect(reportSidebar).toBeVisible()
		} else if (testInfo.project.name === 'tablet-portrait') {
			// On tablet portrait (~834px), sidebar is hidden and content fills full width
			await expect(reportSidebar).not.toBeVisible()
		}
	})
})

test.describe('Responsive Behavior — Gallery Instruction Sidebar', () => {
	test('instruction sidebar visibility depends on viewport', async ({ page }, testInfo) => {
		await page.goto(`/reports/${REPORT_ID}/gallery`)

		// InstructionSidebar: "hidden xl:block" — only visible at xl (1280px+)
		const photoTips = page.getByRole('heading', { name: 'Photo Tips' })

		if (testInfo.project.name === 'desktop') {
			// Desktop is 1440px — above xl breakpoint
			await expect(photoTips).toBeVisible()
		} else if (
			testInfo.project.name === 'tablet-portrait' ||
			testInfo.project.name === 'tablet-landscape'
		) {
			// iPad Pro 11 portrait (~834px) and landscape (~1194px) are both below xl
			await expect(photoTips).not.toBeVisible()
		}
	})
})

test.describe('Responsive Behavior — Dashboard Nav Buttons', () => {
	test('top nav bar adapts user info display based on viewport', async ({
		page,
	}, testInfo) => {
		await page.goto('/dashboard')

		// The user name text uses "hidden lg:block" — only visible at lg+
		const header = page.locator('header')

		if (testInfo.project.name === 'desktop') {
			// At 1440px, the nav buttons and user avatar should all be visible
			await expect(header.getByRole('button', { name: 'Settings' })).toBeVisible()
			await expect(header.getByRole('button', { name: 'Notifications' })).toBeVisible()
		}

		// The avatar circle (with initial letter) is always visible in the header
		// regardless of viewport
	})
})
