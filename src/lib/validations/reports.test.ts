import { describe, it, expect } from 'vitest'
import {
	createReportSchema,
	updateReportSchema,
	reportListParamsSchema,
} from './reports'

describe('createReportSchema', () => {
	it('passes with valid title', () => {
		const result = createReportSchema.safeParse({ title: 'My Report' })
		expect(result.success).toBe(true)
	})

	it('fails with empty title', () => {
		const result = createReportSchema.safeParse({ title: '' })
		expect(result.success).toBe(false)
	})

	it('fails with title over 200 characters', () => {
		const result = createReportSchema.safeParse({ title: 'A'.repeat(201) })
		expect(result.success).toBe(false)
	})
})

describe('updateReportSchema', () => {
	it('passes with valid status', () => {
		const result = updateReportSchema.safeParse({ status: 'COMPLETED' })
		expect(result.success).toBe(true)
	})

	it('passes with completion percentage', () => {
		const result = updateReportSchema.safeParse({ completionPercentage: 75 })
		expect(result.success).toBe(true)
	})

	it('fails with invalid status', () => {
		const result = updateReportSchema.safeParse({ status: 'INVALID' })
		expect(result.success).toBe(false)
	})

	it('fails with completion over 100', () => {
		const result = updateReportSchema.safeParse({ completionPercentage: 101 })
		expect(result.success).toBe(false)
	})

	it('passes with isLocked boolean', () => {
		const result = updateReportSchema.safeParse({ isLocked: true })
		expect(result.success).toBe(true)
	})

	it('passes with empty object (all optional)', () => {
		const result = updateReportSchema.safeParse({})
		expect(result.success).toBe(true)
	})
})

describe('reportListParamsSchema', () => {
	it('applies defaults for empty object', () => {
		const result = reportListParamsSchema.safeParse({})
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.page).toBe(1)
			expect(result.data.limit).toBe(10)
			expect(result.data.sortBy).toBe('createdAt')
			expect(result.data.sortOrder).toBe('desc')
		}
	})

	it('parses string page/limit to numbers', () => {
		const result = reportListParamsSchema.safeParse({ page: '3', limit: '20' })
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.page).toBe(3)
			expect(result.data.limit).toBe(20)
		}
	})

	it('accepts valid status filter', () => {
		const result = reportListParamsSchema.safeParse({ status: 'DRAFT' })
		expect(result.success).toBe(true)
	})

	it('fails with invalid status', () => {
		const result = reportListParamsSchema.safeParse({ status: 'UNKNOWN' })
		expect(result.success).toBe(false)
	})

	it('fails with limit over 100', () => {
		const result = reportListParamsSchema.safeParse({ limit: 101 })
		expect(result.success).toBe(false)
	})

	it('accepts all valid sort options', () => {
		for (const sortBy of ['createdAt', 'updatedAt', 'title']) {
			for (const sortOrder of ['asc', 'desc']) {
				const result = reportListParamsSchema.safeParse({ sortBy, sortOrder })
				expect(result.success).toBe(true)
			}
		}
	})
})
