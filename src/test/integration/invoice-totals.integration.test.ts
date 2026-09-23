/**
 * The invoice route derives `totalNet`/`totalGross` from the rows it just wrote.
 * Before this, every invoice stored zeros and each consumer — the stats revenue
 * chart, the PDF — summed the line items for itself.
 *
 * Requires DATABASE_URL and a database migrated to the current schema; skipped
 * otherwise. Everything it writes hangs off one throwaway user and is cascaded
 * away afterwards.
 *
 * @vitest-environment node
 */

import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/api/auth', () => ({
	getAuthenticatedUser: () => Promise.resolve({ user: currentUser, error: null }),
	unauthorizedResponse: () => new Response('Unauthorized', { status: 401 }),
}))

let currentUser: { id: string } | null = null

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip

describeWithDb('invoice route totals', () => {
	let userId: string

	beforeAll(async () => {
		const user = await prisma.user.create({
			data: { email: `invoice-totals-${randomUUID()}@gut8erpro.test` },
		})
		userId = user.id
		currentUser = { id: userId }
	})

	afterAll(async () => {
		await prisma.user.delete({ where: { id: userId } })
	})

	async function patchInvoice(reportId: string, body: unknown) {
		const { PATCH } = await import('@/app/api/reports/[id]/invoice/route')
		const request = new Request(`http://localhost/api/reports/${reportId}/invoice`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})
		return PATCH(request as never, { params: Promise.resolve({ id: reportId }) })
	}

	async function createReport() {
		const report = await prisma.report.create({
			data: { userId, reportType: 'HS', title: 'invoice totals test' },
		})
		return report.id
	}

	function storedTotals(reportId: string) {
		return prisma.invoice.findUnique({
			where: { reportId },
			select: { totalNet: true, totalGross: true, taxRate: true },
		})
	}

	it('stores the totals the line items add up to', async () => {
		const reportId = await createReport()

		const response = await patchInvoice(reportId, {
			lineItems: [
				{ description: 'Grundhonorar', rate: 890, quantity: 1, amount: 890, isLumpSum: true },
				{ description: 'Fotografien', rate: 2, quantity: 30, amount: 60, isLumpSum: false },
			],
		})
		expect(response.status).toBe(200)

		const totals = await storedTotals(reportId)
		expect(totals?.totalNet).toBe(950)
		expect(totals?.totalGross).toBeCloseTo(1130.5, 2)
	})

	it('follows the rows down when a line item is removed', async () => {
		const reportId = await createReport()

		await patchInvoice(reportId, {
			lineItems: [
				{ description: 'Grundhonorar', rate: 890, quantity: 1, amount: 890, isLumpSum: true },
				{ description: 'Anfahrt', rate: 0.7, quantity: 100, amount: 70, isLumpSum: false },
			],
		})
		expect((await storedTotals(reportId))?.totalNet).toBe(960)

		await patchInvoice(reportId, {
			lineItems: [
				{ description: 'Grundhonorar', rate: 890, quantity: 1, amount: 890, isLumpSum: true },
			],
		})

		const totals = await storedTotals(reportId)
		expect(totals?.totalNet).toBe(890)
		expect(totals?.totalGross).toBeCloseTo(1059.1, 2)
	})

	it('re-grosses the stored total when the tax rate changes', async () => {
		const reportId = await createReport()

		await patchInvoice(reportId, {
			lineItems: [
				{ description: 'Grundhonorar', rate: 1000, quantity: 1, amount: 1000, isLumpSum: true },
			],
		})
		expect((await storedTotals(reportId))?.totalGross).toBeCloseTo(1190, 2)

		await patchInvoice(reportId, { invoice: { taxRate: 7 } })

		const totals = await storedTotals(reportId)
		expect(totals?.taxRate).toBe(7)
		expect(totals?.totalNet).toBe(1000)
		expect(totals?.totalGross).toBeCloseTo(1070, 2)
	})

	it('zeroes the totals when every row is deleted', async () => {
		const reportId = await createReport()

		await patchInvoice(reportId, {
			lineItems: [
				{ description: 'Grundhonorar', rate: 500, quantity: 1, amount: 500, isLumpSum: true },
			],
		})
		expect((await storedTotals(reportId))?.totalNet).toBe(500)

		await patchInvoice(reportId, { lineItems: [] })

		const totals = await storedTotals(reportId)
		expect(totals?.totalNet).toBe(0)
		expect(totals?.totalGross).toBe(0)
	})

	it('seeds the four default rows on a first GET', async () => {
		const reportId = await createReport()
		const { GET } = await import('@/app/api/reports/[id]/invoice/route')

		const response = await GET(new Request('http://localhost') as never, {
			params: Promise.resolve({ id: reportId }),
		})
		const body = (await response.json()) as {
			lineItems: Array<{ specialFeature: string | null }>
		}

		expect(body.lineItems.map((item) => item.specialFeature)).toEqual([
			'grundhonorar',
			'anfahrt',
			'druck_versand',
			'fotografien',
		])
	})

	it('does not bring back rows the assessor deleted', async () => {
		const reportId = await createReport()
		const { GET } = await import('@/app/api/reports/[id]/invoice/route')
		const params = { params: Promise.resolve({ id: reportId }) }

		await GET(new Request('http://localhost') as never, params)
		await patchInvoice(reportId, { lineItems: [] })

		const response = await GET(new Request('http://localhost') as never, params)
		const body = (await response.json()) as { lineItems: unknown[] }
		expect(body.lineItems).toHaveLength(0)
	})
})
