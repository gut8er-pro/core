import { describe, expect, it } from 'vitest'
import { exportConfigSchema, sendReportSchema } from './export'

describe('exportConfigSchema', () => {
	it('valid full config passes', () => {
		const result = exportConfigSchema.safeParse({
			includeValuation: true,
			includeCommission: false,
			includeInvoice: true,
			lockReport: false,
			recipientEmail: 'max@example.de',
			recipientName: 'Max Mustermann',
			emailSubject: 'Your vehicle damage report',
			emailBody: 'Please find attached the expert appraisal.',
		})
		expect(result.success).toBe(true)
	})

	it('empty object passes (all fields optional)', () => {
		const result = exportConfigSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	it('null recipientEmail passes', () => {
		const result = exportConfigSchema.safeParse({
			recipientEmail: null,
		})
		expect(result.success).toBe(true)
	})

	it('null recipientName passes', () => {
		const result = exportConfigSchema.safeParse({
			recipientName: null,
		})
		expect(result.success).toBe(true)
	})

	it('null emailSubject passes', () => {
		const result = exportConfigSchema.safeParse({
			emailSubject: null,
		})
		expect(result.success).toBe(true)
	})

	it('null emailBody passes', () => {
		const result = exportConfigSchema.safeParse({
			emailBody: null,
		})
		expect(result.success).toBe(true)
	})

	it('accepts any string for recipientEmail (no format validation)', () => {
		const result = exportConfigSchema.safeParse({
			recipientEmail: 'not-an-email',
		})
		expect(result.success).toBe(true)
	})

	it('rejects recipientEmail exceeding 500 characters', () => {
		const result = exportConfigSchema.safeParse({
			recipientEmail: 'A'.repeat(501),
		})
		expect(result.success).toBe(false)
	})

	it('accepts recipientName up to 200 characters', () => {
		const result = exportConfigSchema.safeParse({
			recipientName: 'A'.repeat(200),
		})
		expect(result.success).toBe(true)
	})

	it('rejects recipientName exceeding 200 characters', () => {
		const result = exportConfigSchema.safeParse({
			recipientName: 'A'.repeat(201),
		})
		expect(result.success).toBe(false)
	})

	it('rejects emailSubject exceeding 500 characters', () => {
		const result = exportConfigSchema.safeParse({
			emailSubject: 'S'.repeat(501),
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const subjectError = result.error.issues.find((issue) => issue.path[0] === 'emailSubject')
			expect(subjectError).toBeDefined()
		}
	})

	it('rejects emailBody exceeding 10000 characters', () => {
		const result = exportConfigSchema.safeParse({
			emailBody: 'B'.repeat(10001),
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const bodyError = result.error.issues.find((issue) => issue.path[0] === 'emailBody')
			expect(bodyError).toBeDefined()
		}
	})

	it('accepts boolean toggle values', () => {
		const result = exportConfigSchema.safeParse({
			includeValuation: true,
			includeCommission: true,
			includeInvoice: false,
			lockReport: true,
		})
		expect(result.success).toBe(true)
	})
})

describe('sendReportSchema', () => {
	it('valid send data passes', () => {
		const result = sendReportSchema.safeParse({
			recipientEmail: 'insurer@versicherung.de',
			recipientName: 'Allianz Schadenservice',
			emailSubject: 'Gutachten Nr. 2024-001',
			emailBody: 'Sehr geehrte Damen und Herren, anbei das Gutachten.',
			lockReport: true,
		})
		expect(result.success).toBe(true)
	})

	it('passes without optional emailBody', () => {
		const result = sendReportSchema.safeParse({
			recipientEmail: 'insurer@versicherung.de',
			recipientName: 'Allianz Schadenservice',
			emailSubject: 'Gutachten Nr. 2024-001',
		})
		expect(result.success).toBe(true)
	})

	it('passes without optional lockReport', () => {
		const result = sendReportSchema.safeParse({
			recipientEmail: 'insurer@versicherung.de',
			recipientName: 'Allianz',
			emailSubject: 'Report',
		})
		expect(result.success).toBe(true)
	})

	it('rejects missing recipientEmail', () => {
		const result = sendReportSchema.safeParse({
			recipientName: 'Allianz',
			emailSubject: 'Report',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const emailError = result.error.issues.find((issue) => issue.path[0] === 'recipientEmail')
			expect(emailError).toBeDefined()
		}
	})

	it('rejects invalid recipientEmail', () => {
		const result = sendReportSchema.safeParse({
			recipientEmail: 'bad-email',
			recipientName: 'Allianz',
			emailSubject: 'Report',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const emailError = result.error.issues.find((issue) => issue.path[0] === 'recipientEmail')
			expect(emailError).toBeDefined()
			expect(emailError?.message).toBe('All recipient emails must be valid')
		}
	})

	it('rejects missing recipientName', () => {
		const result = sendReportSchema.safeParse({
			recipientEmail: 'test@example.de',
			emailSubject: 'Report',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const nameError = result.error.issues.find((issue) => issue.path[0] === 'recipientName')
			expect(nameError).toBeDefined()
		}
	})

	it('rejects empty recipientName', () => {
		const result = sendReportSchema.safeParse({
			recipientEmail: 'test@example.de',
			recipientName: '',
			emailSubject: 'Report',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const nameError = result.error.issues.find((issue) => issue.path[0] === 'recipientName')
			expect(nameError).toBeDefined()
			expect(nameError?.message).toBe('Recipient name is required')
		}
	})

	it('accepts recipientName up to 500 characters', () => {
		const result = sendReportSchema.safeParse({
			recipientEmail: 'test@example.de',
			recipientName: 'N'.repeat(500),
			emailSubject: 'Report',
		})
		expect(result.success).toBe(true)
	})

	it('rejects recipientName exceeding 500 characters', () => {
		const result = sendReportSchema.safeParse({
			recipientEmail: 'test@example.de',
			recipientName: 'N'.repeat(501),
			emailSubject: 'Report',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const nameError = result.error.issues.find((issue) => issue.path[0] === 'recipientName')
			expect(nameError).toBeDefined()
		}
	})

	it('rejects missing emailSubject', () => {
		const result = sendReportSchema.safeParse({
			recipientEmail: 'test@example.de',
			recipientName: 'Allianz',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const subjectError = result.error.issues.find((issue) => issue.path[0] === 'emailSubject')
			expect(subjectError).toBeDefined()
		}
	})

	it('rejects empty emailSubject', () => {
		const result = sendReportSchema.safeParse({
			recipientEmail: 'test@example.de',
			recipientName: 'Allianz',
			emailSubject: '',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const subjectError = result.error.issues.find((issue) => issue.path[0] === 'emailSubject')
			expect(subjectError).toBeDefined()
			expect(subjectError?.message).toBe('Subject is required')
		}
	})

	it('rejects emailSubject exceeding 500 characters', () => {
		const result = sendReportSchema.safeParse({
			recipientEmail: 'test@example.de',
			recipientName: 'Allianz',
			emailSubject: 'S'.repeat(501),
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const subjectError = result.error.issues.find((issue) => issue.path[0] === 'emailSubject')
			expect(subjectError).toBeDefined()
		}
	})

	it('rejects emailBody exceeding 10000 characters', () => {
		const result = sendReportSchema.safeParse({
			recipientEmail: 'test@example.de',
			recipientName: 'Allianz',
			emailSubject: 'Report',
			emailBody: 'X'.repeat(10001),
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const bodyError = result.error.issues.find((issue) => issue.path[0] === 'emailBody')
			expect(bodyError).toBeDefined()
		}
	})
})
