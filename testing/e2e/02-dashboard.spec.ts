import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
	test('dashboard loads with report list', async ({ page }) => {
		await page.goto('/')
		await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
		await expect(page.getByText('Total Revenue')).toBeVisible()
		await expect(page.getByText('Recent Reports')).toBeVisible()
	})

	test('revenue chart has period selector', async ({ page }) => {
		await page.goto('/')
		await expect(page.getByText('Yearly')).toBeVisible()
		await expect(page.getByText('Monthly')).toBeVisible()
		await expect(page.getByText('Weekly')).toBeVisible()
	})

	test('nav bar elements visible', async ({ page }) => {
		await page.goto('/')
		await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Statistics' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()
		await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible()
	})

	test('create HS report via API', async ({ page }) => {
		await page.goto('/')
		const response = await page.evaluate(async () => {
			const r = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Playwright Test HS', reportType: 'HS' }),
			})
			return r.json()
		})
		expect(response.report.id).toBeTruthy()
		expect(response.report.reportType).toBe('HS')
	})

	test('statistics page loads', async ({ page }) => {
		await page.goto('/statistics')
		await expect(page.getByText('Financial Analytics')).toBeVisible()
	})

	test('report number column shows file numbers, never generated ids', async ({ page }) => {
		await page.goto('/')
		await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
		await expect(page.getByText(/^GH-[A-F0-9]{3}-[A-F0-9]{2}$/)).toHaveCount(0)
	})

	test('marking an invoice paid moves the money from Pending to Total Revenue', async ({
		page,
	}) => {
		await page.goto('/')
		await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

		const before = await page.evaluate(async () => {
			const r = await fetch('/api/stats')
			return r.json()
		})

		const unpaid = before.invoices.find(
			(i: { status: string }) => i.status === 'pending' || i.status === 'delayed',
		)
		test.skip(!unpaid, 'no unpaid invoice in this database')

		const marked = await page.evaluate(async (id: string) => {
			const r = await fetch(`/api/invoices/${id}/payment`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ paid: true }),
			})
			return r.json()
		}, unpaid.id)
		expect(marked.status).toBe('completed')
		expect(marked.paidAt).toBeTruthy()

		const after = await page.evaluate(async () => {
			const r = await fetch('/api/stats')
			return r.json()
		})

		// Which of the two unpaid buckets it left depends on the due date, which can tip
		// between the two reads, so assert against the unpaid pool as a whole.
		const unpaidBefore = before.pendingRevenue + before.delayedRevenue
		const unpaidAfter = after.pendingRevenue + after.delayedRevenue
		expect(after.totalRevenue).toBeCloseTo(before.totalRevenue + unpaid.amount, 2)
		expect(unpaidAfter).toBeCloseTo(unpaidBefore - unpaid.amount, 2)
		expect(after.completedPayments).toBe(before.completedPayments + 1)

		// The headline number and the three counts always come off the same query.
		expect(after.totalRevenue + unpaidAfter).toBeCloseTo(before.totalRevenue + unpaidBefore, 2)

		await page.reload()
		await expect(page.getByText('Total Revenue')).toBeVisible()

		const reverted = await page.evaluate(async (id: string) => {
			const r = await fetch(`/api/invoices/${id}/payment`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ paid: false }),
			})
			return r.json()
		}, unpaid.id)
		expect(reverted.paidAt).toBeNull()

		const restored = await page.evaluate(async () => {
			const r = await fetch('/api/stats')
			return r.json()
		})
		expect(restored.totalRevenue).toBeCloseTo(before.totalRevenue, 2)
	})

	test('statistics status chip toggles a payment', async ({ page }) => {
		await page.goto('/statistics')
		await expect(page.getByText('Financial Analytics')).toBeVisible()

		const chip = page.getByRole('button', { name: 'Change payment status' }).first()
		await expect(chip).toBeVisible()

		const label = (await chip.textContent())?.trim()
		await chip.click()
		await expect(chip).not.toHaveText(label ?? '', { timeout: 15_000 })

		await chip.click()
		await expect(chip).toHaveText(label ?? '', { timeout: 15_000 })
	})

	test('notifications page loads', async ({ page }) => {
		await page.goto('/notifications')
		await expect(page.getByText('Notifications')).toBeVisible()
	})
})
