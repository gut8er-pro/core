import { test, expect } from '@playwright/test'

test.describe('Condition Tab', () => {
	let reportId: string

	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage()
		await page.goto('http://localhost:3000/dashboard')
		const res = await page.evaluate(async () => {
			const r = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'PW Condition Test', reportType: 'HS' }),
			})
			return (await r.json()).report.id
		})
		reportId = res
		await page.close()
	})

	test('condition form has all dropdowns', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		const comboboxes = page.locator('[role="combobox"]')
		// 7 selects + 1 unit = 8
		await expect(comboboxes).toHaveCount(8)
	})

	test('select dropdown opens and has options', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.locator('[role="combobox"]').first().click()
		await page.waitForTimeout(300)
		const options = page.locator('[role="option"]')
		await expect(options.first()).toBeVisible()
		const count = await options.count()
		expect(count).toBeGreaterThan(0)
	})

	test('select values persist after reload', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1000)

		// Select "Metallic" for paint type
		await page.locator('[role="combobox"]').first().click()
		await page.waitForTimeout(300)
		await page.locator('[role="option"]:has-text("Metallic")').click()
		await page.waitForTimeout(1500)

		// Reload
		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('[role="combobox"]').first()).toHaveText('Metallic')
	})

	test('mileage fields save and reload', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1000)
		await page.locator('input[name="mileageRead"]').fill('125000')
		await page.locator('input[name="estimateMileage"]').fill('126000')
		await page.locator('input[name="estimateMileage"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="mileageRead"]')).toHaveValue('125000')
		await expect(page.locator('input[name="estimateMileage"]')).toHaveValue('126000')
	})

	test('checkbox pills toggle and persist', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1000)

		await page.locator('text=Full serviced history').click()
		await page.waitForTimeout(300)
		await page.locator('text=Test drive performed').click()
		await page.waitForTimeout(1500)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)

		// Active pills have border-primary class
		const fullService = page.locator('text=Full serviced history')
		await expect(fullService).toHaveClass(/border-primary/)
		const testDrive = page.locator('text=Test drive performed')
		await expect(testDrive).toHaveClass(/border-primary/)
		// Airbags should still be inactive
		const airbags = page.locator('text=Airbags deployed')
		await expect(airbags).toHaveClass(/border-border/)
	})

	test('notes textarea saves', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1000)
		await page.locator('textarea[name="notes"]').fill('Test notes for condition assessment')
		await page.locator('textarea[name="notes"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('textarea[name="notes"]')).toHaveValue('Test notes for condition assessment')
	})

	test('prior damage section expands and saves', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1000)

		await page.locator('text=Prior and Existing Damage').first().click()
		await page.waitForTimeout(500)
		await page.locator('input[name="previousDamageReported"]').fill('Rear bumper repair')
		await page.locator('input[name="previousDamageReported"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await page.locator('text=Prior and Existing Damage').first().click()
		await page.waitForTimeout(500)
		await expect(page.locator('input[name="previousDamageReported"]')).toHaveValue('Rear bumper repair')
	})

	test('visual accident details section exists', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await expect(page.getByText('Visual Accident Details')).toBeVisible()
	})

	test('tires section exists', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await expect(page.getByText('Tires')).toBeVisible()
	})
})
