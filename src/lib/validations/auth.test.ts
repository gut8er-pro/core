import { describe, it, expect } from 'vitest'
import {
	loginSchema,
	signupAccountSchema,
	signupPersonalSchema,
	signupBusinessSchema,
	signupPlanSchema,
	signupIntegrationsSchema,
} from './auth'

describe('loginSchema', () => {
	it('passes with valid email and password', () => {
		const result = loginSchema.safeParse({ email: 'test@example.com', password: 'password123' })
		expect(result.success).toBe(true)
	})

	it('fails with invalid email', () => {
		const result = loginSchema.safeParse({ email: 'not-an-email', password: 'password123' })
		expect(result.success).toBe(false)
	})

	it('fails with short password', () => {
		const result = loginSchema.safeParse({ email: 'test@example.com', password: '1234567' })
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0]?.message).toContain('8 characters')
		}
	})
})

describe('signupAccountSchema', () => {
	it('passes with matching passwords', () => {
		const result = signupAccountSchema.safeParse({
			email: 'test@example.com',
			password: 'password123',
			confirmPassword: 'password123',
		})
		expect(result.success).toBe(true)
	})

	it('fails when passwords do not match', () => {
		const result = signupAccountSchema.safeParse({
			email: 'test@example.com',
			password: 'password123',
			confirmPassword: 'different123',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0]?.message).toContain('do not match')
		}
	})

	it('fails with empty confirmPassword', () => {
		const result = signupAccountSchema.safeParse({
			email: 'test@example.com',
			password: 'password123',
			confirmPassword: '',
		})
		expect(result.success).toBe(false)
	})
})

describe('signupPersonalSchema', () => {
	it('passes with all required fields', () => {
		const result = signupPersonalSchema.safeParse({
			title: 'mr',
			firstName: 'John',
			lastName: 'Doe',
			phone: '+491234567890',
		})
		expect(result.success).toBe(true)
	})

	it('passes with optional qualification', () => {
		const result = signupPersonalSchema.safeParse({
			title: 'dr',
			firstName: 'Jane',
			lastName: 'Smith',
			phone: '+491234567890',
			professionalQualification: 'Kfz-Sachverständiger',
		})
		expect(result.success).toBe(true)
	})

	it('fails without title', () => {
		const result = signupPersonalSchema.safeParse({
			title: '',
			firstName: 'John',
			lastName: 'Doe',
			phone: '+491234567890',
		})
		expect(result.success).toBe(false)
	})
})

describe('signupBusinessSchema', () => {
	it('passes with valid German business data', () => {
		const result = signupBusinessSchema.safeParse({
			companyName: 'Test GmbH',
			street: 'Musterstraße 1',
			postcode: '28195',
			city: 'Bremen',
			taxId: '12/345/67890',
		})
		expect(result.success).toBe(true)
	})

	it('passes with valid VAT ID', () => {
		const result = signupBusinessSchema.safeParse({
			companyName: 'Test GmbH',
			street: 'Musterstraße 1',
			postcode: '28195',
			city: 'Bremen',
			taxId: '12/345/67890',
			vatId: 'DE123456789',
		})
		expect(result.success).toBe(true)
	})

	it('fails with invalid postcode (non-5-digit)', () => {
		const result = signupBusinessSchema.safeParse({
			companyName: 'Test GmbH',
			street: 'Musterstraße 1',
			postcode: '1234',
			city: 'Bremen',
			taxId: '12/345/67890',
		})
		expect(result.success).toBe(false)
	})

	it('fails with invalid VAT ID format', () => {
		const result = signupBusinessSchema.safeParse({
			companyName: 'Test GmbH',
			street: 'Musterstraße 1',
			postcode: '28195',
			city: 'Bremen',
			taxId: '12/345/67890',
			vatId: 'AT123456789',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0]?.message).toContain('DE + 9 digits')
		}
	})

	it('passes with empty optional VAT ID', () => {
		const result = signupBusinessSchema.safeParse({
			companyName: 'Test GmbH',
			street: 'Musterstraße 1',
			postcode: '28195',
			city: 'Bremen',
			taxId: '12/345/67890',
			vatId: '',
		})
		expect(result.success).toBe(true)
	})
})

describe('signupPlanSchema', () => {
	it('rejects free plan (only pro allowed)', () => {
		const result = signupPlanSchema.safeParse({ plan: 'free' })
		expect(result.success).toBe(false)
	})

	it('passes with pro plan', () => {
		const result = signupPlanSchema.safeParse({ plan: 'pro' })
		expect(result.success).toBe(true)
	})

	it('fails with invalid plan', () => {
		const result = signupPlanSchema.safeParse({ plan: 'enterprise' })
		expect(result.success).toBe(false)
	})
})

describe('signupIntegrationsSchema', () => {
	it('passes with DAT provider and credentials', () => {
		const result = signupIntegrationsSchema.safeParse({
			provider: 'dat',
			username: 'user123',
			password: 'pass123',
		})
		expect(result.success).toBe(true)
	})

	it('passes without any provider (skip)', () => {
		const result = signupIntegrationsSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	it('passes with only provider selected', () => {
		const result = signupIntegrationsSchema.safeParse({ provider: 'audatex' })
		expect(result.success).toBe(true)
	})
})
