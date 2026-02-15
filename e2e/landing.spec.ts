import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
	test('page loads with hero section containing key headline text', async ({ page }) => {
		await page.goto('/')

		const hero = page.locator('section').first()
		await expect(hero).toBeVisible()
		await expect(page.getByText('Professional Vehicle')).toBeVisible()
		await expect(page.getByText('Damage Assessment')).toBeVisible()
	})

	test('navigation has "Log In" link and "Get Started Free" button', async ({ page }) => {
		await page.goto('/')

		const header = page.locator('header').first()
		await expect(header).toBeVisible()

		const loginLink = header.getByRole('link', { name: 'Log In' })
		await expect(loginLink).toBeVisible()
		await expect(loginLink).toHaveAttribute('href', '/login')

		const getStartedButton = header.getByRole('link', { name: 'Get Started Free' })
		await expect(getStartedButton).toBeVisible()
		await expect(getStartedButton).toHaveAttribute('href', '/signup/account')
	})

	test('features section shows 4 feature cards', async ({ page }) => {
		await page.goto('/')

		await expect(page.getByText('Everything you need')).toBeVisible()

		const featureTitles = [
			'DAT Integration',
			'Smart Analytics',
			'Photo Editing',
			'Digital Invoicing',
		]

		for (const title of featureTitles) {
			await expect(page.getByRole('heading', { name: title })).toBeVisible()
		}
	})

	test('FAQ section has 5 collapsible items and clicking one expands its answer', async ({
		page,
	}) => {
		await page.goto('/')

		await expect(
			page.getByRole('heading', { name: 'Frequently Asked Questions' }),
		).toBeVisible()

		const faqQuestions = [
			'What is Gut8erPRO?',
			'How does the 14-day free trial work?',
			'What integrations are available?',
			'Can I export reports as PDF?',
			'How secure is my data?',
		]

		// All 5 FAQ triggers should be visible
		for (const question of faqQuestions) {
			await expect(page.getByRole('button', { name: question })).toBeVisible()
		}

		// Click first FAQ item and verify its answer is expanded
		const firstTrigger = page.getByRole('button', { name: faqQuestions[0] })
		await firstTrigger.click()

		await expect(
			page.getByText('Gut8erPRO is a professional vehicle damage assessment'),
		).toBeVisible()
	})

	test('footer shows copyright, Privacy, Terms, and Contact links', async ({ page }) => {
		await page.goto('/')

		const footer = page.locator('footer')
		await expect(footer).toBeVisible()

		const currentYear = new Date().getFullYear().toString()
		await expect(footer.getByText(currentYear)).toBeVisible()
		await expect(footer.getByText('All rights reserved')).toBeVisible()

		await expect(footer.getByRole('link', { name: 'Privacy' })).toBeVisible()
		await expect(footer.getByRole('link', { name: 'Terms' })).toBeVisible()
		await expect(footer.getByRole('link', { name: 'Contact' })).toBeVisible()
	})

	test('stats section shows "1000+", "50+", "4.9"', async ({ page }) => {
		await page.goto('/')

		await expect(page.getByText('1000+')).toBeVisible()
		await expect(page.getByText('50+')).toBeVisible()
		await expect(page.getByText('4.9')).toBeVisible()

		// Verify their labels are also present
		await expect(page.getByText('Reports')).toBeVisible()
		await expect(page.getByText('Experts')).toBeVisible()
		await expect(page.getByText('Rating')).toBeVisible()
	})
})
