import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { useForm } from 'react-hook-form'
import { ClaimantSection } from './claimant-section'
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
		<ClaimantSection
			register={methods.register}
			control={methods.control}
			errors={methods.formState.errors}
			onFieldBlur={onFieldBlur}
		/>
	)
}

describe('ClaimantSection', () => {
	it('renders "Claimant Information" section title', () => {
		render(<TestWrapper />)
		expect(screen.getByText('Claimant Information')).toBeInTheDocument()
	})

	it('renders name fields (First Name, Last Name)', () => {
		render(<TestWrapper />)
		expect(screen.getByText('First Name')).toBeInTheDocument()
		expect(screen.getByText('Last Name')).toBeInTheDocument()
	})

	it('renders email and phone fields', () => {
		render(<TestWrapper />)
		expect(screen.getByText('Email')).toBeInTheDocument()
		expect(screen.getByText('Phone')).toBeInTheDocument()
	})

	it('renders checkboxes (3 checkboxes)', () => {
		render(<TestWrapper />)
		expect(
			screen.getByText('Eligible for input tax deduction'),
		).toBeInTheDocument()
		expect(screen.getByText('Is vehicle owner')).toBeInTheDocument()
		expect(screen.getByText('Represented by lawyer')).toBeInTheDocument()
	})

	it('section is open by default', () => {
		render(<TestWrapper />)
		expect(screen.getByPlaceholderText('First name')).toBeVisible()
	})
})
