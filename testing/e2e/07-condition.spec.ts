import { test, expect, type Page } from '@playwright/test'
import { createAuthPage, createReportViaAPI } from './helpers/test-data'

/** Opens the Tires accordion and waits until its fields are actually editable. */
async function openTires(page: Page) {
	const trigger = page.getByRole('button', { name: /^Tires\b/ }).first()
	if ((await trigger.getAttribute('data-state')) !== 'open') {
		await trigger.click()
	}
	await page.getByLabel('Tire size').waitFor({ state: 'visible', timeout: 15000 })
	await expect(page.getByLabel('Tire size')).toBeEditable()
}

test.describe('Condition Tab', () => {
	let reportId: string

	test.beforeAll(async ({ browser }) => {
		const page = await createAuthPage(browser)
		reportId = await createReportViaAPI(page, 'PW Condition Test', 'HS')
		await page.context().close()
	})

	test('condition form has all dropdowns', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		// 7 editable combos + the unit select, which stays a real enum
		await expect(page.locator('input[role="combobox"]')).toHaveCount(7)
		await expect(page.locator('button[role="combobox"]')).toHaveCount(1)
	})

	test('select dropdown opens and has options', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.locator('input[role="combobox"]').first().click()
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
		await page.locator('input[name="paintType"]').click()
		await page.waitForTimeout(300)
		await page.locator('[role="option"]:has-text("Metallic")').click()
		await page.waitForTimeout(1500)

		// Reload
		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="paintType"]')).toHaveValue('Metallic')
	})

	test('dropdowns also accept a typed value that matches no option', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1000)

		const paintCondition = page.locator('input[name="paintCondition"]')
		await paintCondition.fill('Wie neu, nur Flugrost')
		await paintCondition.blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="paintCondition"]')).toHaveValue(
			'Wie neu, nur Flugrost',
		)
	})

	test('mileage fields save and reload, formatted with thousands dots', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1000)
		await page.locator('input[name="mileageRead"]').fill('125000')
		await page.locator('input[name="estimateMileage"]').fill('126000')
		await page.locator('input[name="estimateMileage"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="mileageRead"]')).toHaveValue('125.000')
		await expect(page.locator('input[name="estimateMileage"]')).toHaveValue('126.000')
	})

	test('emission sticker selects, persists and deselects', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1000)

		const group4 = page.getByRole('button', { name: 'Emission group 4' })
		await group4.click()
		await page.waitForTimeout(1500)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.getByRole('button', { name: 'Emission group 4' })).toHaveAttribute(
			'aria-pressed',
			'true',
		)

		// Clicking the active group clears it — unknown stays unknown.
		await page.getByRole('button', { name: 'Emission group 4' }).click()
		await page.waitForTimeout(1500)
		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.getByRole('button', { name: 'Emission group 4' })).toHaveAttribute(
			'aria-pressed',
			'false',
		)
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
		// Airbags is a yes/no answer now — still unanswered after the reload
		const airbags = page.getByRole('radiogroup', { name: 'Airbags deployed' })
		await expect(airbags.getByRole('radio', { name: 'Yes' })).toHaveAttribute(
			'aria-checked',
			'false',
		)
		await expect(airbags.getByRole('radio', { name: 'No' })).toHaveAttribute(
			'aria-checked',
			'false',
		)
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

	test('align axes copies the active tire to its axle partner', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1500)
		await openTires(page)

		const size = page.getByLabel('Tire size')
		await size.fill('225/45 R17')
		await size.blur()
		const profile = page.getByLabel('Profile (mm)')
		await profile.fill('6')
		await profile.blur()
		await page.waitForTimeout(1500)

		await page.getByRole('button', { name: 'Align Axes' }).click()
		await page.waitForTimeout(2000)

		// VR is VL's front-axle partner and now carries the same values.
		await page.getByRole('button', { name: 'VR', exact: true }).click()
		await page.waitForTimeout(500)
		await expect(page.getByLabel('Tire size')).toHaveValue('225/45 R17')
		await expect(page.getByLabel('Profile (mm)')).toHaveValue('6')

		// The rear axle is untouched by an axle copy. Profile is the cleaner
		// witness: later tests in this file write a size to all four positions.
		await page.getByRole('button', { name: 'HL', exact: true }).click()
		await page.waitForTimeout(500)
		await expect(page.getByLabel('Profile (mm)')).not.toHaveValue('6')
	})

	test('match the set copies the active tire to all four positions', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1500)
		await openTires(page)

		const size = page.getByLabel('Tire size')
		await size.fill('205/55 R16')
		await size.blur()
		await page.waitForTimeout(1500)

		await page.getByRole('button', { name: 'Match The Set' }).click()
		await page.waitForTimeout(2000)

		for (const position of ['VR', 'HL', 'HR']) {
			await page.getByRole('button', { name: position, exact: true }).click()
			await page.waitForTimeout(400)
			await expect(page.getByLabel('Tire size')).toHaveValue('205/55 R16')
		}
	})
})
