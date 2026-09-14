import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { ClaimantSection } from './claimant-section'
import { ACCIDENT_INFO_DEFAULTS } from './form-data'
import type { AccidentInfoFormData } from './types'

function TestWrapper({ onFieldBlur }: { onFieldBlur?: (f: string) => void }) {
	const methods = useForm<AccidentInfoFormData>({ defaultValues: { ...ACCIDENT_INFO_DEFAULTS } })
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

	it('renders email field', () => {
		render(<TestWrapper />)
		expect(screen.getByText('Email')).toBeInTheDocument()
	})

	it('renders checkboxes', () => {
		render(<TestWrapper />)
		expect(screen.getByText('Eligible for input tax deduction')).toBeInTheDocument()
		expect(screen.getByText('Is the vehicle owner')).toBeInTheDocument()
		expect(screen.getByText('Represented by a lawyer')).toBeInTheDocument()
	})

	it('binds the IBAN input to the claimant IBAN column, not the vehicle make', () => {
		render(<TestWrapper />)
		expect(screen.getByLabelText('IBAN')).toHaveAttribute('name', 'claimantIban')
	})

	it('offers a phone number input bound to the claimant phone column', () => {
		render(<TestWrapper />)
		expect(screen.getByLabelText('Phone Number')).toHaveAttribute('name', 'claimantPhone')
	})

	it('renders no claimant vehicle make input — the make belongs to the Vehicle tab', () => {
		const { container } = render(<TestWrapper />)
		expect(container.querySelector('[name="claimantVehicleMake"]')).toBeNull()
	})

	it('placeholders match the field they sit in', () => {
		render(<TestWrapper />)
		expect(screen.getByLabelText('IBAN')).toHaveAttribute(
			'placeholder',
			'DE89 3704 0044 0532 0130 00',
		)
		expect(screen.getByLabelText('Phone Number')).toHaveAttribute('placeholder', '+49 152 3818411')
	})

	it('section is open by default', () => {
		render(<TestWrapper />)
		expect(screen.getByText('First Name')).toBeVisible()
	})
})
