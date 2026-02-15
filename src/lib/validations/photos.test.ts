import { describe, it, expect } from 'vitest'
import {
	uploadPhotoSchema,
	updatePhotoSchema,
	saveAnnotationSchema,
	validateFileType,
	validateFileSize,
	MAX_PHOTOS_PER_REPORT,
	ALLOWED_TYPES,
	MAX_FILE_SIZE,
} from './photos'

describe('uploadPhotoSchema', () => {
	it('valid input passes', () => {
		const result = uploadPhotoSchema.safeParse({
			reportId: '550e8400-e29b-41d4-a716-446655440000',
			filename: 'damage-photo.jpg',
		})
		expect(result.success).toBe(true)
	})

	it('rejects empty filename', () => {
		const result = uploadPhotoSchema.safeParse({
			reportId: '550e8400-e29b-41d4-a716-446655440000',
			filename: '',
		})
		expect(result.success).toBe(false)
	})

	it('rejects non-UUID reportId', () => {
		const result = uploadPhotoSchema.safeParse({
			reportId: 'not-a-uuid',
			filename: 'photo.jpg',
		})
		expect(result.success).toBe(false)
	})
})

describe('updatePhotoSchema', () => {
	it('valid partial update passes', () => {
		const result = updatePhotoSchema.safeParse({
			aiDescription: 'Front bumper damage',
			order: 3,
		})
		expect(result.success).toBe(true)
	})

	it('rejects invalid type enum', () => {
		const result = updatePhotoSchema.safeParse({
			type: 'INVALID_TYPE',
		})
		expect(result.success).toBe(false)
	})
})

describe('saveAnnotationSchema', () => {
	it('valid annotation passes', () => {
		const result = saveAnnotationSchema.safeParse({
			type: 'arrow',
			color: '#FF0000',
			coordinates: { x: 10, y: 20 },
		})
		expect(result.success).toBe(true)
	})

	it('rejects missing type', () => {
		const result = saveAnnotationSchema.safeParse({
			color: '#FF0000',
			coordinates: { x: 10, y: 20 },
		})
		expect(result.success).toBe(false)
	})
})

describe('validateFileType', () => {
	it('accepts image/jpeg', () => {
		expect(validateFileType('image/jpeg')).toBe(true)
	})

	it('accepts image/png', () => {
		expect(validateFileType('image/png')).toBe(true)
	})

	it('rejects application/pdf', () => {
		expect(validateFileType('application/pdf')).toBe(false)
	})
})

describe('validateFileSize', () => {
	it('accepts 5MB file', () => {
		expect(validateFileSize(5 * 1024 * 1024)).toBe(true)
	})

	it('rejects 15MB file', () => {
		expect(validateFileSize(15 * 1024 * 1024)).toBe(false)
	})
})

describe('constants', () => {
	it('MAX_PHOTOS_PER_REPORT equals 20', () => {
		expect(MAX_PHOTOS_PER_REPORT).toBe(20)
	})

	it('ALLOWED_TYPES contains expected mime types', () => {
		expect(ALLOWED_TYPES).toContain('image/jpeg')
		expect(ALLOWED_TYPES).toContain('image/png')
		expect(ALLOWED_TYPES).toContain('image/webp')
	})

	it('MAX_FILE_SIZE equals 10MB', () => {
		expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024)
	})
})
