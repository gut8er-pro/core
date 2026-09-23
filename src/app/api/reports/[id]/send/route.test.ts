import type { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * A send carries every Gutachten the assessor asked for or it does not happen.
 * Anything less is an empty or partial send — invisible to everyone until the
 * client asks where the report is, and uncorrectable once the report locks. See
 * `CONTEXT.md#send-failures`.
 */

const findFirst = vi.fn()
const reportUpdate = vi.fn()
const exportConfigUpsert = vi.fn()
const userFindUnique = vi.fn()
const generateReportPdfBuffer = vi.fn()
const createNotification = vi.fn()
const send = vi.fn()
const captureException = vi.fn()

vi.mock('@/lib/api/auth', () => ({
	getAuthenticatedUser: async () => ({
		user: { id: 'user_1', email: 'anna@berger-kfz.de' },
		error: null,
	}),
	unauthorizedResponse: () => new Response(null, { status: 401 }),
}))
vi.mock('@/lib/prisma', () => ({
	prisma: {
		report: {
			findFirst: (...a: unknown[]) => findFirst(...a),
			update: (...a: unknown[]) => reportUpdate(...a),
		},
		exportConfig: {
			upsert: (...a: unknown[]) => exportConfigUpsert(...a),
		},
		user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
	},
}))
vi.mock('@/lib/completeness/server', () => ({
	isDelivered: () => false,
	getMissingInfo: async () => ({ isComplete: true }),
}))
vi.mock('@/lib/pdf/generate-buffer', () => ({
	generateReportPdfBuffer: (...a: unknown[]) => generateReportPdfBuffer(...a),
}))
vi.mock('@/lib/email/client', () => ({
	getResendClient: () => ({ emails: { send } }),
}))
vi.mock('@/lib/notifications/create', () => ({
	createNotification: (...a: unknown[]) => createNotification(...a),
}))
vi.mock('@sentry/nextjs', () => ({
	captureException: (...a: unknown[]) => captureException(...a),
}))

const { POST } = await import('./route')

const REPORT = 'a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d'

function request(pdfLanguages: string[]) {
	return new Request(`https://app.gut8erpro.de/api/reports/${REPORT}/send`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			recipientEmail: 'kunde@example.com',
			recipientName: 'Herr Schmidt',
			emailSubject: 'Ihr Gutachten',
			emailBody: '<p>Guten Tag</p>',
			lockReport: true,
			pdfLanguages,
		}),
	}) as unknown as NextRequest
}

function context() {
	return { params: Promise.resolve({ id: REPORT }) }
}

function generatedPdf(language: string) {
	return { buffer: Buffer.from(`%PDF ${language}`), filename: 'Gutachten_2026-001.pdf' }
}

beforeEach(() => {
	vi.clearAllMocks()
	vi.stubEnv('RESEND_API_KEY', 're_test_deadbeef')
	vi.stubEnv('RESEND_SENDING_DOMAIN', 'gut8erpro.de')
	vi.spyOn(console, 'error').mockImplementation(() => {})

	findFirst.mockResolvedValue({
		id: REPORT,
		title: 'Gutachten 2026-001',
		status: 'COMPLETED',
		isLocked: false,
	})
	exportConfigUpsert.mockResolvedValue({ reportId: REPORT })
	reportUpdate.mockResolvedValue({})
	userFindUnique.mockResolvedValue({
		firstName: 'Anna',
		lastName: 'Berger',
		email: 'anna@berger-kfz.de',
		business: { companyName: 'KFZ Berger GmbH' },
	})
	send.mockResolvedValue({ data: { id: 'email_1' }, error: null })
})

