import { describe, expect, it } from 'vitest'
import type { AccidentInfoResponse } from '@/hooks/use-accident-info'
import { claimantInfoSchema, opponentInfoSchema } from '@/lib/validations/accident-info'
import { ACCIDENT_INFO_DEFAULTS, accidentInfoFromApi } from './form-data'

type ClaimantRow = NonNullable<AccidentInfoResponse['claimantInfo']>
type OpponentRow = NonNullable<AccidentInfoResponse['opponentInfo']>

const EMPTY: AccidentInfoResponse = {
	accidentInfo: null,
	claimantInfo: null,
	opponentInfo: null,
	visits: [],
	expertOpinion: null,
	signatures: [],
}

const CLAIMANT_ROW: ClaimantRow = {
	id: 'c1',
	reportId: 'r1',
	company: null,
	salutation: null,
	firstName: null,
	lastName: null,
	street: null,
	postcode: null,
	location: null,
	email: null,
	phone: null,
	iban: null,
	vatId: null,
	licensePlate: null,
	eligibleForInputTaxDeduction: false,
	isVehicleOwner: true,
	representedByLawyer: false,
	involvedLawyer: null,
}

const OPPONENT_ROW: OpponentRow = {
	id: 'o1',
	reportId: 'r1',
	company: null,
	salutation: null,
	firstName: null,
	lastName: null,
	street: null,
	postcode: null,
	location: null,
	email: null,
	phone: null,
	iban: null,
	insuranceCompany: null,
	insuranceNumber: null,
	claimNumber: null,
}

const withClaimant = (claimantInfo: ClaimantRow): AccidentInfoResponse => ({
	...EMPTY,
	claimantInfo,
})
const withOpponent = (opponentInfo: OpponentRow): AccidentInfoResponse => ({
	...EMPTY,
	opponentInfo,
})

describe('accidentInfoFromApi', () => {
	it('reads the claimant IBAN back from its own column', () => {
		const form = accidentInfoFromApi(
			withClaimant({ ...CLAIMANT_ROW, iban: 'DE89370400440532013000' }),
		)
		expect(form.claimantIban).toBe('DE89370400440532013000')
	})

	it('keeps the claimant phone number separate from the IBAN', () => {
		const form = accidentInfoFromApi(
			withClaimant({ ...CLAIMANT_ROW, phone: '+49 30 123456', iban: 'DE89370400440532013000' }),
		)
		expect(form.claimantPhone).toBe('+49 30 123456')
		expect(form.claimantIban).toBe('DE89370400440532013000')
	})

	it('reads the claimant VAT ID back from its own column', () => {
		const form = accidentInfoFromApi(withClaimant({ ...CLAIMANT_ROW, vatId: 'DE123456789' }))
		expect(form.claimantVatId).toBe('DE123456789')
	})

	it('reads the opponent IBAN and claim number back', () => {
		const form = accidentInfoFromApi(
			withOpponent({
				...OPPONENT_ROW,
				iban: 'DE02120300000000202051',
				claimNumber: 'SCH-2026-4711',
			}),
		)
		expect(form.opponentIban).toBe('DE02120300000000202051')
		expect(form.opponentClaimNumber).toBe('SCH-2026-4711')
	})

	it('falls back to the defaults when the report has no saved rows', () => {
		expect(accidentInfoFromApi(null)).toEqual(ACCIDENT_INFO_DEFAULTS)
	})
})

/**
 * Every claimant/opponent input is auto-routed to `<party>Info.<field>` by the
 * page's blur handler, so a form field the PATCH schema does not know about is
 * dropped without a word — which is how an IBAN ended up in `vehicleMake` and a
 * VAT ID nowhere at all. These two tests hold both ends of that rename together.
 */
describe('form field ↔ API column parity', () => {
	const apiKey = (formKey: string, prefix: string) => {
		const rest = formKey.slice(prefix.length)
		return rest.charAt(0).toLowerCase() + rest.slice(1)
	}

	const formKeys = (prefix: string) =>
		Object.keys(ACCIDENT_INFO_DEFAULTS).filter((key) => key.startsWith(prefix))

	it('every claimant form field has a column the PATCH schema accepts', () => {
		const accepted = Object.keys(claimantInfoSchema.shape)
		for (const key of formKeys('claimant')) {
			expect(accepted, `${key} has nowhere to be saved`).toContain(apiKey(key, 'claimant'))
		}
	})

	it('every opponent form field has a column the PATCH schema accepts', () => {
		const accepted = Object.keys(opponentInfoSchema.shape)
		for (const key of formKeys('opponent')) {
			expect(accepted, `${key} has nowhere to be saved`).toContain(apiKey(key, 'opponent'))
		}
	})
})
