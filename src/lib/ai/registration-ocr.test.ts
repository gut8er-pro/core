// Registration-document OCR and rear-plate HU-Plakette parsing (issue 14).
//
// The KIA Ceed demo produced a wrong kW value, 1482 ccm for a 1.6 CRDi, an
// empty Erstzulassung and a wrong vehicle type. The prompt now names the
// Zulassungsbescheinigung box labels; these tests pin the parsing half —
// what reaches the columns once the model has answered.

import { describe, expect, it } from 'vitest'
import {
	normalizeKbaNumber,
	normalizeOcrDate,
	parseOcrResponse,
	parsePlateResponse,
} from './pipeline'

function ocr(fields: Record<string, unknown>) {
	return parseOcrResponse('photo-1', JSON.stringify(fields))
}

describe('parseOcrResponse', () => {
	it('reads the demo document into the right columns', () => {
		const out = ocr({
			manufacturer: 'KIA',
			model: 'CEED SW',
			vin: 'U5YH5814AKL123456',
			licensePlate: 'FÜ BP 147',
			firstRegistration: '2019-06-14',
			lastRegistration: '2023-02-01',
			nextMot: '2026-05-01',
			engineDisplacement: '1582',
			power: '100',
			fuel: 'Diesel',
			kbaNumber: '8253/AKL',
			vehicleType: 'wagon',
			seats: '5',
		})
		expect(out.power).toBe('100')
		expect(out.engineDisplacement).toBe('1582')
		expect(out.firstRegistration).toBe('2019-06-14')
		expect(out.lastRegistration).toBe('2023-02-01')
		expect(out.nextMot).toBe('2026-05-01')
		expect(out.kbaNumber).toBe('8253/AKL')
		expect(out.vehicleType).toBe('wagon')
		expect(out.vin).toBe('U5YH5814AKL123456')
	})

	it('strips units the model keeps despite the prompt', () => {
		const out = ocr({ power: '94 kW', engineDisplacement: '1.582 cm³', seats: '5 Sitze' })
		expect(out.power).toBe('94')
		expect(out.engineDisplacement).toBe('1582')
		expect(out.seats).toBe('5')
	})

	it('drops a numeric box the model narrated instead of read', () => {
		// "nicht lesbar" used to be stored verbatim and then parsed to NaN.
		const out = ocr({ power: 'nicht lesbar', engineDisplacement: 'unbekannt' })
		expect(out.power).toBe('')
		expect(out.engineDisplacement).toBe('')
	})

	it('normalizes German date forms to ISO', () => {
		const out = ocr({ firstRegistration: '14.06.2019', lastRegistration: '02/2023' })
		expect(out.firstRegistration).toBe('2019-06-14')
		expect(out.lastRegistration).toBe('2023-02-01')
	})

	it('drops a date it cannot make sense of rather than poisoning the column', () => {
		// The route does `new Date(value)`; an unparseable string lands as an
		// Invalid Date on VehicleInfo.firstRegistration.
		const out = ocr({ firstRegistration: 'Juni 2019 ca.', nextMot: 'abgelaufen' })
		expect(out.firstRegistration).toBe('')
		expect(out.nextMot).toBe('')
	})

	it('maps the German body style onto a real vehicleType option', () => {
		expect(ocr({ vehicleType: 'Kombilimousine' }).vehicleType).toBe('wagon')
		expect(ocr({ vehicleType: 'Limousine' }).vehicleType).toBe('sedan')
		expect(ocr({ vehicleType: 'Geländewagen' }).vehicleType).toBe('suv')
	})

	it('drops a vehicleType that matches no option', () => {
		// The demo report showed the wrong type; an off-list value is worse
		// than an empty select the assessor fills in one click.
		expect(ocr({ vehicleType: 'Personenkraftwagen' }).vehicleType).toBe('')
		expect(ocr({ vehicleType: '' }).vehicleType).toBe('')
	})

	it('rejects a VIN that is not 17 valid characters', () => {
		expect(ocr({ vin: 'U5YH5814AKL12345' }).vin).toBe('')
		expect(ocr({ vin: 'nicht lesbar' }).vin).toBe('')
	})

	it('keeps the owner block as written', () => {
		const out = ocr({
			ownerFirstName: 'Anna',
			ownerLastName: 'Müller',
			ownerStreet: 'Hauptstraße 12',
			ownerPostcode: '90762',
			ownerCity: 'Fürth',
		})
		expect(out.ownerLastName).toBe('Müller')
		expect(out.ownerPostcode).toBe('90762')
		expect(out.ownerCity).toBe('Fürth')
	})

	it('returns an all-empty result on unparseable output', () => {
		const out = parseOcrResponse('photo-9', 'I could not read this document.')
		expect(out.photoId).toBe('photo-9')
		expect(out.power).toBe('')
		expect(out.vin).toBe('')
		expect(out.nextMot).toBe('')
	})

	it('strips ```json fences before parsing', () => {
		const out = parseOcrResponse('photo-2', '```json\n{"power":"94 kW"}\n```')
		expect(out.power).toBe('94')
	})
})

describe('normalizeKbaNumber', () => {
	it('formats HSN/TSN with the separator', () => {
		expect(normalizeKbaNumber('8253 AKL')).toBe('8253/AKL')
		expect(normalizeKbaNumber('8253/akl')).toBe('8253/AKL')
	})

	it('rejects anything that is not 4 digits plus 3 alphanumerics', () => {
		expect(normalizeKbaNumber('M1')).toBe('')
		expect(normalizeKbaNumber('Personenkraftwagen')).toBe('')
		expect(normalizeKbaNumber('')).toBe('')
	})
})

describe('normalizeOcrDate', () => {
	it('accepts ISO and fills the day for month-only values', () => {
		expect(normalizeOcrDate('2026-05-01')).toBe('2026-05-01')
		expect(normalizeOcrDate('2026-05')).toBe('2026-05-01')
		expect(normalizeOcrDate('5/2026')).toBe('2026-05-01')
	})

	it('returns empty for junk', () => {
		expect(normalizeOcrDate('bald')).toBe('')
		expect(normalizeOcrDate('')).toBe('')
	})
})

describe('parsePlateResponse', () => {
	it('reads plate and HU-Plakette from the JSON answer', () => {
		const out = parsePlateResponse(JSON.stringify({ plate: 'FÜ BP 147', nextMot: '2026-05-01' }))
		expect(out.plate).toBe('FÜ BP 147')
		expect(out.nextMot).toBe('2026-05-01')
	})

	it('accepts a bare-string answer as the plate', () => {
		// Cached v2 rows and the occasional conversational reply.
		const out = parsePlateResponse('B-AB 1234')
		expect(out.plate).toBe('B-AB 1234')
		expect(out.nextMot).toBeNull()
	})

	it('returns a null plate when the format does not validate', () => {
		expect(parsePlateResponse(JSON.stringify({ plate: 'ABCDEFG', nextMot: '' })).plate).toBeNull()
		expect(parsePlateResponse('null').plate).toBeNull()
	})

	it('returns a null Plakette date when the sticker was not legible', () => {
		const out = parsePlateResponse(JSON.stringify({ plate: 'FÜ BP 147', nextMot: '' }))
		expect(out.nextMot).toBeNull()
	})

	it('keeps the plate when only the Plakette is unreadable', () => {
		const out = parsePlateResponse(JSON.stringify({ plate: 'M-XX 9999E', nextMot: 'unklar' }))
		expect(out.plate).toBe('M-XX 9999E')
		expect(out.nextMot).toBeNull()
	})
})
