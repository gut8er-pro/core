import { expect, test } from '@playwright/test'
import path from 'path'
import { createAuthPage, createReportViaAPI } from './helpers/test-data'

type PersistedAnnotation = {
	annotatedUrl: string | null
	objects: { type: string; left: number; top: number; originX: string; originY: string }[]
}

async function readAnnotations(
	page: import('@playwright/test').Page,
	reportId: string,
): Promise<PersistedAnnotation> {
	return page.evaluate(async (id) => {
		const response = await fetch(`/api/reports/${id}/photos`)
		const body = await response.json()
		const photo = body.photos[0]
		const fabricJson = photo?.annotations?.[0]?.fabricJson
		return {
			annotatedUrl: photo?.annotatedUrl ?? null,
			objects: (fabricJson?.objects ?? []).map(
				(o: { type: string; left: number; top: number; originX: string; originY: string }) => ({
					type: o.type,
					left: Math.round(o.left),
					top: Math.round(o.top),
					originX: o.originX,
					originY: o.originY,
				}),
			),
		}
	}, reportId)
}

async function openEditor(page: import('@playwright/test').Page, reportId: string) {
	await page.goto(`/reports/${reportId}/gallery`)
	await page.waitForTimeout(2500)
	await page
		.getByRole('button', { name: 'Annotate photo', exact: true })
		.first()
		.click({ timeout: 60_000 })
	await expect(page.getByRole('dialog')).toBeVisible({ timeout: 60_000 })
	await page.waitForTimeout(1500)
	return page.getByRole('dialog')
}

async function clearAll(
	page: import('@playwright/test').Page,
	dialog: import('@playwright/test').Locator,
) {
	const confirmBox = dialog.getByRole('alertdialog')
	await dialog.getByRole('button', { name: 'Clear all' }).click()
	await expect(confirmBox).toBeVisible()
	await confirmBox.getByRole('button', { name: 'Yes, delete all' }).click()
	await expect(confirmBox).toHaveCount(0)
	await page.waitForTimeout(300)
}

async function drawRect(
	page: import('@playwright/test').Page,
	dialog: import('@playwright/test').Locator,
	from: { x: number; y: number },
	to: { x: number; y: number },
) {
	await dialog.getByRole('button', { name: 'Rectangle' }).click()
	const box = await dialog.locator('canvas').last().boundingBox()
	if (!box) throw new Error('annotation canvas has no box')

	await page.mouse.move(box.x + from.x, box.y + from.y)
	await page.mouse.down()
	await page.mouse.move(box.x + to.x, box.y + to.y, { steps: 12 })
	await page.mouse.up()
	await page.waitForTimeout(300)
	return box
}

