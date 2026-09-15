import { describe, expect, it } from 'vitest'
import { createTemplateSchema, updateTemplateSchema } from './templates'

describe('createTemplateSchema', () => {
	it('passes with a subject and a body', () => {
		const result = createTemplateSchema.safeParse({
			subject: 'Gutachten zum Schadensfall',
			body: 'Sehr geehrte Damen und Herren,',
		})
		expect(result.success).toBe(true)
	})

	it('passes with an empty body', () => {
		const result = createTemplateSchema.safeParse({ subject: 'Ohne Text', body: '' })
		expect(result.success).toBe(true)
	})

	it('fails with an empty subject', () => {
		const result = createTemplateSchema.safeParse({ subject: '', body: 'Text' })
		expect(result.success).toBe(false)
	})

	it('fails with a missing body', () => {
		const result = createTemplateSchema.safeParse({ subject: 'Betreff' })
		expect(result.success).toBe(false)
	})

	it('fails with a subject over 200 characters', () => {
		const result = createTemplateSchema.safeParse({ subject: 'A'.repeat(201), body: 'Text' })
		expect(result.success).toBe(false)
	})

	it('fails with a body over 20000 characters', () => {
		const result = createTemplateSchema.safeParse({ subject: 'Betreff', body: 'A'.repeat(20001) })
		expect(result.success).toBe(false)
	})
})

describe('updateTemplateSchema', () => {
	it('passes with only a subject', () => {
		const result = updateTemplateSchema.safeParse({ subject: 'Neuer Betreff' })
		expect(result.success).toBe(true)
	})

	it('passes with only a body', () => {
		const result = updateTemplateSchema.safeParse({ body: 'Neuer Text' })
		expect(result.success).toBe(true)
	})

	it('passes with an empty object', () => {
		const result = updateTemplateSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	it('fails when the subject is cleared', () => {
		const result = updateTemplateSchema.safeParse({ subject: '' })
		expect(result.success).toBe(false)
	})
})
