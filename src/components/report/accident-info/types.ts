import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form'
import type { ReportType } from '@/lib/validations/reports'

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
	opponentIban: string
	opponentPhone: string
	opponentInsuranceCompany: string
	opponentInsuranceNumber: string
	opponentClaimNumber: string
	// Expert Opinion
	expertName: string
	fileNumber: string
	caseDate: string
	orderWasPlacement: string
	issuedDate: string
	orderByClaimant: boolean
	mediator: string
	// Visits (array). `id` is undefined for unsaved rows added in the UI;
	// once the server creates the row, the form re-loads with the id so
	// subsequent saves UPDATE rather than CREATE a duplicate.
	visits: Array<{
		id?: string
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
	reportType?: ReportType
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
	onSignatureRemove?: (signatureId: string) => void
	className?: string
}

export type { AccidentInfoFormData, SectionProps, SignatureData, SignatureSectionProps }
