import { expect, test } from '@playwright/test'
import { completeManifest } from './helpers/manifest-fill'

/**
 * The completeness gate — the negative path and its one exemption.
 *
 * Six happy-path specs prove a complete report can be sent. They prove nothing
 * about a gate, which only exists to refuse. This spec is the proof that an
 * incomplete Gutachten cannot leave the building, and that one that already has
 * stays downloadable forever.
 */

type ApiResult = { status: number; body: Record<string, unknown> }

async function createReport(page: any, title: string, reportType: string): Promise<string> {
	return page.evaluate(
		async (args: { title: string; reportType: string }) => {
			const response = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(args),
			})
			return (await response.json()).report.id as string
		},
		{ title, reportType },
	)
}

async function postSend(page: any, reportId: string): Promise<ApiResult> {
	return page.evaluate(async (rid: string) => {
		const response = await fetch(`/api/reports/${rid}/send`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				recipientEmail: 'gate-test@example.test',
				recipientName: 'Gate Test',
				emailSubject: 'Gate test',
				emailBody: 'Gate test',
				lockReport: false,
			}),
		})
		return { status: response.status, body: await response.json().catch(() => ({})) }
	}, reportId)
}

async function getPdf(page: any, reportId: string): Promise<{ status: number; contentType: string }> {
	return page.evaluate(async (rid: string) => {
		const response = await fetch(`/api/reports/${rid}/export?format=pdf`)
		return {
			status: response.status,
			contentType: response.headers.get('content-type') ?? '',
		}
	}, reportId)
}

async function lockReport(page: any, reportId: string) {
	await page.evaluate(async (rid: string) => {
		await fetch(`/api/reports/${rid}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'LOCKED', isLocked: true }),
		})
	}, reportId)
}

test.describe.serial('Completeness gate', () => {
	test.setTimeout(120000)

	test('an incomplete report shows Send disabled with a per-tab breakdown', async ({ page }) => {
		await page.goto('/')
		const reportId = await createReport(page, 'PW Gate - incomplete', 'HS')

		await page.goto(`/reports/${reportId}/export`)
		// The page refetches all six sources before judging anyone incomplete.
		await page.waitForTimeout(4000)

		await expect(page.getByText('This Gutachten cannot be sent yet')).toBeVisible()
		await expect(page.getByRole('button', { name: 'Send Report' })).toBeDisabled()

		// Every short tab is named and linked, so "no" comes with a destination.
		await expect(page.getByRole('link', { name: /Go to Gallery/ })).toBeVisible()
		await expect(page.getByRole('link', { name: /Go to Vehicle/ })).toBeVisible()
		await expect(page.getByRole('link', { name: /Go to Invoice/ })).toBeVisible()
	})

	test('the server refuses a direct send of an incomplete report', async ({ page }) => {
		await page.goto('/')
		const reportId = await createReport(page, 'PW Gate - direct send', 'HS')

		const result = await postSend(page, reportId)

		expect(result.status).toBe(422)
		// The body carries the breakdown, not a message: a count is useless
		// without the locations.
		const missingInfo = result.body.missingInfo as
			| { missingCount: number; isComplete: boolean; tabs: Record<string, unknown> }
			| undefined
		expect(missingInfo).toBeTruthy()
		expect(missingInfo?.isComplete).toBe(false)
		expect(missingInfo?.missingCount).toBeGreaterThan(0)
		expect(Object.keys(missingInfo?.tabs ?? {})).toContain('accidentInfo')
	})

	test('the PDF is refused on the same terms as the email', async ({ page }) => {
		await page.goto('/')
		const reportId = await createReport(page, 'PW Gate - pdf', 'HS')

		const result = await getPdf(page, reportId)

		expect(result.status).toBe(422)
	})

	test('a complete report passes both gates', async ({ page }) => {
		await page.goto('/')
		const reportId = await createReport(page, 'PW Gate - complete', 'HS')

		await completeManifest(page, reportId, 'HS')

		const pdf = await getPdf(page, reportId)
		expect(pdf.status).toBe(200)
		expect(pdf.contentType).toContain('application/pdf')
	})

	test('a locked report stays downloadable even while incomplete', async ({ page }) => {
		await page.goto('/')
		const reportId = await createReport(page, 'PW Gate - locked', 'HS')

		// Nothing is filled in. A report that has already been delivered passed
		// the gate at send time; tightening the manifest afterwards must not
		// retract a Gutachten that is already in an insurer's inbox.
		await lockReport(page, reportId)

		const result = await getPdf(page, reportId)

		expect(result.status).toBe(200)
		expect(result.contentType).toContain('application/pdf')
	})
})
