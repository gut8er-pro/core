import type {
	Control,
	FieldErrors,
	UseFormGetValues,
	UseFormRegister,
	UseFormSetValue,
} from 'react-hook-form'

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
	claimantIban: string
	claimantVatId: string
	claimantLicensePlate: string
	claimantEligibleForInputTaxDeduction: boolean
	claimantIsVehicleOwner: boolean
	claimantRepresentedByLawyer: boolean
	claimantInvolvedLawyer: string
	claimantLawyerFirm: string
	claimantLawyerStreet: string
	claimantLawyerPostcode: string
	claimantLawyerLocation: string
	claimantLawyerEmail: string
	claimantLawyerPhone: string
	// Vehicle owner — filled only when the claimant is not the owner
	ownerCompany: string
	ownerSalutation: string
	ownerFirstName: string
	ownerLastName: string
	ownerStreet: string
	ownerPostcode: string
	ownerLocation: string
	ownerEmail: string
	ownerPhone: string
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
	presentExpert: boolean
	presentClient: boolean
	presentWorkshopEmployee: boolean
}

type SectionProps = {
	register: UseFormRegister<AccidentInfoFormData>
	control: Control<AccidentInfoFormData>
	errors: FieldErrors<AccidentInfoFormData>
	onFieldBlur?: (field: string) => void
	reportType?: 'HS' | 'BE' | 'KG' | 'OT'
	/** The report is locked: every control is read-only. */
	disabled?: boolean
	getValues?: UseFormGetValues<AccidentInfoFormData>
	setValue?: UseFormSetValue<AccidentInfoFormData>
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
	disabled?: boolean
}

export type { AccidentInfoFormData, SectionProps, SignatureData, SignatureSectionProps }