describe('POST /api/reports/[id]/send', () => {
	it('refuses the send when no Gutachten could be generated at all', async () => {
		generateReportPdfBuffer.mockResolvedValue({ error: 'Failed to render report' })

		const response = await POST(request(['de']), context())
		const body = await response.json()

		expect(response.status).toBe(500)
		expect(body).toEqual({ error: 'pdf_generation_failed', languages: ['de'] })
		expect(send).not.toHaveBeenCalled()
		expect(reportUpdate).not.toHaveBeenCalled()
		expect(createNotification).not.toHaveBeenCalled()
		expect(captureException).toHaveBeenCalled()
		// The recipient details of the refused attempt are what the assessor retries from.
		expect(exportConfigUpsert).toHaveBeenCalled()
	})

	it('refuses a partial send, naming the language that failed', async () => {
		generateReportPdfBuffer.mockImplementation(async (_id, _userId, language) => {
			if (language === 'en') throw new Error('Font file missing')
			return generatedPdf('de')
		})

		const response = await POST(request(['de', 'en']), context())
		const body = await response.json()

		expect(response.status).toBe(500)
		expect(body).toEqual({ error: 'pdf_generation_failed', languages: ['en'] })
		expect(send).not.toHaveBeenCalled()
		expect(reportUpdate).not.toHaveBeenCalled()
		expect(createNotification).not.toHaveBeenCalled()
	})

	it('sends, marks and locks once every language is attached', async () => {
		generateReportPdfBuffer.mockImplementation(async (_id, _userId, language) =>
			generatedPdf(String(language)),
		)

		const response = await POST(request(['de', 'en']), context())

		expect(response.status).toBe(200)
		expect(send).toHaveBeenCalledTimes(1)
		expect(send.mock.calls[0]?.[0].attachments).toHaveLength(2)
		expect(reportUpdate).toHaveBeenCalledWith(
			expect.objectContaining({ data: expect.objectContaining({ status: 'LOCKED' }) }),
		)
		expect(createNotification).toHaveBeenCalled()
	})

	it('records the send as a message key and its parameters, not as English prose', async () => {
		generateReportPdfBuffer.mockImplementation(async (_id, _userId, language) =>
			generatedPdf(String(language)),
		)

		await POST(request(['de']), context())

		expect(createNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: 'REPORT_SENT',
				messageKey: 'reportSent',
				params: { title: 'Gutachten 2026-001', recipient: 'kunde@example.com' },
			}),
		)
	})
})

describe('re-sending a report', () => {
	beforeEach(() => {
		generateReportPdfBuffer.mockImplementation(async (_id, _userId, language) =>
			generatedPdf(String(language)),
		)
	})

	it('sends a locked report rather than refusing it', async () => {
		// The refusal is what the client saw as "Failed to send report" on the
		// second visit. Locking closes the Gutachten to edits, not to delivery.
		findFirst.mockResolvedValue({
			id: REPORT,
			title: 'Gutachten 2026-001',
			status: 'LOCKED',
			isLocked: true,
		})

		const response = await POST(request(['de']), context())

		expect(response.status).toBe(200)
		expect(send).toHaveBeenCalledTimes(1)
	})

	it('regenerates the attachment instead of reusing the last one', async () => {
		await POST(request(['de']), context())
		expect(generateReportPdfBuffer).toHaveBeenCalledTimes(1)

		await POST(request(['de']), context())
		expect(generateReportPdfBuffer).toHaveBeenCalledTimes(2)
	})

	it('stores the recipients it actually sent to, so reopening shows them', async () => {
		await POST(request(['de']), context())

		expect(exportConfigUpsert).toHaveBeenCalledWith(
			expect.objectContaining({
				update: expect.objectContaining({ recipients: ['kunde@example.com'] }),
			}),
		)
	})

	it('sends even though the composer page was never opened', async () => {
		// The config row is created by the composer's GET. A send that skipped
		// that page used to die on "Export config not found" — the other half of
		// the client's "Failed to send report".
		exportConfigUpsert.mockResolvedValue({ reportId: REPORT })

		const response = await POST(request(['de']), context())

		expect(response.status).toBe(200)
		expect(exportConfigUpsert).toHaveBeenCalledWith(
			expect.objectContaining({ create: expect.objectContaining({ reportId: REPORT }) }),
		)
	})

	it('renders only the sections the composer had on screen', async () => {
		const invoiceOnly = new Request(`https://app.gut8erpro.de/api/reports/${REPORT}/send`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				recipientEmail: 'kunde@example.com',
				recipientName: 'Herr Schmidt',
				emailSubject: 'Ihre Rechnung',
				lockReport: false,
				pdfLanguages: ['de'],
				sections: ['invoice'],
			}),
		}) as unknown as NextRequest

		await POST(invoiceOnly, context())

		expect(generateReportPdfBuffer).toHaveBeenCalledWith(REPORT, 'user_1', 'de', {
			report: false,
			valuation: false,
			commission: false,
			invoice: true,
		})
	})
})

describe('the language the email is wrapped in', () => {
	beforeEach(() => {
		generateReportPdfBuffer.mockImplementation(async (_id, _userId, language) =>
			generatedPdf(String(language)),
		)
	})

	it('follows the single attached Gutachten', async () => {
		await POST(request(['en']), context())
		expect(send.mock.calls[0]?.[0].html).toContain('<html lang="en">')

		send.mockClear()
		await POST(request(['de']), context())
		expect(send.mock.calls[0]?.[0].html).toContain('<html lang="de">')
	})

	it('is German when both are attached — the recipient gets one covering note, not a guess', async () => {
		await POST(request(['de', 'en']), context())
		expect(send.mock.calls[0]?.[0].html).toContain('<html lang="de">')
	})
})
