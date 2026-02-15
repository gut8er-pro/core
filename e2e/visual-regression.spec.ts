import { test } from '@playwright/test'
import { takeScreenshot, VIEWPORTS } from './helpers/visual-regression'

test.describe('Visual Regression', () => {
	test.describe('Landing Page', () => {
		for (const [name, viewport] of Object.entries(VIEWPORTS)) {
			test(`landing page - ${name}`, async ({ page }) => {
				await page.setViewportSize(viewport)
				await page.goto('/')
				await takeScreenshot(page, `landing-${name}`)
			})
		}
	})

	test.describe('Login Page', () => {
		for (const [name, viewport] of Object.entries(VIEWPORTS)) {
			test(`login page - ${name}`, async ({ page }) => {
				await page.setViewportSize(viewport)
				await page.goto('/login')
				await takeScreenshot(page, `login-${name}`)
			})
		}
	})

	test.describe('Signup Steps', () => {
		const signupSteps = [
			{ step: 'account', path: '/signup/account' },
			{ step: 'personal', path: '/signup/personal' },
			{ step: 'business', path: '/signup/business' },
			{ step: 'plan', path: '/signup/plan' },
		]

		for (const { step, path } of signupSteps) {
			test(`signup step - ${step}`, async ({ page }) => {
				await page.setViewportSize(VIEWPORTS.desktop)
				await page.goto(path)
				await takeScreenshot(page, `signup-${step}`)
			})
		}
	})
})
