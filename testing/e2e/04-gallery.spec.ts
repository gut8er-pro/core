import { test, expect } from '@playwright/test'
import path from 'path'
import { createAuthPage, createReportViaAPI } from './helpers/test-data'

test.describe('Gallery', () => {
	let reportId: string

	test.beforeAll(async ({ browser }) => {
		const page = await createAuthPage(browser)
		reportId = await createReportViaAPI(page, 'PW Gallery Test', 'HS')
		await page.context().close()
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
		await page.locator('input[type="file"]').first().setInputFiles([
			path.join(imagesDir, 'car1.png'),
			path.join(imagesDir, 'car2.png'),
			path.join(imagesDir, 'car3.png'),
			path.join(imagesDir, 'car4.png'),
			path.join(imagesDir, 'car5.png'),
		])

		// Wait for upload
		await page.waitForTimeout(8000)

		// Verify photos visible (at least check images exist)
		const images = page.locator('img[alt*="photo"], img[class*="object-cover"]')
		await expect(images.first()).toBeVisible({ timeout: 10000 })
	})

	test('generate report button visible after upload', async ({ page }) => {
		await page.goto(`/reports/${reportId}/gallery`)
		await expect(page.getByRole('button', { name: 'Generate Report' })).toBeVisible()
	})
})

/** Reads the photo ids in the order the gallery/API currently holds them. */
async function photoOrder(page: any, id: string): Promise<string[]> {
	return page.evaluate(async (reportId: string) => {
		const res = await fetch(`/api/reports/${reportId}/photos`)
		const body = await res.json()
		return body.photos.map((photo: { id: string }) => photo.id)
	}, id)
}

/** Uploads settle asynchronously, so wait on the count rather than the clock. */
async function waitForPhotoCount(page: any, id: string, expected: number) {
	await expect
		.poll(async () => (await photoOrder(page, id)).length, { timeout: 60_000, intervals: [1000] })
		.toBe(expected)
}

test.describe('Gallery drag & drop, reordering and rotation', () => {
	let reportId: string

	test.beforeAll(async ({ browser }) => {
		test.setTimeout(120_000)
		const page = await createAuthPage(browser)
		reportId = await createReportViaAPI(page, 'PW Gallery DnD', 'HS')
		await page.goto(`/reports/${reportId}/gallery`)
		await page.waitForTimeout(1000)

		const imagesDir = path.resolve('testing/testing-images')
		await page
			.locator('input[type="file"]')
			.first()
			.setInputFiles([path.join(imagesDir, 'car1.png'), path.join(imagesDir, 'car2.png')])
		await waitForPhotoCount(page, reportId, 2)
		await page.context().close()
	})

	test('dropping files on a non-empty gallery uploads them without navigating away', async ({
		page,
	}) => {
		test.setTimeout(180_000)
		await page.goto(`/reports/${reportId}/gallery`)
		await page.waitForSelector('[data-photo-id]', { timeout: 60000 })

		// A generated report opens straight into the single-photo view, so drop
		// onto whichever surface is actually mounted.
		const target = (await page.locator('[data-testid="photo-grid"]').count())
			? '[data-testid="photo-grid"]'
			: '[data-gallery-drop]'

		const before = (await photoOrder(page, reportId)).length

		const buffer = require('fs').readFileSync(
			path.resolve('testing/testing-images/car3.png'),
		) as Buffer

		await page.evaluate(async (args: { bytes: number[]; selector: string }) => {
			const grid = document.querySelector(args.selector)
			if (!grid) throw new Error('no drop surface mounted')

			const file = new File([new Uint8Array(args.bytes)], 'dropped.png', { type: 'image/png' })
			const dataTransfer = new DataTransfer()
			dataTransfer.items.add(file)

			for (const type of ['dragenter', 'dragover', 'drop']) {
				grid.dispatchEvent(
					new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }),
				)
			}
		}, { bytes: Array.from(buffer), selector: target })

		await waitForPhotoCount(page, reportId, before + 1)

		// The drop must not have taken the tab anywhere.
		expect(page.url()).toContain(`/reports/${reportId}/gallery`)
	})

	test('reordering thumbnails persists after a reload', async ({ page }) => {
		test.setTimeout(120_000)
		await page.goto(`/reports/${reportId}/gallery`)
		await page.waitForSelector('[data-testid="photo-grid"]', { timeout: 15000 })

		const before = await photoOrder(page, reportId)
		expect(before.length).toBeGreaterThan(1)

		const first = page.locator('[data-photo-id]').first()
		const second = page.locator('[data-photo-id]').nth(1)
		await first.dragTo(second)

		await expect
			.poll(async () => (await photoOrder(page, reportId))[0], { timeout: 30_000 })
			.toBe(before[1])

		const after = await photoOrder(page, reportId)
		expect(after[1]).toBe(before[0])

		await page.reload()
		await page.waitForSelector('[data-testid="photo-grid"]', { timeout: 15000 })
		expect(await photoOrder(page, reportId)).toEqual(after)
	})

	test('rotating a photo persists after a reload', async ({ page }) => {
		test.setTimeout(180_000)
		await page.goto(`/reports/${reportId}/gallery`)
		await page.waitForSelector('[data-photo-id]', { timeout: 15000 })

		await page.locator('[data-photo-id]').first().click()
		const rotate = page.getByRole('button', { name: 'Rotate photo' })
		await expect(rotate).toBeVisible({ timeout: 10000 })

		const target = (await photoOrder(page, reportId))[0]!
		const storedUrl = () =>
			page.evaluate(async (args: { id: string; photoId: string }) => {
				const res = await fetch(`/api/reports/${args.id}/photos`)
				const body = await res.json()
				const photo = body.photos.find((p: { id: string }) => p.id === args.photoId)
				return photo.url as string
			}, { id: reportId, photoId: target })

		const urlBefore = await storedUrl()

		await rotate.click()

		// Re-encoding replaces the stored bytes and moves the cache-busted url, so
		// the PDF and the AI see the new orientation rather than a CSS-only turn.
		await expect.poll(storedUrl, { timeout: 120_000, intervals: [2000] }).not.toBe(urlBefore)
		const urlAfter = await storedUrl()

		await page.reload()
		await page.waitForSelector('[data-photo-id]', { timeout: 60000 })
		expect(await storedUrl()).toBe(urlAfter)
	})
})
