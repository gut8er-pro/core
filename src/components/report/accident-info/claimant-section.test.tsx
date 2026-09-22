import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { ClaimantSection } from './claimant-section'
import { ACCIDENT_INFO_DEFAULTS } from './form-data'
import type { AccidentInfoFormData } from './types'

function TestWrapper({
	onFieldBlur,
	defaults,
	disabled,
	reportType,
}: {
	onFieldBlur?: (f: string) => void
	defaults?: Partial<AccidentInfoFormData>
	disabled?: boolean
	reportType?: 'HS' | 'BE' | 'KG' | 'OT'
}) {
	const methods = useForm<AccidentInfoFormData>({
		defaultValues: { ...ACCIDENT_INFO_DEFAULTS, ...defaults },
	})
	return (
		<ClaimantSection
			register={methods.register}
			control={methods.control}
			errors={methods.formState.errors}
			onFieldBlur={onFieldBlur}
			disabled={disabled}
			reportType={reportType}
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

describe('lawyer contact details', () => {
	it('stay hidden while the claimant is not represented', () => {
		const { container } = render(<TestWrapper />)
		expect(container.querySelector('[name="claimantLawyerFirm"]')).toBeNull()
		expect(container.querySelector('[name="claimantLawyerEmail"]')).toBeNull()
	})

	it('appear once the claimant is marked as represented', () => {
		const { container } = render(<TestWrapper defaults={{ claimantRepresentedByLawyer: true }} />)
		expect(screen.getByText('Lawyer Details')).toBeInTheDocument()
		for (const name of [
			'claimantLawyerFirm',
			'claimantLawyerStreet',
			'claimantLawyerPostcode',
			'claimantLawyerLocation',
			'claimantLawyerEmail',
			'claimantLawyerPhone',
			'claimantInvolvedLawyer',
		]) {
			expect(container.querySelector(`[name="${name}"]`), name).not.toBeNull()
		}
	})

	it('are never offered on an oldtimer valuation, which has no lawyer checkbox', () => {
		const { container } = render(
			<TestWrapper defaults={{ claimantRepresentedByLawyer: true }} reportType="OT" />,
		)
		expect(container.querySelector('[name="claimantLawyerFirm"]')).toBeNull()
	})
})

describe('vehicle owner section', () => {
	it('stays hidden while the claimant is the vehicle owner', () => {
		const { container } = render(<TestWrapper />)
		expect(container.querySelector('[name="ownerLastName"]')).toBeNull()
	})

	it('appears once the claimant is not the vehicle owner', () => {
		const { container } = render(<TestWrapper defaults={{ claimantIsVehicleOwner: false }} />)

		expect(screen.getByText('Vehicle Owner')).toBeInTheDocument()
		for (const name of [
			'ownerCompany',
			'ownerFirstName',
			'ownerLastName',
			'ownerStreet',
			'ownerPostcode',
			'ownerLocation',
			'ownerEmail',
			'ownerPhone',
		]) {
			expect(container.querySelector(`[name="${name}"]`), name).not.toBeNull()
		}
	})

	it('carries no IBAN or tax field — those are the claimant’s payment details', () => {
		const { container } = render(<TestWrapper defaults={{ claimantIsVehicleOwner: false }} />)
		expect(container.querySelector('[name="ownerIban"]')).toBeNull()
		expect(container.querySelector('[name="ownerVatId"]')).toBeNull()
	})
})

describe('locked report', () => {
	it('disables every claimant input', () => {
		const { container } = render(<TestWrapper disabled />)
		const inputs = container.querySelectorAll('input')

		expect(inputs.length).toBeGreaterThan(0)
		for (const input of inputs) {
			expect(input, input.getAttribute('name') ?? 'input').toBeDisabled()
		}
	})

	it('leaves the inputs editable on an unlocked report', () => {
		const { container } = render(<TestWrapper />)
		expect(container.querySelector('[name="claimantLastName"]')).toBeEnabled()
	})
})
