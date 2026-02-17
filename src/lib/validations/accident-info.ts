import { z } from 'zod'

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

// Accept empty strings or valid emails
const emailOrEmpty = z
	.string()
	.transform((v) => (v === '' ? null : v))
	.pipe(z.string().email().nullable())

const accidentInfoSchema = z.object({
	accidentDay: dateString.nullable().optional(),
	accidentScene: z.string().max(500).nullable().optional(),
})

const claimantInfoSchema = z.object({
	company: z.string().max(200).nullable().optional(),
	salutation: z.string().max(50).nullable().optional(),
	firstName: z.string().max(100).nullable().optional(),
	lastName: z.string().max(100).nullable().optional(),
	street: z.string().max(200).nullable().optional(),
	postcode: z
		.string()
		.max(5)
		.regex(/^\d{0,5}$/, 'Postcode must be up to 5 digits')
		.nullable()
		.optional(),
	location: z.string().max(200).nullable().optional(),
	email: emailOrEmpty.nullable().optional(),
	phone: z.string().max(50).nullable().optional(),
	vehicleMake: z.string().max(100).nullable().optional(),
	licensePlate: z.string().max(20).nullable().optional(),
	eligibleForInputTaxDeduction: z.boolean().optional(),
	isVehicleOwner: z.boolean().optional(),
	representedByLawyer: z.boolean().optional(),
	involvedLawyer: z.string().max(200).nullable().optional(),
})

const opponentInfoSchema = z.object({
	company: z.string().max(200).nullable().optional(),
	salutation: z.string().max(50).nullable().optional(),
	firstName: z.string().max(100).nullable().optional(),
	lastName: z.string().max(100).nullable().optional(),
	street: z.string().max(200).nullable().optional(),
	postcode: z
		.string()
		.max(5)
		.regex(/^\d{0,5}$/, 'Postcode must be up to 5 digits')
		.nullable()
		.optional(),
	location: z.string().max(200).nullable().optional(),
	email: emailOrEmpty.nullable().optional(),
	phone: z.string().max(50).nullable().optional(),
	insuranceCompany: z.string().max(200).nullable().optional(),
	insuranceNumber: z.string().max(100).nullable().optional(),
})

const visitTypeEnum = z.enum(['claimant_residence', 'claimant_office', 'other'])

const visitSchema = z.object({
	id: z.string().uuid().optional(),
	type: visitTypeEnum,
	street: z.string().max(200).nullable().optional(),
	postcode: z
		.string()
		.max(5)
		.regex(/^\d{0,5}$/, 'Postcode must be up to 5 digits')
		.nullable()
		.optional(),
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
	opponentInfo: opponentInfoSchema.optional(),
	visits: z.array(visitSchema).optional(),
	expertOpinion: expertOpinionSchema.optional(),
	signatures: z.array(signatureSchema).optional(),
})

type AccidentInfoInput = z.infer<typeof accidentInfoSchema>
type ClaimantInfoInput = z.infer<typeof claimantInfoSchema>
type OpponentInfoInput = z.infer<typeof opponentInfoSchema>
type VisitInput = z.infer<typeof visitSchema>
type VisitType = z.infer<typeof visitTypeEnum>
type ExpertOpinionInput = z.infer<typeof expertOpinionSchema>
type SignatureInput = z.infer<typeof signatureSchema>
type SignatureType = z.infer<typeof signatureTypeEnum>
type AccidentInfoPatchInput = z.infer<typeof accidentInfoPatchSchema>

export {
	accidentInfoSchema,
	claimantInfoSchema,
	opponentInfoSchema,
	visitSchema,
	visitTypeEnum,
	expertOpinionSchema,
	signatureSchema,
	signatureTypeEnum,
	accidentInfoPatchSchema,
}
export type {
	AccidentInfoInput,
	ClaimantInfoInput,
	OpponentInfoInput,
	VisitInput,
	VisitType,
	ExpertOpinionInput,
	SignatureInput,
	SignatureType,
	AccidentInfoPatchInput,
}
