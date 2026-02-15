import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { useForm } from 'react-hook-form'
import { AccidentSection } from './accident-section'
import type { AccidentInfoFormData } from './types'

function TestWrapper({ onFieldBlur }: { onFieldBlur?: (f: string) => void }) {
	const methods = useForm<AccidentInfoFormData>({
		defaultValues: {
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
			claimantVehicleMake: '',
			claimantLicensePlate: '',
			claimantEligibleForInputTaxDeduction: false,
			claimantIsVehicleOwner: false,
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
			opponentPhone: '',
			opponentInsuranceCompany: '',
			opponentInsuranceNumber: '',
			expertName: '',
			fileNumber: '',
			caseDate: '',
			orderWasPlacement: '',
			issuedDate: '',
			orderByClaimant: false,
			mediator: '',
			visits: [],
		},
	})
	return (
		<AccidentSection
			register={methods.register}
			control={methods.control}
			errors={methods.formState.errors}
			onFieldBlur={onFieldBlur}
		/>
	)
}

describe('AccidentSection', () => {
	it('renders "Accident Information" section title', () => {
		render(<TestWrapper />)
		expect(screen.getByText('Accident Information')).toBeInTheDocument()
	})

	it('renders Accident Day field', () => {
		render(<TestWrapper />)
		expect(screen.getByText('Accident Day')).toBeInTheDocument()
	})

	it('renders Accident Scene field', () => {
		render(<TestWrapper />)
		expect(screen.getByText('Accident Scene')).toBeInTheDocument()
	})

	it('section is open by default', () => {
		render(<TestWrapper />)
		expect(
			screen.getByPlaceholderText('Enter accident location'),
		).toBeVisible()
	})
})