test.describe('Annotation editor', () => {
	// The dev server compiles the Fabric-heavy gallery route lazily, so the first
	// interaction in each spec can be slow.
	test.describe.configure({ timeout: 180_000 })

	let reportId: string

	test.beforeAll(async ({ browser }) => {
		test.setTimeout(180_000)
		const page = await createAuthPage(browser)
		reportId = await createReportViaAPI(page, 'PW Annotation Persistence', 'HS')
		await page.goto(`/reports/${reportId}/gallery`)
		await page.waitForTimeout(1000)
		await page
			.locator('input[type="file"]')
			.first()
			.setInputFiles([path.join(path.resolve('testing/testing-images'), 'car1.png')])
		await page.waitForTimeout(8000)
		await page.context().close()
	})

	test('a drawn marking survives save, reopen and an immediate second save', async ({ page }) => {
		const dialog = await openEditor(page, reportId)
		await drawRect(page, dialog, { x: 100, y: 100 }, { x: 320, y: 260 })

		await dialog.getByRole('button', { name: 'Save annotations' }).click()
		await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 30000 })

		const afterFirstSave = await readAnnotations(page, reportId)
		expect(afterFirstSave.objects).toHaveLength(1)
		expect(afterFirstSave.annotatedUrl).not.toBeNull()

		// Reopen and save straight away: the canvas must already be repopulated from
		// the stored fabricJson, or this save would persist an empty canvas.
		await page.reload()
		await page.waitForTimeout(2500)
		await page
			.getByRole('button', { name: 'Annotate photo', exact: true })
			.first()
			.click({ timeout: 60_000 })
		await page.getByRole('button', { name: 'Save annotations' }).click({ timeout: 60_000 })
		await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 30000 })

		const afterSecondSave = await readAnnotations(page, reportId)
		expect(afterSecondSave.objects).toHaveLength(1)
		expect(afterSecondSave.annotatedUrl).not.toBeNull()
	})

	test('a rectangle is anchored at the first click, not centred on it', async ({ page }) => {
		const dialog = await openEditor(page, reportId)
		await clearAll(page, dialog)

		await drawRect(page, dialog, { x: 120, y: 90 }, { x: 300, y: 230 })
		await dialog.getByRole('button', { name: 'Save annotations' }).click()
		await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 30000 })

		const saved = await readAnnotations(page, reportId)
		expect(saved.objects).toHaveLength(1)
		const rect = saved.objects[0]
		if (!rect) throw new Error('no marking was saved')
		expect(rect.originX).toBe('left')
		expect(rect.originY).toBe('top')
		expect(rect.left).toBeGreaterThanOrEqual(115)
		expect(rect.left).toBeLessThanOrEqual(125)
		expect(rect.top).toBeGreaterThanOrEqual(85)
		expect(rect.top).toBeLessThanOrEqual(95)
	})

	test('selecting a marking offers a per-element delete that leaves the others', async ({
		page,
	}) => {
		const dialog = await openEditor(page, reportId)
		await clearAll(page, dialog)

		const box = await drawRect(page, dialog, { x: 80, y: 80 }, { x: 240, y: 200 })
		await drawRect(page, dialog, { x: 400, y: 300 }, { x: 560, y: 420 })

		await dialog.getByRole('button', { name: 'Select' }).click()
		await page.waitForTimeout(300)
		await page.mouse.click(box.x + 160, box.y + 80)
		await page.waitForTimeout(400)

		const trash = dialog.getByRole('button', { name: 'Delete marking' })
		await expect(trash).toBeVisible()
		await trash.click()
		await expect(trash).toHaveCount(0)

		await dialog.getByRole('button', { name: 'Save annotations' }).click()
		await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 30000 })

		const saved = await readAnnotations(page, reportId)
		expect(saved.objects).toHaveLength(1)
	})

	test('clear all asks for confirmation before wiping every marking', async ({ page }) => {
		const dialog = await openEditor(page, reportId)
		await drawRect(page, dialog, { x: 90, y: 90 }, { x: 250, y: 210 })

		const confirmBox = dialog.getByRole('alertdialog')
		await dialog.getByRole('button', { name: 'Clear all' }).click()
		await expect(confirmBox).toBeVisible()

		await confirmBox.getByRole('button', { name: 'Cancel' }).click()
		await expect(confirmBox).toHaveCount(0)

		await clearAll(page, dialog)

		await dialog.getByRole('button', { name: 'Save annotations' }).click()
		await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 30000 })

		const saved = await readAnnotations(page, reportId)
		expect(saved.objects).toHaveLength(0)
		expect(saved.annotatedUrl).toBeNull()
	})

	test('a locked report opens the editor read-only', async ({ page }) => {
		async function setLock(locked: boolean) {
			await page.evaluate(
				async (args: { id: string; locked: boolean }) => {
					await fetch(`/api/reports/${args.id}/export`, {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ lockReport: args.locked }),
					})
				},
				{ id: reportId, locked },
			)
		}

		await page.goto(`/reports/${reportId}/gallery`)
		await page.waitForTimeout(1500)
		await setLock(true)

		try {
			const dialog = await openEditor(page, reportId)
			await expect(dialog.getByRole('button', { name: 'Rectangle' })).toBeDisabled()
			await expect(dialog.getByRole('button', { name: 'Clear all' })).toBeDisabled()
			await expect(dialog.getByRole('button', { name: 'Save annotations' })).toBeDisabled()
			await expect(dialog.getByText('This report is locked and read-only.')).toBeVisible()
		} finally {
			await setLock(false)
		}
	})
})
