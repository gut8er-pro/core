import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form'

type AccidentInfoFormData = {
	// Accident
	accidentDay: string
	accidentScene: string
	// Claimant
	claimantCompany: string
	claimantSalutation: string
	claimantFirstName: string
	claimantLastName: string
	claimantStreet: string
	claimantPostcode: string
	claimantLocation: string
	claimantEmail: string
	claimantPhone: string
	claimantVehicleMake: string
	claimantLicensePlate: string
	claimantEligibleForInputTaxDeduction: boolean
	claimantIsVehicleOwner: boolean
	claimantRepresentedByLawyer: boolean
	claimantInvolvedLawyer: string
	// Opponent
	opponentCompany: string
	opponentSalutation: string
	opponentFirstName: string
	opponentLastName: string
	opponentStreet: string
	opponentPostcode: string
	opponentLocation: string
	opponentEmail: string
	opponentPhone: string
	opponentInsuranceCompany: string
	opponentInsuranceNumber: string
	// Expert Opinion
	expertName: string
	fileNumber: string
	caseDate: string
	orderWasPlacement: string
	issuedDate: string
	orderByClaimant: boolean
	mediator: string
	// Visits (array)
	visits: Array<{
		type: string
		street: string
		postcode: string
		location: string
		date: string
		expert: string
		vehicleCondition: string
	}>
}

type SectionProps = {
	register: UseFormRegister<AccidentInfoFormData>
	control: Control<AccidentInfoFormData>
	errors: FieldErrors<AccidentInfoFormData>
	onFieldBlur?: (field: string) => void
}

type SignatureData = {
	id: string
	type: string
	imageUrl: string | null
	signedAt: string | null
}

type SignatureSectionProps = {
	signatures: SignatureData[]
	onSignatureClick: (type: 'LAWYER' | 'DATA_PERMISSION' | 'CANCELLATION') => void
	className?: string
}

export type {
	AccidentInfoFormData,
	SectionProps,
	SignatureData,
	SignatureSectionProps,
}
