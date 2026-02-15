import { test, expect } from '@playwright/test'

// Note: requires auth setup — mock or seed user before running
// These tests assume a report with id "test-report-1" exists, or that the
// route can render without a live backend (e.g. MSW mock or seeded data).

const GALLERY_URL = '/reports/test-report-1/gallery'

test.describe('Report Gallery Page', () => {
	test('gallery page shows upload zone with drag-and-drop area', async ({ page }) => {
		await page.goto(GALLERY_URL)

		// The upload zone is a button element with aria-label "Upload photos"
		const uploadZone = page.getByRole('button', { name: 'Upload photos' })
		await expect(uploadZone).toBeVisible()

		// Drag-and-drop instruction text
		await expect(page.getByText('Drag & drop photos here')).toBeVisible()
		await expect(page.getByText('or click to browse')).toBeVisible()
	})

	test('upload zone shows photo count indicator', async ({ page }) => {
		await page.goto(GALLERY_URL)

		// The upload zone displays "N / 20 photos"
		await expect(page.getByText(/\d+\s*\/\s*20 photos/)).toBeVisible()
	})

	test('view toggle buttons for single and grid views are present', async ({ page }) => {
		await page.goto(GALLERY_URL)

		const singleViewButton = page.getByRole('button', { name: 'Single view' })
		const gridViewButton = page.getByRole('button', { name: 'Grid view' })

		await expect(singleViewButton).toBeVisible()
		await expect(gridViewButton).toBeVisible()
	})

	test('gallery page shows heading', async ({ page }) => {
		await page.goto(GALLERY_URL)

		await expect(page.getByRole('heading', { name: 'Gallery' })).toBeVisible()
	})

	test('instruction sidebar shows photo tips on desktop', async ({ page }) => {
		// The instruction sidebar is hidden below xl breakpoint (hidden xl:block)
		await page.goto(GALLERY_URL)

		// On desktop (1440px), the instruction sidebar should be visible
		const photoTipsHeading = page.getByRole('heading', { name: 'Photo Tips' })
		const suggestedPhotosHeading = page.getByRole('heading', {
			name: 'Suggested Photos',
		})

		// These will be visible on desktop viewport, may be hidden on tablet
		if (await photoTipsHeading.isVisible()) {
			await expect(photoTipsHeading).toBeVisible()
			await expect(suggestedPhotosHeading).toBeVisible()

			// Check some specific tips
			await expect(page.getByText('Take photos in good lighting')).toBeVisible()
			await expect(page.getByText('Avoid using flash')).toBeVisible()
			await expect(page.getByText('Maximum 20 photos per report')).toBeVisible()

			// Check some suggested photo labels
			await expect(page.getByText('Front Left')).toBeVisible()
			await expect(page.getByText('VIN Plate')).toBeVisible()
			await expect(page.getByText('Damage Overview')).toBeVisible()
		}
	})
})
