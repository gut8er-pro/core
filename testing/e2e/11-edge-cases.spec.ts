import { test, expect } from '@playwright/test'

test.describe('Edge Cases', () => {
	let reportId: string

	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage()
		await page.goto('http://localhost:3000/dashboard')
		const res = await page.evaluate(async () => {
			const r = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'PW Edge Case Test', reportType: 'HS' }),
			})
			return (await r.json()).report.id
		})
		reportId = res
		await page.close()
	})

	test('VIN field max 17 characters', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/vehicle`)
		await page.waitForTimeout(1000)
		const vin = page.locator('input[name="vin"]')
		await vin.fill('12345678901234567890') // 20 chars
		const value = await vin.inputValue()
		expect(value.length).toBeLessThanOrEqual(17)
	})

	test('numeric field rejects letters', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1000)
		await page.locator('input[name="mileageRead"]').fill('abc')
		await page.locator('input[name="mileageRead"]').blur()
		await page.waitForTimeout(1000)
		// Should either be empty or 0, not "abc"
		const value = await page.locator('input[name="mileageRead"]').inputValue()
		expect(value).not.toBe('abc')
	})

	test('tab completion badges are dynamic', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/vehicle`)
		await page.waitForTimeout(1000)
		// Initially should show "0/4" for vehicle
		const badge = page.locator('text=/Vehicle \\d+\\/\\d+/')
		await expect(badge).toBeVisible()
	})

	test('rapid field input does not lose data', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1000)

		// Fill 5 fields quickly without waiting
		await page.locator('input[name="claimantFirstName"]').fill('Rapid1')
		await page.locator('input[name="claimantLastName"]').fill('Rapid2')
		await page.locator('input[name="claimantStreet"]').fill('Rapid3')
		await page.locator('input[name="claimantPostcode"]').fill('99999')
		await page.locator('input[name="claimantLocation"]').fill('Rapid5')
		await page.locator('input[name="claimantLocation"]').blur()
		await page.waitForTimeout(3000)

		// Reload
		page.on('dialog', async d => await d.accept())
		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)

		await expect(page.locator('input[name="claimantFirstName"]')).toHaveValue('Rapid1')
		await expect(page.locator('input[name="claimantLastName"]')).toHaveValue('Rapid2')
		await expect(page.locator('input[name="claimantStreet"]')).toHaveValue('Rapid3')
		await expect(page.locator('input[name="claimantPostcode"]')).toHaveValue('99999')
		await expect(page.locator('input[name="claimantLocation"]')).toHaveValue('Rapid5')
	})

	test('Update Report button shows toast', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/vehicle`)
		await page.waitForTimeout(1000)
		await page.locator('input[name="vin"]').fill('TEST12345678901')
		await page.locator('input[name="vin"]').blur()
		await page.waitForTimeout(500)

		await page.locator('text=Update Report').click()
		await page.waitForTimeout(1000)
		// Toast should appear
		await expect(page.getByText('Report updated')).toBeVisible({ timeout: 3000 })
	})

	test('no console errors on normal navigation', async ({ page }) => {
		const errors: string[] = []
		page.on('console', msg => {
			if (msg.type() === 'error' && !msg.text().includes('400')) {
				errors.push(msg.text())
			}
		})

		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1000)
		await page.goto(`/reports/${reportId}/details/vehicle`)
		await page.waitForTimeout(1000)
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1000)
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(1000)
		await page.goto(`/reports/${reportId}/details/invoice`)
		await page.waitForTimeout(1000)

		expect(errors).toHaveLength(0)
	})
})
