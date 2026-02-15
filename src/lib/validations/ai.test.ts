import { describe, it, expect } from 'vitest'
import {
	aiPhotoRequestSchema,
	photoAnalysisResponseSchema,
	vinDetectionResponseSchema,
	plateDetectionResponseSchema,
	ocrResponseSchema,
} from './ai'

describe('aiPhotoRequestSchema', () => {
	it('valid URL passes', () => {
		const result = aiPhotoRequestSchema.safeParse({
			photoUrl: 'https://storage.example.com/photos/damage-front.jpg',
		})
		expect(result.success).toBe(true)
	})

	it('rejects missing photoUrl', () => {
		const result = aiPhotoRequestSchema.safeParse({})
		expect(result.success).toBe(false)
		if (!result.success) {
			const urlError = result.error.issues.find(
				(issue) => issue.path[0] === 'photoUrl',
			)
			expect(urlError).toBeDefined()
		}
	})

	it('rejects empty string', () => {
		const result = aiPhotoRequestSchema.safeParse({
			photoUrl: '',
		})
		expect(result.success).toBe(false)
	})

	it('rejects non-URL string', () => {
		const result = aiPhotoRequestSchema.safeParse({
			photoUrl: 'not-a-url',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const urlError = result.error.issues.find(
				(issue) => issue.path[0] === 'photoUrl',
			)
			expect(urlError).toBeDefined()
			expect(urlError?.message).toBe('A valid photo URL is required')
		}
	})

	it('accepts https URL', () => {
		const result = aiPhotoRequestSchema.safeParse({
			photoUrl: 'https://cdn.gut8erpro.de/uploads/photo-001.png',
		})
		expect(result.success).toBe(true)
	})

	it('accepts http URL', () => {
		const result = aiPhotoRequestSchema.safeParse({
			photoUrl: 'http://localhost:3000/uploads/photo.jpg',
		})
		expect(result.success).toBe(true)
	})

	it('rejects numeric photoUrl', () => {
		const result = aiPhotoRequestSchema.safeParse({
			photoUrl: 12345,
		})
		expect(result.success).toBe(false)
	})
})

describe('photoAnalysisResponseSchema', () => {
	it('valid response passes', () => {
		const result = photoAnalysisResponseSchema.safeParse({
			description: 'Front bumper shows deep scratch approximately 15cm long',
		})
		expect(result.success).toBe(true)
	})

	it('empty description passes', () => {
		const result = photoAnalysisResponseSchema.safeParse({
			description: '',
		})
		expect(result.success).toBe(true)
	})

	it('rejects missing description', () => {
		const result = photoAnalysisResponseSchema.safeParse({})
		expect(result.success).toBe(false)
		if (!result.success) {
			const descError = result.error.issues.find(
				(issue) => issue.path[0] === 'description',
			)
			expect(descError).toBeDefined()
		}
	})

	it('rejects non-string description', () => {
		const result = photoAnalysisResponseSchema.safeParse({
			description: 42,
		})
		expect(result.success).toBe(false)
	})
})

describe('vinDetectionResponseSchema', () => {
	it('valid VIN passes', () => {
		const result = vinDetectionResponseSchema.safeParse({
			vin: 'WVWZZZ3CZWE123456',
		})
		expect(result.success).toBe(true)
	})

	it('null VIN passes (not detected)', () => {
		const result = vinDetectionResponseSchema.safeParse({
			vin: null,
		})
		expect(result.success).toBe(true)
	})

	it('rejects missing vin field', () => {
		const result = vinDetectionResponseSchema.safeParse({})
		expect(result.success).toBe(false)
		if (!result.success) {
			const vinError = result.error.issues.find(
				(issue) => issue.path[0] === 'vin',
			)
			expect(vinError).toBeDefined()
		}
	})

	it('rejects non-string vin', () => {
		const result = vinDetectionResponseSchema.safeParse({
			vin: 12345,
		})
		expect(result.success).toBe(false)
	})
})

describe('plateDetectionResponseSchema', () => {
	it('valid German plate passes', () => {
		const result = plateDetectionResponseSchema.safeParse({
			plate: 'HB-XY 1234',
		})
		expect(result.success).toBe(true)
	})

	it('null plate passes (not detected)', () => {
		const result = plateDetectionResponseSchema.safeParse({
			plate: null,
		})
		expect(result.success).toBe(true)
	})

	it('rejects missing plate field', () => {
		const result = plateDetectionResponseSchema.safeParse({})
		expect(result.success).toBe(false)
		if (!result.success) {
			const plateError = result.error.issues.find(
				(issue) => issue.path[0] === 'plate',
			)
			expect(plateError).toBeDefined()
		}
	})

	it('rejects non-string plate', () => {
		const result = plateDetectionResponseSchema.safeParse({
			plate: true,
		})
		expect(result.success).toBe(false)
	})
})

describe('ocrResponseSchema', () => {
	it('valid OCR key-value pairs pass', () => {
		const result = ocrResponseSchema.safeParse({
			'Fahrzeug-Identifizierungsnummer': 'WVWZZZ3CZWE123456',
			'Erstzulassung': '15.03.2020',
			'Hersteller': 'Volkswagen',
		})
		expect(result.success).toBe(true)
	})

	it('empty object passes', () => {
		const result = ocrResponseSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	it('single key-value pair passes', () => {
		const result = ocrResponseSchema.safeParse({
			'VIN': 'WVWZZZ3CZWE123456',
		})
		expect(result.success).toBe(true)
	})

	it('rejects non-string values', () => {
		const result = ocrResponseSchema.safeParse({
			field1: 123,
		})
		expect(result.success).toBe(false)
	})

	it('rejects array values', () => {
		const result = ocrResponseSchema.safeParse({
			field1: ['a', 'b'],
		})
		expect(result.success).toBe(false)
	})

	it('rejects non-object input', () => {
		const result = ocrResponseSchema.safeParse('not an object')
		expect(result.success).toBe(false)
	})

	it('rejects null input', () => {
		const result = ocrResponseSchema.safeParse(null)
		expect(result.success).toBe(false)
	})
})
