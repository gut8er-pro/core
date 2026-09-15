import type { AccidentInfoResponse } from '@/hooks/use-accident-info'
import type { AccidentInfoValues } from '@/lib/completeness'
import type { AccidentInfoFormData } from './types'

const ACCIDENT_INFO_DEFAULTS: AccidentInfoFormData = {
	accidentDay: '',
	accidentScene: '',
	claimantCompany: '',
	claimantSalutation: '',
	claimantFirstName: '',
	claimantLastName: '',
	claimantStreet: '',
	claimantPostcode: '',
	claimantLocation: '',
	claimantEmail: '',
	claimantPhone: '',
	claimantIban: '',
	claimantVatId: '',
	claimantLicensePlate: '',
	claimantEligibleForInputTaxDeduction: false,
	claimantIsVehicleOwner: true,
	claimantRepresentedByLawyer: false,
	claimantInvolvedLawyer: '',
	opponentCompany: '',
	opponentSalutation: '',
	opponentFirstName: '',
	opponentLastName: '',
	opponentStreet: '',
	opponentPostcode: '',
	opponentLocation: '',
	opponentEmail: '',
	opponentIban: '',
	opponentPhone: '',
	opponentInsuranceCompany: '',
	opponentInsuranceNumber: '',
	opponentClaimNumber: '',
	expertName: '',
	fileNumber: '',
	caseDate: '',
	orderWasPlacement: '',
	issuedDate: '',
	orderByClaimant: false,
	mediator: '',
	visits: [],
	presentExpert: false,
	presentClient: false,
	presentWorkshopEmployee: false,
}

/**
 * The saved report as the Accident Info form holds it. One mapping serves both
 * the form's initial `reset()` and the completeness engine, so what the engine
 * calls missing is exactly what the assessor sees on screen.
 */
function accidentInfoFromApi(data: AccidentInfoResponse | undefined | null): AccidentInfoFormData {
	if (!data) return { ...ACCIDENT_INFO_DEFAULTS }

	const accident = data.accidentInfo
	const claimant = data.claimantInfo
	const opponent = data.opponentInfo
	const expert = data.expertOpinion

	return {
		...ACCIDENT_INFO_DEFAULTS,
		accidentDay: accident?.accidentDay?.split('T')[0] ?? '',
		accidentScene: accident?.accidentScene ?? '',
		presentExpert: accident?.presentExpert ?? false,
		presentClient: accident?.presentClient ?? false,
		presentWorkshopEmployee: accident?.presentWorkshopEmployee ?? false,
		claimantCompany: claimant?.company ?? '',
		claimantSalutation: claimant?.salutation ?? '',
		claimantFirstName: claimant?.firstName ?? '',
		claimantLastName: claimant?.lastName ?? '',
		claimantStreet: claimant?.street ?? '',
		claimantPostcode: claimant?.postcode ?? '',
		claimantLocation: claimant?.location ?? '',
		claimantEmail: claimant?.email ?? '',
		claimantPhone: claimant?.phone ?? '',
		claimantIban: claimant?.iban ?? '',
		claimantVatId: claimant?.vatId ?? '',
		claimantLicensePlate: claimant?.licensePlate ?? '',
		claimantEligibleForInputTaxDeduction:
			claimant?.eligibleForInputTaxDeduction ??
			ACCIDENT_INFO_DEFAULTS.claimantEligibleForInputTaxDeduction,
		claimantIsVehicleOwner:
			claimant?.isVehicleOwner ?? ACCIDENT_INFO_DEFAULTS.claimantIsVehicleOwner,
		claimantRepresentedByLawyer:
			claimant?.representedByLawyer ?? ACCIDENT_INFO_DEFAULTS.claimantRepresentedByLawyer,
		claimantInvolvedLawyer: claimant?.involvedLawyer ?? '',
		opponentCompany: opponent?.company ?? '',
		opponentSalutation: opponent?.salutation ?? '',
		opponentFirstName: opponent?.firstName ?? '',
		opponentLastName: opponent?.lastName ?? '',
		opponentStreet: opponent?.street ?? '',
		opponentPostcode: opponent?.postcode ?? '',
		opponentLocation: opponent?.location ?? '',
		opponentEmail: opponent?.email ?? '',
		opponentIban: opponent?.iban ?? '',
		opponentPhone: opponent?.phone ?? '',
		opponentInsuranceCompany: opponent?.insuranceCompany ?? '',
		opponentInsuranceNumber: opponent?.insuranceNumber ?? '',
		opponentClaimNumber: opponent?.claimNumber ?? '',
		expertName: expert?.expertName ?? '',
		fileNumber: expert?.fileNumber ?? '',
		caseDate: expert?.caseDate?.split('T')[0] ?? '',
		orderWasPlacement: expert?.orderWasPlacement ?? '',
		issuedDate: expert?.issuedDate?.split('T')[0] ?? '',
		orderByClaimant: expert?.orderByClaimant ?? ACCIDENT_INFO_DEFAULTS.orderByClaimant,
		mediator: expert?.mediator ?? '',
		visits: (data.visits ?? []).map((visit) => ({
			id: visit.id,
			type: visit.type,
			street: visit.street ?? '',
			postcode: visit.postcode ?? '',
			location: visit.location ?? '',
			date: visit.date?.split('T')[0] ?? '',
			expert: visit.expert ?? '',
			vehicleCondition: visit.vehicleCondition ?? '',
		})),
	}
}

/** Form values plus the signatures the form does not own. */
function accidentInfoValuesFromApi(
	data: AccidentInfoResponse | undefined | null,
): AccidentInfoValues {
	return { ...accidentInfoFromApi(data), signatures: data?.signatures ?? [] }
}

export { ACCIDENT_INFO_DEFAULTS, accidentInfoFromApi, accidentInfoValuesFromApi }
