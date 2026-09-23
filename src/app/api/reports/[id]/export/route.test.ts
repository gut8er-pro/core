import type { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The composer's state is the assessor's work. Reopening Export & Send must
 * show what was typed — recipients, subject and body alike — because an empty
 * field that still sends the last address is how the wrong client got a
 * Gutachten (ticket 32).
 */

const reportFindFirst = vi.fn()
const reportUpdate = vi.fn()
const exportConfigFindUnique = vi.fn()
const exportConfigCreate = vi.fn()
const exportConfigUpsert = vi.fn()

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
			findFirst: (...a: unknown[]) => reportFindFirst(...a),
			update: (...a: unknown[]) => reportUpdate(...a),
		},
		exportConfig: {
			findUnique: (...a: unknown[]) => exportConfigFindUnique(...a),
			create: (...a: unknown[]) => exportConfigCreate(...a),
			upsert: (...a: unknown[]) => exportConfigUpsert(...a),
		},
	},
}))
vi.mock('@/lib/pdf/generate-buffer', () => ({
	generateReportPdfBuffer: vi.fn(),
}))

const { GET, PATCH } = await import('./route')

const REPORT = 'a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d'

function storedConfig(overrides: Record<string, unknown> = {}) {
	return {
		id: 'cfg_1',
		reportId: REPORT,
		includeVehicleValuation: true,
		includeCommission: true,
		includeInvoice: true,
		lockReport: false,
		recipients: [],
		recipientMode: null,
		recipientEmail: null,
		recipientName: null,
		subject: null,
		body: null,
		...overrides,
	}
}

function getRequest() {
	return new Request(
		`https://app.gut8erpro.de/api/reports/${REPORT}/export`,
	) as unknown as NextRequest
}

function patchRequest(body: Record<string, unknown>) {
	return new Request(`https://app.gut8erpro.de/api/reports/${REPORT}/export`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	}) as unknown as NextRequest
}

function context() {
	return { params: Promise.resolve({ id: REPORT }) }
}

beforeEach(() => {
	vi.clearAllMocks()
	reportFindFirst.mockResolvedValue({ id: REPORT, userId: 'user_1', isLocked: false })
	reportUpdate.mockResolvedValue({})
})

describe('GET /api/reports/[id]/export', () => {
	it('restores the recipients, subject and body the assessor entered', async () => {
		exportConfigFindUnique.mockResolvedValue(
			storedConfig({
				recipients: ['kunde@example.com', 'kanzlei@example.com'],
				recipientMode: 'claimant_lawyer',
				subject: 'Ihr Gutachten',
				body: '<p>Guten Tag</p>',
			}),
		)

		const response = await GET(getRequest(), context())
		const json = await response.json()

		expect(response.status).toBe(200)
		expect(json.recipients).toEqual(['kunde@example.com', 'kanzlei@example.com'])
		expect(json.recipientMode).toBe('claimant_lawyer')
		expect(json.emailSubject).toBe('Ihr Gutachten')
		expect(json.emailBody).toBe('<p>Guten Tag</p>')
	})

	it('reads recipients back from the legacy comma-joined column when the array is empty', async () => {
		// Reports last sent before the `recipients` column existed still have to
		// show their chips rather than an empty field.
		exportConfigFindUnique.mockResolvedValue(
			storedConfig({ recipients: [], recipientEmail: 'alt@example.com, zweit@example.com' }),
		)

		const json = await (await GET(getRequest(), context())).json()

		expect(json.recipients).toEqual(['alt@example.com', 'zweit@example.com'])
	})

	it('returns no recipients when nothing was ever entered', async () => {
		exportConfigFindUnique.mockResolvedValue(storedConfig())

		const json = await (await GET(getRequest(), context())).json()

		expect(json.recipients).toEqual([])
		expect(json.recipientMode).toBeNull()
	})

	it('creates the config row on first visit rather than 404ing', async () => {
		exportConfigFindUnique.mockResolvedValue(null)
		exportConfigCreate.mockResolvedValue(storedConfig())

		const response = await GET(getRequest(), context())

		expect(response.status).toBe(200)
		expect(exportConfigCreate).toHaveBeenCalledWith({ data: { reportId: REPORT } })
	})
})

describe('PATCH /api/reports/[id]/export', () => {
	it('persists the recipient chips and the preset mode', async () => {
		exportConfigUpsert.mockResolvedValue(
			storedConfig({ recipients: ['kunde@example.com'], recipientMode: 'claimant' }),
		)

		const response = await PATCH(
			patchRequest({ recipients: ['kunde@example.com'], recipientMode: 'claimant' }),
			context(),
		)

		expect(response.status).toBe(200)
		expect(exportConfigUpsert).toHaveBeenCalledWith(
			expect.objectContaining({
				update: { recipients: ['kunde@example.com'], recipientMode: 'claimant' },
			}),
		)
	})

	it('persists subject and body so a tab switch does not lose the message', async () => {
		exportConfigUpsert.mockResolvedValue(storedConfig({ subject: 'Betreff', body: '<p>Text</p>' }))

		await PATCH(patchRequest({ emailSubject: 'Betreff', emailBody: '<p>Text</p>' }), context())

		expect(exportConfigUpsert).toHaveBeenCalledWith(
			expect.objectContaining({ update: { subject: 'Betreff', body: '<p>Text</p>' } }),
		)
	})

	it('clears the recipients when the last chip is removed', async () => {
		exportConfigUpsert.mockResolvedValue(storedConfig({ recipients: [] }))

		await PATCH(patchRequest({ recipients: [] }), context())

		expect(exportConfigUpsert).toHaveBeenCalledWith(
			expect.objectContaining({ update: { recipients: [] } }),
		)
	})

	it('rejects a recipient mode outside the two the composer offers', async () => {
		const response = await PATCH(patchRequest({ recipientMode: 'documents' }), context())

		expect(response.status).toBe(400)
		expect(exportConfigUpsert).not.toHaveBeenCalled()
	})

	it('saves the document toggles', async () => {
		exportConfigUpsert.mockResolvedValue(storedConfig({ includeVehicleValuation: false }))

		await PATCH(patchRequest({ includeValuation: false, includeInvoice: true }), context())

		expect(exportConfigUpsert).toHaveBeenCalledWith(
			expect.objectContaining({
				update: { includeVehicleValuation: false, includeInvoice: true },
			}),
		)
	})
})
