import { expect, type Page, test } from '@playwright/test'
import { completeManifest } from './helpers/manifest-fill'
import { createAuthPage, createReportViaAPI } from './helpers/test-data'

async function pdfText(page: Page, reportId: string, query: string): Promise<string> {
	const base64 = await page.evaluate(
		async (args: { rid: string; query: string }) => {
			const response = await fetch(`/api/reports/${args.rid}/export?format=pdf&${args.query}`)
			if (!response.ok) throw new Error(`PDF request failed: ${response.status}`)
			const buffer = await response.arrayBuffer()
			let binary = ''
			const bytes = new Uint8Array(buffer)
			for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
			return btoa(binary)
		},
		{ rid: reportId, query },
	)
	const { PDFParse } = await import('pdf-parse')
	const parser = new PDFParse({ data: new Uint8Array(Buffer.from(base64, 'base64')) })
	try {
		const result = await parser.getText()
		return result.text
	} finally {
		await parser.destroy()
	}
}

test.describe('Export & Send', () => {
	let reportId: string

	test.beforeAll(async ({ browser }) => {
		const page = await createAuthPage(browser)
		reportId = await createReportViaAPI(page, 'PW Export Test', 'HS')
		await page.context().close()
	})

	test('export page renders with toggles and email section', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		await expect(page.getByText('Export and Send')).toBeVisible()
		await expect(page.getByText('Vehicle valuation')).toBeVisible()
		await expect(page.getByText('Commission')).toBeVisible()
		await expect(page.getByText('The Invoice')).toBeVisible()
		await expect(page.getByText('Lock Report')).toBeVisible()
		await expect(page.getByRole('heading', { name: 'Email' })).toBeVisible()
		await expect(page.getByText('Recipient', { exact: true })).toBeVisible()
		await expect(page.getByText('Subject')).toBeVisible()
		await expect(page.getByText('Send Report')).toBeVisible()
	})

	test('rich text editor toolbar visible', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		// Editor toolbar should have formatting buttons
		await expect(
			page.locator('[class*="editor"], [class*="toolbar"], [role="toolbar"]').first(),
		).toBeVisible()
	})

	test('sidebar navigation works on export page', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		await expect(page.getByText('Gallery')).toBeVisible()
		await expect(page.getByText('Report Details')).toBeVisible()
		await expect(page.getByText('Export & Send')).toBeVisible()
	})

	test('exactly two recipient presets, and they are an either/or toggle', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)

		await expect(page.getByRole('button', { name: 'Send to the claimant', exact: true })).toBeVisible()
		await expect(
			page.getByRole('button', { name: 'Send to the claimant and their lawyer' }),
		).toBeVisible()
		// The third (Dokumentempfänger) is gone.
		await expect(page.getByRole('button', { name: /Document recipient/ })).toHaveCount(0)
	})
})

