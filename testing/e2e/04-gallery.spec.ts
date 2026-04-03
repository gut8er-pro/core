import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Gallery', () => {
	let reportId: string

	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage()
		await page.goto('http://localhost:3000/dashboard')
		const response = await page.evaluate(async () => {
			const r = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'PW Gallery Test', reportType: 'HS' }),
			})
			const json = await r.json()
			return json.report.id
		})
		reportId = response
		await page.close()
	})

	test('empty gallery shows upload zone', async ({ page }) => {
		await page.goto(`/reports/${reportId}/gallery`)
		await expect(page.getByText('Drag and drop here or click to upload')).toBeVisible()
		await expect(page.getByText('Instruction')).toBeVisible()
		await expect(page.getByText('Good lighting')).toBeVisible()
		await expect(page.getByText('Maximum 20 images')).toBeVisible()
		await expect(page.getByText('Suggested Photos')).toBeVisible()
	})

	test('upload photos via file input', async ({ page }) => {
		await page.goto(`/reports/${reportId}/gallery`)
		await page.waitForTimeout(1000)

		const imagesDir = path.resolve('testing/testing-images')
		await page.locator('input[type="file"]').setInputFiles([
			path.join(imagesDir, 'car1.png'),
			path.join(imagesDir, 'car2.png'),
			path.join(imagesDir, 'car3.png'),
			path.join(imagesDir, 'car4.png'),
			path.join(imagesDir, 'car5.png'),
		])

		// Wait for upload
		await page.waitForTimeout(5000)

		// Verify photos visible (at least check images exist)
		const images = page.locator('img[alt*="photo"], img[class*="object-cover"]')
		await expect(images.first()).toBeVisible()
	})

	test('generate report button visible after upload', async ({ page }) => {
		await page.goto(`/reports/${reportId}/gallery`)
		await expect(page.getByText('Generate Report')).toBeVisible()
	})
})
