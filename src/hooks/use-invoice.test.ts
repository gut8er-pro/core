import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchInvoice } from './use-invoice'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('fetchInvoice', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('calls fetch with correct URL', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					invoice: null,
					lineItems: [],
				}),
		})

		await fetchInvoice('report-123')
		expect(mockFetch).toHaveBeenCalledWith(
			'/api/reports/report-123/invoice',
		)
	})

	it('returns parsed JSON on success', async () => {
		const mockData = {
			invoice: {
				id: 'inv-1',
				reportId: 'report-123',
				invoiceNumber: 'GA-0001-2025',
				date: '2025-03-15T10:00:00+01:00',
				recipientId: 'client-abc',
				payoutDelay: 14,
				eInvoice: false,
				feeSchedule: 'BVSK',
				totalNet: 1500,
				totalGross: 1785,
				taxRate: 19,
			},
			lineItems: [
				{
					id: 'li-1',
					invoiceId: 'inv-1',
					description: 'Grundhonorar',
					specialFeature: null,
					isLumpSum: true,
					rate: 587,
					amount: 587,
					quantity: 1,
					perUnit: null,
					order: 0,
				},
			],
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		})

		const result = await fetchInvoice('report-123')
		expect(result.invoice?.invoiceNumber).toBe('GA-0001-2025')
		expect(result.invoice?.totalNet).toBe(1500)
		expect(result.invoice?.totalGross).toBe(1785)
		expect(result.invoice?.taxRate).toBe(19)
		expect(result.invoice?.eInvoice).toBe(false)
		expect(result.lineItems).toHaveLength(1)
		expect(result.lineItems[0]?.description).toBe('Grundhonorar')
		expect(result.lineItems[0]?.amount).toBe(587)
	})

	it('returns null invoice when none exists', async () => {
		const mockData = {
			invoice: null,
			lineItems: [],
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		})

		const result = await fetchInvoice('report-456')
		expect(result.invoice).toBeNull()
		expect(result.lineItems).toHaveLength(0)
	})

	it('throws on non-ok response', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
		await expect(fetchInvoice('report-123')).rejects.toThrow(
			'Failed to fetch invoice data',
		)
	})

	it('returns multiple line items', async () => {
		const mockData = {
			invoice: {
				id: 'inv-1',
				reportId: 'report-123',
				invoiceNumber: 'GA-0002-2025',
				date: '2025-04-01T09:00:00+02:00',
				recipientId: null,
				payoutDelay: 30,
				eInvoice: true,
				feeSchedule: 'BVSK',
				totalNet: 850,
				totalGross: 1011.5,
				taxRate: 19,
			},
			lineItems: [
				{
					id: 'li-1',
					invoiceId: 'inv-1',
					description: 'Grundhonorar',
					specialFeature: 'BVSK',
					isLumpSum: true,
					rate: 587,
					amount: 587,
					quantity: 1,
					perUnit: null,
					order: 0,
				},
				{
					id: 'li-2',
					invoiceId: 'inv-1',
					description: 'Fahrtkosten',
					specialFeature: null,
					isLumpSum: false,
					rate: 0.7,
					amount: 63,
					quantity: 90,
					perUnit: 0.7,
					order: 1,
				},
				{
					id: 'li-3',
					invoiceId: 'inv-1',
					description: 'Fotokosten',
					specialFeature: null,
					isLumpSum: false,
					rate: 2.5,
					amount: 50,
					quantity: 20,
					perUnit: 2.5,
					order: 2,
				},
				{
					id: 'li-4',
					invoiceId: 'inv-1',
					description: 'Schreibkosten',
					specialFeature: null,
					isLumpSum: true,
					rate: 150,
					amount: 150,
					quantity: 1,
					perUnit: null,
					order: 3,
				},
			],
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		})

		const result = await fetchInvoice('report-123')
		expect(result.lineItems).toHaveLength(4)
		expect(result.lineItems[0]?.description).toBe('Grundhonorar')
		expect(result.lineItems[1]?.description).toBe('Fahrtkosten')
		expect(result.lineItems[1]?.quantity).toBe(90)
		expect(result.lineItems[2]?.perUnit).toBe(2.5)
		expect(result.lineItems[3]?.isLumpSum).toBe(true)
	})

	it('handles invoice with eInvoice enabled', async () => {
		const mockData = {
			invoice: {
				id: 'inv-2',
				reportId: 'report-789',
				invoiceNumber: 'GA-0003-2025',
				date: '2025-05-01T08:00:00+02:00',
				recipientId: 'client-xyz',
				payoutDelay: 7,
				eInvoice: true,
				feeSchedule: 'BVSK',
				totalNet: 2000,
				totalGross: 2380,
				taxRate: 19,
			},
			lineItems: [],
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		})

		const result = await fetchInvoice('report-789')
		expect(result.invoice?.eInvoice).toBe(true)
		expect(result.invoice?.payoutDelay).toBe(7)
		expect(result.invoice?.feeSchedule).toBe('BVSK')
	})
})
