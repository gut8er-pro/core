import { test, expect } from '@playwright/test'
import { CALCULATION_DATA } from './helpers/test-data'

test.describe('Calculation / Valuation Tab', () => {
	const reportIds: Record<string, string> = {}

	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage()
		await page.goto('http://localhost:3000/dashboard')
		for (const type of ['HS', 'BE', 'KG', 'OT']) {
			const res = await page.evaluate(async (t) => {
				const r = await fetch('/api/reports', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ title: `PW Calc ${t}`, reportType: t }),
				})
				return (await r.json()).report.id
			}, type)
			reportIds[type] = res
		}
		await page.close()
	})

	test('HS: Vehicle Value + Repair + Loss of Use visible', async ({ page }) => {
		await page.goto(`/reports/${reportIds.HS}/details/calculation`)
		await expect(page.getByText('Vehicle Value')).toBeVisible()
		await expect(page.getByText('Repair')).toBeVisible()
		await expect(page.getByText('Loss of Use')).toBeVisible()
		await expect(page.getByText('Correction Calculation')).toBeVisible()
		await expect(page.getByText('Results without repair')).toBeVisible()
	})

	test('HS: calculation fields save and reload', async ({ page }) => {
		await page.goto(`/reports/${reportIds.HS}/details/calculation`)
		await page.waitForTimeout(1000)

		for (const [name, value] of Object.entries(CALCULATION_DATA)) {
			await page.locator(`input[name="${name}"]`).fill(value)
		}
		await page.locator('input[name="replacementTimeDays"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)

		await expect(page.locator('input[name="replacementValue"]')).toHaveValue('25000')
		await expect(page.locator('input[name="residualValue"]')).toHaveValue('18000')
		await expect(page.locator('input[name="repairMethod"]')).toHaveValue('Instandsetzung')
		await expect(page.locator('input[name="repairTimeDays"]')).toHaveValue('7')
	})

	test('BE: shows DAT + Manual Valuation', async ({ page }) => {
		await page.goto(`/reports/${reportIds.BE}/details/calculation`)
		await expect(page.getByText('DAT Valuation')).toBeVisible()
		await expect(page.getByText('Manual Valuation')).toBeVisible()
		await expect(page.getByText('Correction Calculation')).toBeVisible()
	})

	test('BE: valuation fields save and reload', async ({ page }) => {
		await page.goto(`/reports/${reportIds.BE}/details/calculation`)
		await page.waitForTimeout(1000)
		await page.locator('input[name="valuationMax"]').fill('30000')
		await page.locator('input[name="valuationAvg"]').fill('27000')
		await page.locator('input[name="valuationMin"]').fill('24000')
		await page.locator('input[name="valuationMin"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="valuationMax"]')).toHaveValue('30000')
		await expect(page.locator('input[name="valuationAvg"]')).toHaveValue('27000')
		await expect(page.locator('input[name="valuationMin"]')).toHaveValue('24000')
	})

	test('KG: NO Correction, NO Result cards', async ({ page }) => {
		await page.goto(`/reports/${reportIds.KG}/details/calculation`)
		await expect(page.getByText('Vehicle Value')).toBeVisible()
		await expect(page.getByText('Loss of Use')).toBeVisible()
		await expect(page.locator('text=Correction Calculation')).not.toBeVisible()
		await expect(page.locator('text=Results without repair')).not.toBeVisible()
	})

	test('OT: Market + Replacement + Restoration + Total Cost', async ({ page }) => {
		await page.goto(`/reports/${reportIds.OT}/details/calculation`)
		await expect(page.getByText('Market value')).toBeVisible()
		await expect(page.getByText('Replacement value')).toBeVisible()
		await expect(page.getByText('Restoration Value')).toBeVisible()
		await expect(page.getByText('Total Cost')).toBeVisible()
		await expect(page.locator('text=Correction Calculation')).not.toBeVisible()
	})

	test('OT: valuation fields save and reload', async ({ page }) => {
		await page.goto(`/reports/${reportIds.OT}/details/calculation`)
		await page.waitForTimeout(1000)
		await page.locator('input[name="marketValue"]').fill('55000')
		await page.locator('input[name="replacementValue"]').fill('60000')
		await page.locator('input[name="replacementValue"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="marketValue"]')).toHaveValue('55000')
		await expect(page.locator('input[name="replacementValue"]')).toHaveValue('60000')
	})
})