test.describe.serial('Lock and unlock from the UI', () => {
	test.setTimeout(120000)
	let reportId: string

	test.beforeAll(async ({ browser }) => {
		const page = await createAuthPage(browser)
		reportId = await createReportViaAPI(page, 'PW Unlock Toggle', 'HS')
		await page.evaluate(async (rid: string) => {
			await fetch(`/api/reports/${rid}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'LOCKED', isLocked: true }),
			})
		}, reportId)
		await page.context().close()
	})

	test('the Lock Report switch unlocks a locked report and fields accept edits again', async ({
		page,
	}) => {
		await page.goto(`/reports/${reportId}/export`)
		await expect(page.getByText('This report has been locked')).toBeVisible()

		const switches = page.getByRole('switch')
		await expect(switches).toHaveCount(4)
		const lockSwitch = switches.nth(3)
		await expect(lockSwitch).toBeChecked()

		const patchDone = page.waitForResponse(
			(response) =>
				response.url().includes(`/api/reports/${reportId}/export`) &&
				response.request().method() === 'PATCH',
		)
		await lockSwitch.click()
		expect((await patchDone).status()).toBe(200)

		const report = await page.evaluate(async (rid: string) => {
			const response = await fetch(`/api/reports/${rid}`)
			return (await response.json()).report as { isLocked: boolean }
		}, reportId)
		expect(report.isLocked).toBe(false)

		await expect(page.getByText('This report has been locked')).toHaveCount(0)

		await page.goto(`/reports/${reportId}/details/accident-info`)
		const scene = page.getByRole('textbox', { name: 'Accident Scene' })
		await expect(scene).toBeEditable()

		const saveDone = page.waitForResponse(
			(response) =>
				response.url().includes('/accident-info') && response.request().method() === 'PATCH',
		)
		await scene.fill('Unlocked and editable')
		await scene.blur()
		expect((await saveDone).status()).toBe(200)

		await page.reload()
		await expect(page.getByRole('textbox', { name: 'Accident Scene' })).toHaveValue(
			'Unlocked and editable',
		)
	})
})

test.describe.serial('Export composer state and PDF shaping', () => {
	test.setTimeout(180000)
	let reportId: string

	test.beforeAll(async ({ browser }) => {
		const page = await createAuthPage(browser)
		reportId = await createReportViaAPI(page, 'PW Export Shaping', 'HS')
		await completeManifest(page, reportId, 'HS')
		await page.context().close()
	})

	test('Send is disabled with zero chips, and the composer survives a tab round-trip', async ({
		page,
	}) => {
		await page.goto(`/reports/${reportId}/export`)
		await page.waitForTimeout(4000)

		const sendButton = page.getByRole('button', { name: 'Send Report' })
		await expect(sendButton).toBeDisabled()

		await page.getByPlaceholder('Add recipient email...').fill('pw-export@example.test')
		await page.keyboard.press('Enter')
		await expect(page.getByText('pw-export@example.test')).toBeVisible()
		await expect(sendButton).toBeEnabled()

		await page.getByLabel('Subject').fill('PW persisted subject')
		await page.getByLabel('Subject').blur()
		await page.waitForTimeout(2500)

		// The client's exact sequence: fill the form, go back to the report, return.
		await page.goto(`/reports/${reportId}/details/vehicle`)
		await page.waitForTimeout(2000)
		await page.goto(`/reports/${reportId}/export`)
		await page.waitForTimeout(4000)

		await expect(page.getByText('pw-export@example.test')).toBeVisible()
		await expect(page.getByLabel('Subject')).toHaveValue('PW persisted subject')

		// And removing the last chip disables Send again — what you see is what
		// gets sent, with nothing cached behind an empty field.
		await page.getByRole('button', { name: 'Remove pw-export@example.test' }).click()
		await expect(page.getByText('pw-export@example.test')).toHaveCount(0)
		await expect(sendButton).toBeDisabled()
	})

	test('the preview URL answers with an inline PDF', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)

		const result = await page.evaluate(async (rid: string) => {
			const response = await fetch(
				`/api/reports/${rid}/export?format=pdf&lang=de&sections=valuation,commission,invoice&disposition=inline`,
			)
			return {
				status: response.status,
				contentType: response.headers.get('content-type') ?? '',
				disposition: response.headers.get('content-disposition') ?? '',
			}
		}, reportId)

		expect(result.status).toBe(200)
		expect(result.contentType).toContain('application/pdf')
		expect(result.disposition).toContain('inline')
	})

	test('a Vorschau button is on the page and points at the current toggles', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		await page.waitForTimeout(4000)

		const preview = page.getByRole('link', { name: /Preview/ })
		await expect(preview).toBeVisible()
		const href = await preview.getAttribute('href')
		expect(href).toContain('format=pdf')
		expect(href).toContain('disposition=inline')
		expect(href).toContain('sections=')
	})

	test('invoice-only renders an invoice without the vehicle data', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)

		const invoiceOnly = await pdfText(page, reportId, 'lang=de&sections=invoice')

		expect(invoiceOnly).toContain('Rechnung')
		// The Gutachten body is gone: no vehicle block, no parties, no photos.
		expect(invoiceOnly).not.toContain('Fahrzeuginformationen')
		expect(invoiceOnly).not.toContain('Unfallinformationen')
		expect(invoiceOnly).not.toContain('Fahrzeugzustand')
	})

	test('all sections on renders the report AND the invoice', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)

		const everything = await pdfText(page, reportId, 'lang=de&sections=valuation,commission,invoice')

		expect(everything).toContain('Fahrzeuginformationen')
		expect(everything).toContain('Unfallinformationen')
		expect(everything).toContain('Rechnung')
	})

	test('invoice off drops the invoice and keeps the report', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)

		const noInvoice = await pdfText(page, reportId, 'lang=de&sections=valuation,commission')

		expect(noInvoice).toContain('Fahrzeuginformationen')
		expect(noInvoice).not.toContain('Rechnungsnummer')
	})

	test('the report header carries the file number, not a UUID slice', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)

		const text = await pdfText(page, reportId, 'lang=de&sections=valuation,commission,invoice')

		expect(text).toContain('Gutachten-Nr.')
		expect(text).not.toContain(reportId.slice(0, 8).toUpperCase())
	})
})
