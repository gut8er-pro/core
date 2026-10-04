import { expect, type Page, test } from '@playwright/test'
import { createAuthPage, createReportViaAPI } from './helpers/test-data'

/**
 * A locked report — closed to change, open to delivery (CONTEXT.md → Report locking).
 *
 * The server refused locked writes long before the UI did, and that gap is what
 * the client hit: inputs that accepted typing on a locked report while every
 * save bounced. This spec pins all three halves of the definition: the server
 * refuses, every tab freezes, and the export composer stays usable.
 */

type Write = { label: string; method: 'PATCH' | 'POST' | 'DELETE'; path: string; body?: unknown }

const WRITES: Write[] = [
	{ label: 'accident info', method: 'PATCH', path: 'accident-info', body: { accidentInfo: {} } },
	{ label: 'vehicle', method: 'PATCH', path: 'vehicle', body: { vin: 'WVWZZZ1JZXW000001' } },
	{ label: 'condition', method: 'PATCH', path: 'condition', body: { condition: {} } },
	{
		label: 'damage marker',
		method: 'PATCH',
		path: 'condition',
		body: { damageMarkers: [{ x: 10, y: 20, comment: null }] },
	},
	{ label: 'calculation', method: 'PATCH', path: 'calculation', body: { calculation: {} } },
	{ label: 'invoice', method: 'PATCH', path: 'invoice', body: { invoice: {} } },
	{ label: 'photo upload', method: 'POST', path: 'photos', body: {} },
	{ label: 'photo reorder', method: 'PATCH', path: 'photos/reorder', body: { photoIds: [] } },
	{ label: 'report title', method: 'PATCH', path: '', body: { title: 'Renamed after delivery' } },
	{ label: 'report delete', method: 'DELETE', path: '' },
]

async function setLocked(page: Page, reportId: string, locked: boolean) {
	await page.evaluate(
		async (args: { rid: string; locked: boolean }) => {
			// Locking goes through the report PATCH (refused once locked); unlocking
			// goes through Export, the one door the definition leaves open.
			const response = args.locked
				? await fetch(`/api/reports/${args.rid}`, {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ status: 'LOCKED', isLocked: true }),
					})
				: await fetch(`/api/reports/${args.rid}/export`, {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ lockReport: false }),
					})
			if (!response.ok) throw new Error(`Lock toggle failed: ${response.status}`)
		},
		{ rid: reportId, locked },
	)
}

/** Every visible text input, textarea and select inside the page body. */
async function expectNothingEditable(page: Page) {
	const fields = page.locator('main').locator('input:visible, textarea:visible, select:visible')
	// The tab renders a spinner until its section data loads.
	await expect(fields.first()).toBeVisible({ timeout: 30_000 })
	const count = await fields.count()
	expect(count, 'the tab rendered no fields at all').toBeGreaterThan(0)
	for (let i = 0; i < count; i++) {
		const field = fields.nth(i)
		const name =
			(await field.getAttribute('name')) ?? (await field.getAttribute('placeholder')) ?? `#${i}`
		expect(await field.isEditable(), `field "${name}" is editable on a locked report`).toBe(false)
	}
}

test.describe.serial('Locked report', () => {
	test.setTimeout(120000)
	let reportId: string

	test.beforeAll(async ({ browser }) => {
		const page = await createAuthPage(browser)
		reportId = await createReportViaAPI(page, 'PW Locked Report', 'HS')
		await setLocked(page, reportId, true)
		await page.context().close()
	})

	test.afterAll(async ({ browser }) => {
		// Unlock so the suite's own cleanup (or a human) can delete it.
		if (!reportId) return
		const page = await createAuthPage(browser)
		await page.goto('/')
		await setLocked(page, reportId, false)
		await page.context().close()
	})

	test('the server refuses every write that would change the Gutachten', async ({ page }) => {
		await page.goto('/')
		for (const write of WRITES) {
			const status = await page.evaluate(
				async (args: { rid: string; write: Write }) => {
					const suffix = args.write.path ? `/${args.write.path}` : ''
					const response = await fetch(`/api/reports/${args.rid}${suffix}`, {
						method: args.write.method,
						headers: { 'Content-Type': 'application/json' },
						body: args.write.body === undefined ? undefined : JSON.stringify(args.write.body),
					})
					return response.status
				},
				{ rid: reportId, write },
			)
			expect(status, `${write.label} was not refused`).toBe(403)
		}

		// The refused delete really left it in place.
		const stillThere = await page.evaluate(async (rid: string) => {
			return (await fetch(`/api/reports/${rid}`)).status
		}, reportId)
		expect(stillThere).toBe(200)
	})

	for (const tab of ['accident-info', 'vehicle', 'calculation', 'invoice']) {
		test(`the ${tab} tab freezes every field`, async ({ page }) => {
			await page.goto(`/reports/${reportId}/details/${tab}`)
			await expect(page.getByText('This report has been locked')).toBeVisible()
			await expectNothingEditable(page)
		})
	}

	test('the condition tab freezes its fields and the damage diagram', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await expect(page.getByText('This report has been locked')).toBeVisible()

		await page.getByText('Visual Accident Details').click()
		await expect(page.getByRole('button', { name: 'Add Marker' })).toBeDisabled()

		// A click on the car adds nothing and sends nothing.
		let markerWrites = 0
		page.on('request', (request) => {
			if (request.url().includes('/condition') && request.method() === 'PATCH') markerWrites++
		})
		await page.locator('main [role="img"]').first().click()
		await page.waitForTimeout(500)
		expect(markerWrites).toBe(0)

		await page.getByRole('button', { name: 'Paint' }).click()
		await expectNothingEditable(page)
	})

	test('the gallery hides upload and explains why', async ({ page }) => {
		await page.goto(`/reports/${reportId}/gallery`)
		await expect(page.getByText('The report is locked — photos cannot be changed.')).toBeVisible()
		await expect(page.locator('main input[type="file"]:not([disabled])')).toHaveCount(0)
	})

	test('the dashboard offers no delete for it', async ({ page }) => {
		await page.goto('/')
		const row = page.getByRole('row').filter({ hasText: 'PW Locked Report' }).first()
		await row.getByLabel('Report actions').click()
		await expect(page.getByText('Details')).toBeVisible()
		await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(0)
	})

	test('the export composer stays usable — a locked report is still deliverable', async ({
		page,
	}) => {
		await page.goto(`/reports/${reportId}/export`)
		await expect(page.getByText('This report has been locked')).toBeVisible()
		await expect(page.getByPlaceholder('e.g. Damage report for your vehicle')).toBeEditable()
		await expect(page.getByPlaceholder('Add recipient email...')).toBeEditable()
		await expect(page.getByRole('switch').nth(3)).toBeEnabled()
	})
})
