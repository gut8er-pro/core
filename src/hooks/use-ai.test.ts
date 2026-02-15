import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the AI client module before importing hooks
vi.mock('@/lib/ai/client', () => ({
	analyzePhoto: vi.fn(),
	detectVin: vi.fn(),
	detectLicensePlate: vi.fn(),
	ocrDocument: vi.fn(),
}))

import {
	analyzePhoto,
	detectVin,
	detectLicensePlate,
	ocrDocument,
} from '@/lib/ai/client'

describe('analyzePhoto (AI client)', () => {
	const mockedAnalyzePhoto = vi.mocked(analyzePhoto)

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns description on success', async () => {
		mockedAnalyzePhoto.mockResolvedValueOnce({
			description: 'Front bumper shows deep scratch approximately 15cm long',
		})

		const result = await analyzePhoto(
			'https://storage.example.com/photos/damage-front.jpg',
		)
		expect(result.description).toBe(
			'Front bumper shows deep scratch approximately 15cm long',
		)
		expect(mockedAnalyzePhoto).toHaveBeenCalledWith(
			'https://storage.example.com/photos/damage-front.jpg',
		)
	})

	it('throws on failure', async () => {
		mockedAnalyzePhoto.mockRejectedValueOnce(new Error('AI analysis failed'))

		await expect(
			analyzePhoto('https://storage.example.com/photos/bad.jpg'),
		).rejects.toThrow('AI analysis failed')
	})
})

describe('detectVin (AI client)', () => {
	const mockedDetectVin = vi.mocked(detectVin)

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns VIN when detected', async () => {
		mockedDetectVin.mockResolvedValueOnce({
			vin: 'WVWZZZ3CZWE123456',
		})

		const result = await detectVin(
			'https://storage.example.com/photos/vin-plate.jpg',
		)
		expect(result.vin).toBe('WVWZZZ3CZWE123456')
		expect(mockedDetectVin).toHaveBeenCalledWith(
			'https://storage.example.com/photos/vin-plate.jpg',
		)
	})

	it('returns null VIN when not detected', async () => {
		mockedDetectVin.mockResolvedValueOnce({
			vin: null,
		})

		const result = await detectVin(
			'https://storage.example.com/photos/blurry.jpg',
		)
		expect(result.vin).toBeNull()
	})

	it('throws on failure', async () => {
		mockedDetectVin.mockRejectedValueOnce(new Error('VIN detection failed'))

		await expect(
			detectVin('https://storage.example.com/photos/bad.jpg'),
		).rejects.toThrow('VIN detection failed')
	})
})

describe('detectLicensePlate (AI client)', () => {
	const mockedDetectPlate = vi.mocked(detectLicensePlate)

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns plate when detected', async () => {
		mockedDetectPlate.mockResolvedValueOnce({
			plate: 'HB-XY 1234',
		})

		const result = await detectLicensePlate(
			'https://storage.example.com/photos/front-car.jpg',
		)
		expect(result.plate).toBe('HB-XY 1234')
		expect(mockedDetectPlate).toHaveBeenCalledWith(
			'https://storage.example.com/photos/front-car.jpg',
		)
	})

	it('returns null plate when not detected', async () => {
		mockedDetectPlate.mockResolvedValueOnce({
			plate: null,
		})

		const result = await detectLicensePlate(
			'https://storage.example.com/photos/side-view.jpg',
		)
		expect(result.plate).toBeNull()
	})

	it('throws on failure', async () => {
		mockedDetectPlate.mockRejectedValueOnce(
			new Error('Plate detection failed'),
		)

		await expect(
			detectLicensePlate('https://storage.example.com/photos/bad.jpg'),
		).rejects.toThrow('Plate detection failed')
	})
})

describe('ocrDocument (AI client)', () => {
	const mockedOcrDocument = vi.mocked(ocrDocument)

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns extracted key-value pairs', async () => {
		const ocrResult = {
			'Fahrzeug-Identifizierungsnummer': 'WVWZZZ3CZWE123456',
			'Erstzulassung': '15.03.2020',
			'Hersteller': 'Volkswagen',
			'Typ': 'Golf GTI',
		}

		mockedOcrDocument.mockResolvedValueOnce(ocrResult)

		const result = await ocrDocument(
			'https://storage.example.com/photos/registration-doc.jpg',
		)
		expect(result['Fahrzeug-Identifizierungsnummer']).toBe(
			'WVWZZZ3CZWE123456',
		)
		expect(result['Erstzulassung']).toBe('15.03.2020')
		expect(result['Hersteller']).toBe('Volkswagen')
		expect(result['Typ']).toBe('Golf GTI')
		expect(mockedOcrDocument).toHaveBeenCalledWith(
			'https://storage.example.com/photos/registration-doc.jpg',
		)
	})

	it('returns empty object when nothing recognized', async () => {
		mockedOcrDocument.mockResolvedValueOnce({})

		const result = await ocrDocument(
			'https://storage.example.com/photos/blank-page.jpg',
		)
		expect(Object.keys(result)).toHaveLength(0)
	})

	it('throws on failure', async () => {
		mockedOcrDocument.mockRejectedValueOnce(new Error('OCR failed'))

		await expect(
			ocrDocument('https://storage.example.com/photos/bad.jpg'),
		).rejects.toThrow('OCR failed')
	})
})
