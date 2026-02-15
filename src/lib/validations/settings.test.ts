import { describe, it, expect } from 'vitest'
import {
	profileSettingsSchema,
	businessSettingsSchema,
	settingsUpdateSchema,
} from './settings'

describe('profileSettingsSchema', () => {
	it('passes with all fields provided', () => {
		const result = profileSettingsSchema.safeParse({
			title: 'mr',
			firstName: 'Hans',
			lastName: 'Mueller',
			phone: '+491234567890',
		})
		expect(result.success).toBe(true)
	})

	it('passes with empty object (all fields optional)', () => {
		const result = profileSettingsSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	it('passes with null values for nullable fields', () => {
		const result = profileSettingsSchema.safeParse({
			title: null,
			firstName: null,
			lastName: null,
			phone: null,
		})
		expect(result.success).toBe(true)
	})

	it('passes with partial data', () => {
		const result = profileSettingsSchema.safeParse({
			firstName: 'Hans',
		})
		expect(result.success).toBe(true)
	})

	it('rejects firstName that is empty string when provided', () => {
		const result = profileSettingsSchema.safeParse({
			firstName: '',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const firstNameError = result.error.issues.find(
				(issue) => issue.path[0] === 'firstName',
			)
			expect(firstNameError).toBeDefined()
			expect(firstNameError?.message).toContain('First name is required')
		}
	})

	it('rejects lastName that is empty string when provided', () => {
		const result = profileSettingsSchema.safeParse({
			lastName: '',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const lastNameError = result.error.issues.find(
				(issue) => issue.path[0] === 'lastName',
			)
			expect(lastNameError).toBeDefined()
			expect(lastNameError?.message).toContain('Last name is required')
		}
	})
})

describe('businessSettingsSchema', () => {
	const validBusiness = {
		companyName: 'Sachverstaendigenbuero Mueller',
		street: 'Bahnhofstrasse 12',
		postcode: '28195',
		city: 'Bremen',
		taxId: '12/345/67890',
	}

	it('passes with all required fields', () => {
		const result = businessSettingsSchema.safeParse(validBusiness)
		expect(result.success).toBe(true)
	})

	it('passes with valid VAT ID (DE + 9 digits)', () => {
		const result = businessSettingsSchema.safeParse({
			...validBusiness,
			vatId: 'DE123456789',
		})
		expect(result.success).toBe(true)
	})

	it('passes with null VAT ID', () => {
		const result = businessSettingsSchema.safeParse({
			...validBusiness,
			vatId: null,
		})
		expect(result.success).toBe(true)
	})

	it('passes with empty string VAT ID (optional)', () => {
		const result = businessSettingsSchema.safeParse({
			...validBusiness,
			vatId: '',
		})
		expect(result.success).toBe(true)
	})

	it('fails with missing companyName', () => {
		const { companyName: _, ...noCompany } = validBusiness
		const result = businessSettingsSchema.safeParse(noCompany)
		expect(result.success).toBe(false)
	})

	it('fails with empty companyName', () => {
		const result = businessSettingsSchema.safeParse({
			...validBusiness,
			companyName: '',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const companyError = result.error.issues.find(
				(issue) => issue.path[0] === 'companyName',
			)
			expect(companyError).toBeDefined()
			expect(companyError?.message).toContain('Company name is required')
		}
	})

	it('fails with missing street', () => {
		const { street: _, ...noStreet } = validBusiness
		const result = businessSettingsSchema.safeParse(noStreet)
		expect(result.success).toBe(false)
	})

	it('fails with empty street', () => {
		const result = businessSettingsSchema.safeParse({
			...validBusiness,
			street: '',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const streetError = result.error.issues.find(
				(issue) => issue.path[0] === 'street',
			)
			expect(streetError).toBeDefined()
			expect(streetError?.message).toContain('Street is required')
		}
	})

	it('fails with postcode shorter than 5 digits', () => {
		const result = businessSettingsSchema.safeParse({
			...validBusiness,
			postcode: '2819',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const postcodeError = result.error.issues.find(
				(issue) => issue.path[0] === 'postcode',
			)
			expect(postcodeError).toBeDefined()
		}
	})

	it('fails with postcode longer than 5 digits', () => {
		const result = businessSettingsSchema.safeParse({
			...validBusiness,
			postcode: '281950',
		})
		expect(result.success).toBe(false)
	})

	it('fails with non-numeric postcode', () => {
		const result = businessSettingsSchema.safeParse({
			...validBusiness,
			postcode: 'ABCDE',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const postcodeError = result.error.issues.find(
				(issue) => issue.path[0] === 'postcode',
			)
			expect(postcodeError).toBeDefined()
			expect(postcodeError?.message).toContain('5 digits')
		}
	})

	it('fails with missing city', () => {
		const { city: _, ...noCity } = validBusiness
		const result = businessSettingsSchema.safeParse(noCity)
		expect(result.success).toBe(false)
	})

	it('fails with empty city', () => {
		const result = businessSettingsSchema.safeParse({
			...validBusiness,
			city: '',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const cityError = result.error.issues.find(
				(issue) => issue.path[0] === 'city',
			)
			expect(cityError).toBeDefined()
			expect(cityError?.message).toContain('City is required')
		}
	})

	it('fails with missing taxId', () => {
		const { taxId: _, ...noTaxId } = validBusiness
		const result = businessSettingsSchema.safeParse(noTaxId)
		expect(result.success).toBe(false)
	})

	it('fails with empty taxId', () => {
		const result = businessSettingsSchema.safeParse({
			...validBusiness,
			taxId: '',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const taxIdError = result.error.issues.find(
				(issue) => issue.path[0] === 'taxId',
			)
			expect(taxIdError).toBeDefined()
			expect(taxIdError?.message).toContain('Tax ID')
		}
	})

	it('fails with invalid VAT ID format (wrong country prefix)', () => {
		const result = businessSettingsSchema.safeParse({
			...validBusiness,
			vatId: 'AT123456789',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const vatError = result.error.issues.find(
				(issue) => issue.path[0] === 'vatId',
			)
			expect(vatError).toBeDefined()
			expect(vatError?.message).toContain('DE + 9 digits')
		}
	})

	it('fails with invalid VAT ID format (too few digits)', () => {
		const result = businessSettingsSchema.safeParse({
			...validBusiness,
			vatId: 'DE12345678',
		})
		expect(result.success).toBe(false)
	})

	it('fails with invalid VAT ID format (too many digits)', () => {
		const result = businessSettingsSchema.safeParse({
			...validBusiness,
			vatId: 'DE1234567890',
		})
		expect(result.success).toBe(false)
	})

	it('fails with invalid VAT ID format (non-numeric after DE)', () => {
		const result = businessSettingsSchema.safeParse({
			...validBusiness,
			vatId: 'DEabcdefghi',
		})
		expect(result.success).toBe(false)
	})
})

describe('settingsUpdateSchema', () => {
	it('passes with only profile section', () => {
		const result = settingsUpdateSchema.safeParse({
			profile: {
				firstName: 'Hans',
				lastName: 'Mueller',
			},
		})
		expect(result.success).toBe(true)
	})

	it('passes with only business section', () => {
		const result = settingsUpdateSchema.safeParse({
			business: {
				companyName: 'Test GmbH',
				street: 'Musterstrasse 1',
				postcode: '10115',
				city: 'Berlin',
				taxId: '27/123/45678',
			},
		})
		expect(result.success).toBe(true)
	})

	it('passes with both profile and business sections', () => {
		const result = settingsUpdateSchema.safeParse({
			profile: {
				firstName: 'Hans',
				lastName: 'Mueller',
				phone: '+491234567890',
			},
			business: {
				companyName: 'Mueller Gutachten GmbH',
				street: 'Hauptstrasse 5',
				postcode: '80331',
				city: 'Muenchen',
				taxId: '143/123/45678',
				vatId: 'DE987654321',
			},
		})
		expect(result.success).toBe(true)
	})

	it('passes with empty object (both sections optional)', () => {
		const result = settingsUpdateSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	it('fails when business section has invalid postcode', () => {
		const result = settingsUpdateSchema.safeParse({
			business: {
				companyName: 'Test GmbH',
				street: 'Musterstrasse 1',
				postcode: '123',
				city: 'Berlin',
				taxId: '27/123/45678',
			},
		})
		expect(result.success).toBe(false)
	})

	it('fails when business section has invalid VAT ID', () => {
		const result = settingsUpdateSchema.safeParse({
			business: {
				companyName: 'Test GmbH',
				street: 'Musterstrasse 1',
				postcode: '10115',
				city: 'Berlin',
				taxId: '27/123/45678',
				vatId: 'INVALID',
			},
		})
		expect(result.success).toBe(false)
	})
})
