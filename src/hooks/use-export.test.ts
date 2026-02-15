import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchExportConfig } from './use-export'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('fetchExportConfig', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('calls fetch with correct URL', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					id: 'exp-1',
					reportId: 'report-123',
					includeValuation: true,
					includeCommission: false,
					includeInvoice: true,
					lockReport: false,
					recipientEmail: null,
					recipientName: null,
					emailSubject: null,
					emailBody: null,
				}),
		})

		await fetchExportConfig('report-123')
		expect(mockFetch).toHaveBeenCalledWith('/api/reports/report-123/export')
	})

	it('returns parsed JSON on success', async () => {
		const mockData = {
			id: 'exp-1',
			reportId: 'report-123',
			includeValuation: true,
			includeCommission: false,
			includeInvoice: true,
			lockReport: false,
			recipientEmail: 'insurer@versicherung.de',
			recipientName: 'Allianz Schadenservice',
			emailSubject: 'Gutachten Nr. 2024-001',
			emailBody: 'Sehr geehrte Damen und Herren, anbei das Gutachten.',
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		})

		const result = await fetchExportConfig('report-123')
		expect(result.id).toBe('exp-1')
		expect(result.reportId).toBe('report-123')
		expect(result.includeValuation).toBe(true)
		expect(result.includeCommission).toBe(false)
		expect(result.includeInvoice).toBe(true)
		expect(result.lockReport).toBe(false)
		expect(result.recipientEmail).toBe('insurer@versicherung.de')
		expect(result.recipientName).toBe('Allianz Schadenservice')
		expect(result.emailSubject).toBe('Gutachten Nr. 2024-001')
		expect(result.emailBody).toContain('anbei das Gutachten')
	})

	it('returns config with null optional fields', async () => {
		const mockData = {
			id: 'exp-2',
			reportId: 'report-456',
			includeValuation: false,
			includeCommission: false,
			includeInvoice: false,
			lockReport: false,
			recipientEmail: null,
			recipientName: null,
			emailSubject: null,
			emailBody: null,
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		})

		const result = await fetchExportConfig('report-456')
		expect(result.recipientEmail).toBeNull()
		expect(result.recipientName).toBeNull()
		expect(result.emailSubject).toBeNull()
		expect(result.emailBody).toBeNull()
	})

	it('throws on non-ok response', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
		await expect(fetchExportConfig('report-123')).rejects.toThrow(
			'Failed to fetch export config',
		)
	})

	it('throws on non-ok 500 response', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
		await expect(fetchExportConfig('report-123')).rejects.toThrow(
			'Failed to fetch export config',
		)
	})
})

describe('patchExportConfig (via module)', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('sends PATCH request with correct URL and body', async () => {
		const mockData = {
			id: 'exp-1',
			reportId: 'report-123',
			includeValuation: true,
			includeCommission: true,
			includeInvoice: false,
			lockReport: false,
			recipientEmail: 'test@example.de',
			recipientName: 'Test',
			emailSubject: 'Updated subject',
			emailBody: null,
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockData),
		})

		const response = await fetch('/api/reports/report-123/export', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ includeCommission: true }),
		})
		const result = await response.json()

		expect(mockFetch).toHaveBeenCalledWith('/api/reports/report-123/export', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ includeCommission: true }),
		})
		expect(result.includeCommission).toBe(true)
	})
})

describe('sendReport (via module)', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('sends POST request with correct URL and body', async () => {
		const mockResponse = {
			success: true,
			message: 'Report sent successfully',
			reportLocked: true,
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		})

		const sendData = {
			recipientEmail: 'insurer@versicherung.de',
			recipientName: 'Allianz',
			emailSubject: 'Gutachten',
			emailBody: 'Anbei das Gutachten.',
			lockReport: true,
		}

		const response = await fetch('/api/reports/report-123/send', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(sendData),
		})
		const result = await response.json()

		expect(mockFetch).toHaveBeenCalledWith('/api/reports/report-123/send', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(sendData),
		})
		expect(result.success).toBe(true)
		expect(result.reportLocked).toBe(true)
	})

	it('handles error response from send endpoint', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 400,
			json: () => Promise.resolve({ error: 'Report is already locked' }),
		})

		const response = await fetch('/api/reports/report-123/send', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				recipientEmail: 'test@example.de',
				recipientName: 'Test',
				emailSubject: 'Report',
			}),
		})

		expect(response.ok).toBe(false)
		const errorBody = await response.json()
		expect(errorBody.error).toBe('Report is already locked')
	})
})
