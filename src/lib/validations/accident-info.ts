import { z } from 'zod'
import { isValidIban, normalizeIban } from '@/lib/utils/iban'

// Accept YYYY-MM-DD, full ISO datetime, or empty string (treated as null)
const dateString = z
	.string()
	.transform((v) => (v === '' ? null : v))
	.pipe(
		z
			.string()
			.refine((v) => /^\d{4}-\d{2}-\d{2}/.test(v), {
				message: 'Must be a valid date string',
			})
			.nullable(),
	)

// Accept empty strings or any string (email validation is client-side only)
const emailOrEmpty = z
	.string()
	.max(200)
	.transform((v) => (v === '' ? null : v))
	.pipe(z.string().nullable())

// Stored without the grouping spaces the input shows. The MOD-97 check digits
// are what an IBAN exists for, so a value that fails them is a typo, not a bank.
const iban = z
	.string()
	.max(50)
	.transform((v) => (v.trim() === '' ? null : normalizeIban(v)))
	.pipe(z.string().refine(isValidIban, { message: 'Must be a valid IBAN' }).nullable())

// German plates are uppercase by law; the input normalises as you type and this
// is the backstop for anything reaching the column another way.
const licensePlate = z
	.string()
	.max(20)
	.transform((v) => (v.trim() === '' ? null : v.toUpperCase()))
	.pipe(z.string().nullable())

const accidentInfoSchema = z.object({
	accidentDay: dateString.nullable().optional(),
	accidentScene: z.string().max(500).nullable().optional(),
	presentExpert: z.boolean().optional(),
	presentClient: z.boolean().optional(),
	presentWorkshopEmployee: z.boolean().optional(),
})

const claimantInfoSchema = z.object({
	company: z.string().max(200).nullable().optional(),
	salutation: z.string().max(50).nullable().optional(),
	firstName: z.string().max(100).nullable().optional(),
	lastName: z.string().max(100).nullable().optional(),
	street: z.string().max(200).nullable().optional(),
	postcode: z.string().max(10).nullable().optional(),
	location: z.string().max(200).nullable().optional(),
	email: emailOrEmpty.nullable().optional(),
	phone: z.string().max(50).nullable().optional(),
	iban: iban.nullable().optional(),
	vatId: z.string().max(50).nullable().optional(),
	licensePlate: licensePlate.nullable().optional(),
	eligibleForInputTaxDeduction: z.boolean().optional(),
	isVehicleOwner: z.boolean().optional(),
	representedByLawyer: z.boolean().optional(),
	involvedLawyer: z.string().max(200).nullable().optional(),
	lawyerFirm: z.string().max(200).nullable().optional(),
	lawyerStreet: z.string().max(200).nullable().optional(),
	lawyerPostcode: z.string().max(10).nullable().optional(),
	lawyerLocation: z.string().max(200).nullable().optional(),
	lawyerEmail: emailOrEmpty.nullable().optional(),
	lawyerPhone: z.string().max(50).nullable().optional(),
})

const ownerInfoSchema = z.object({
	company: z.string().max(200).nullable().optional(),
	salutation: z.string().max(50).nullable().optional(),
	firstName: z.string().max(100).nullable().optional(),
	lastName: z.string().max(100).nullable().optional(),
	street: z.string().max(200).nullable().optional(),
	postcode: z.string().max(10).nullable().optional(),
	location: z.string().max(200).nullable().optional(),
	email: emailOrEmpty.nullable().optional(),
	phone: z.string().max(50).nullable().optional(),
})

const opponentInfoSchema = z.object({
	company: z.string().max(200).nullable().optional(),
	salutation: z.string().max(50).nullable().optional(),
	firstName: z.string().max(100).nullable().optional(),
	lastName: z.string().max(100).nullable().optional(),
	street: z.string().max(200).nullable().optional(),
	postcode: z.string().max(10).nullable().optional(),
	location: z.string().max(200).nullable().optional(),
	email: emailOrEmpty.nullable().optional(),
	phone: z.string().max(50).nullable().optional(),
	iban: iban.nullable().optional(),
	insuranceCompany: z.string().max(200).nullable().optional(),
	insuranceNumber: z.string().max(100).nullable().optional(),
	claimNumber: z.string().max(100).nullable().optional(),
})

const visitTypeEnum = z.enum(['claimant_residence', 'claimant_office', 'other'])

const visitSchema = z.object({
	id: z.string().uuid().optional(),
	type: visitTypeEnum.optional().default('other'),
	street: z.string().max(200).nullable().optional(),
	postcode: z.string().max(10).nullable().optional(),
	location: z.string().max(200).nullable().optional(),
	date: dateString.nullable().optional(),
	expert: z.string().max(200).nullable().optional(),
	vehicleCondition: z.string().max(500).nullable().optional(),
})

const expertOpinionSchema = z.object({
	expertName: z.string().max(200).nullable().optional(),
	fileNumber: z.string().max(100).nullable().optional(),
	caseDate: dateString.nullable().optional(),
	orderWasPlacement: z.string().max(200).nullable().optional(),
	issuedDate: dateString.nullable().optional(),
	orderByClaimant: z.boolean().optional(),
	mediator: z.string().max(200).nullable().optional(),
})

const signatureTypeEnum = z.enum(['LAWYER', 'DATA_PERMISSION', 'CANCELLATION'])

const signatureSchema = z.object({
	id: z.string().uuid().optional(),
	type: signatureTypeEnum,
	imageUrl: z.string().url().nullable().optional(),
	signedAt: dateString.nullable().optional(),
})

const accidentInfoPatchSchema = z.object({
	accidentInfo: accidentInfoSchema.optional(),
	claimantInfo: claimantInfoSchema.optional(),
	ownerInfo: ownerInfoSchema.optional(),
	opponentInfo: opponentInfoSchema.optional(),
	visits: z.array(visitSchema).optional(),
	expertOpinion: expertOpinionSchema.optional(),
	signatures: z.array(signatureSchema).optional(),
})

type AccidentInfoInput = z.infer<typeof accidentInfoSchema>
type ClaimantInfoInput = z.infer<typeof claimantInfoSchema>
type OpponentInfoInput = z.infer<typeof opponentInfoSchema>
type OwnerInfoInput = z.infer<typeof ownerInfoSchema>
type VisitInput = z.infer<typeof visitSchema>
type VisitType = z.infer<typeof visitTypeEnum>
type ExpertOpinionInput = z.infer<typeof expertOpinionSchema>
type SignatureInput = z.infer<typeof signatureSchema>
type SignatureType = z.infer<typeof signatureTypeEnum>
type AccidentInfoPatchInput = z.infer<typeof accidentInfoPatchSchema>

export type {
	AccidentInfoInput,
	AccidentInfoPatchInput,
	ClaimantInfoInput,
	ExpertOpinionInput,
	OpponentInfoInput,
	OwnerInfoInput,
	SignatureInput,
	SignatureType,
	VisitInput,
	VisitType,
}
export {
	accidentInfoPatchSchema,
	accidentInfoSchema,
	claimantInfoSchema,
	expertOpinionSchema,
	opponentInfoSchema,
	ownerInfoSchema,
	signatureSchema,
	signatureTypeEnum,
	visitSchema,
	visitTypeEnum,
}
