import { describe, expect, it } from 'vitest'
import {
	accidentInfoSchema,
	claimantInfoSchema,
	expertOpinionSchema,
	opponentInfoSchema,
	ownerInfoSchema,
	signatureSchema,
	visitSchema,
} from './accident-info'

describe('accidentInfoSchema', () => {
	it('passes with valid data', () => {
		const result = accidentInfoSchema.safeParse({
			accidentDay: '2024-06-15T10:30:00+02:00',
			accidentScene: 'Autobahn A7, km 42, Richtung Hamburg',
		})
		expect(result.success).toBe(true)
	})

	it('accepts null accidentDay', () => {
		const result = accidentInfoSchema.safeParse({
			accidentDay: null,
			accidentScene: 'Parking lot, Bremen',
		})
		expect(result.success).toBe(true)
	})
})

describe('claimantInfoSchema', () => {
	it('passes with valid data', () => {
		const result = claimantInfoSchema.safeParse({
			company: 'Müller GmbH',
			salutation: 'Mr',
			firstName: 'Hans',
			lastName: 'Müller',
			street: 'Bahnhofstraße 12',
			postcode: '28195',
			location: 'Bremen',
			email: 'hans@muller.de',
			phone: '+49 421 123456',
			iban: 'DE89 3704 0044 0532 0130 00',
			vatId: 'DE123456789',
			licensePlate: 'HB AB 1234',
			eligibleForInputTaxDeduction: true,
			isVehicleOwner: true,
			representedByLawyer: false,
			involvedLawyer: null,
		})
		expect(result.success).toBe(true)
	})

	it('passes with empty object (all fields optional)', () => {
		const result = claimantInfoSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	it('accepts any email string (validation is client-side only)', () => {
		const result = claimantInfoSchema.safeParse({
			email: 'not-an-email',
		})
		expect(result.success).toBe(true)
	})

	it('stores the IBAN without its grouping spaces', () => {
		const result = claimantInfoSchema.safeParse({ iban: 'DE89 3704 0044 0532 0130 00' })
		expect(result.success).toBe(true)
		if (result.success) expect(result.data.iban).toBe('DE89370400440532013000')
	})

	it('rejects an IBAN whose check digits do not add up', () => {
		const result = claimantInfoSchema.safeParse({ iban: 'DE89 3704 0044 0532 0130 01' })
		expect(result.success).toBe(false)
	})

	it('accepts a non-German IBAN that passes the checksum', () => {
		const result = claimantInfoSchema.safeParse({ iban: 'AT61 1904 3002 3457 3201' })
		expect(result.success).toBe(true)
		if (result.success) expect(result.data.iban).toBe('AT611904300234573201')
	})

	it('treats an empty IBAN as cleared rather than invalid', () => {
		const result = claimantInfoSchema.safeParse({ iban: '' })
		expect(result.success).toBe(true)
		if (result.success) expect(result.data.iban).toBeNull()
	})

	it('uppercases the license plate', () => {
		const result = claimantInfoSchema.safeParse({ licensePlate: 'hb ab 1234' })
		expect(result.success).toBe(true)
		if (result.success) expect(result.data.licensePlate).toBe('HB AB 1234')
	})

	it('accepts the lawyer contact columns', () => {
		const result = claimantInfoSchema.safeParse({
			representedByLawyer: true,
			lawyerFirm: 'Kanzlei Müller & Partner',
			lawyerStreet: 'Kanzleiweg 3',
			lawyerPostcode: '28195',
			lawyerLocation: 'Bremen',
			lawyerEmail: 'kanzlei@mueller.de',
			lawyerPhone: '+49 421 999888',
		})
		expect(result.success).toBe(true)
	})
})

describe('ownerInfoSchema', () => {
	it('passes with the claimant-shaped owner fields', () => {
		const result = ownerInfoSchema.safeParse({
			company: 'Fuhrpark GmbH',
			salutation: 'Mr',
			firstName: 'Jens',
			lastName: 'Halter',
			street: 'Werksstraße 8',
			postcode: '28199',
			location: 'Bremen',
			email: 'jens@fuhrpark.de',
			phone: '+49 421 112233',
		})
		expect(result.success).toBe(true)
	})

	it('passes with empty object (all fields optional)', () => {
		expect(ownerInfoSchema.safeParse({}).success).toBe(true)
	})
})

describe('opponentInfoSchema IBAN', () => {
	it('normalises and validates the opponent IBAN the same way', () => {
		const result = opponentInfoSchema.safeParse({ iban: 'DE02 1203 0000 0000 2020 51' })
		expect(result.success).toBe(true)
		if (result.success) expect(result.data.iban).toBe('DE02120300000000202051')
	})

	it('rejects a mistyped opponent IBAN', () => {
		expect(opponentInfoSchema.safeParse({ iban: 'DE02120300000000202052' }).success).toBe(false)
	})
})

describe('opponentInfoSchema', () => {
	it('passes with valid data', () => {
		const result = opponentInfoSchema.safeParse({
			company: 'Schmidt AG',
			salutation: 'Mrs',
			firstName: 'Anna',
			lastName: 'Schmidt',
			street: 'Hauptstraße 5',
			postcode: '10115',
			location: 'Berlin',
			email: 'anna@schmidt.de',
			phone: '+49 30 654321',
			insuranceCompany: 'Allianz',
			insuranceNumber: 'ALZ-2024-12345',
		})
		expect(result.success).toBe(true)
	})

	it('passes with empty object (all fields optional)', () => {
		const result = opponentInfoSchema.safeParse({})
		expect(result.success).toBe(true)
	})
})

describe('visitSchema', () => {
	it('passes with valid data', () => {
		const result = visitSchema.safeParse({
			id: '550e8400-e29b-41d4-a716-446655440000',
			type: 'claimant_residence',
			street: 'Marktplatz 3',
			postcode: '80331',
			location: 'München',
			date: '2024-06-20T14:00:00+02:00',
			expert: 'Dr. Weber',
			vehicleCondition: 'Visible front-end damage, airbags deployed',
		})
		expect(result.success).toBe(true)
	})

	it('rejects invalid type', () => {
		const result = visitSchema.safeParse({
			type: 'invalid_type',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const typeError = result.error.issues.find((issue) => issue.path[0] === 'type')
			expect(typeError).toBeDefined()
		}
	})
})

describe('expertOpinionSchema', () => {
	it('passes with valid data', () => {
		const result = expertOpinionSchema.safeParse({
			expertName: 'Dr. Klaus Weber',
			fileNumber: 'GA-2024-0042',
			caseDate: '2024-06-15T00:00:00+02:00',
			orderWasPlacement: 'Versicherung',
			issuedDate: '2024-06-22T00:00:00+02:00',
			orderByClaimant: true,
			mediator: 'RA Schulz',
		})
		expect(result.success).toBe(true)
	})
})

describe('signatureSchema', () => {
	it('passes with valid data', () => {
		const result = signatureSchema.safeParse({
			id: '550e8400-e29b-41d4-a716-446655440000',
			type: 'LAWYER',
			imageUrl: 'https://example.com/signatures/sig1.png',
			signedAt: '2024-06-22T16:30:00+02:00',
		})
		expect(result.success).toBe(true)
	})

	it('rejects invalid type', () => {
		const result = signatureSchema.safeParse({
			type: 'INVALID_TYPE',
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			const typeError = result.error.issues.find((issue) => issue.path[0] === 'type')
			expect(typeError).toBeDefined()
		}
	})
})
