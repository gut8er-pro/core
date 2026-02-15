import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { useForm } from 'react-hook-form'
import { IdentificationSection } from './identification-section'
import type { VehicleFormData } from './types'

function TestWrapper({ onFieldBlur }: { onFieldBlur?: (f: string) => void }) {
	const methods = useForm<VehicleFormData>({
		defaultValues: {
			vin: '',
			datsCode: '',
			marketIndex: '',
			manufacturer: '',
			mainType: '',
			subType: '',
			kbaNumber: '',
			powerKw: '',
			powerHp: '',
			engineDesign: '',
			cylinders: '',
			transmission: '',
			displacement: '',
			firstRegistration: '',
			lastRegistration: '',
			vehicleType: '',
			motorType: '',
			axles: 0,
			drivenAxles: 0,
			doors: 0,
			seats: 0,
			previousOwners: 0,
		},
	})
	return (
		<IdentificationSection
			register={methods.register}
			control={methods.control}
			errors={methods.formState.errors}
			onFieldBlur={onFieldBlur}
		/>
	)
}

describe('IdentificationSection', () => {
	it('renders "Vehicle Information" section title', () => {
		render(<TestWrapper />)
		expect(screen.getByText('Vehicle Information')).toBeInTheDocument()
	})

	it('renders VIN field', () => {
		render(<TestWrapper />)
		expect(screen.getByText('VIN')).toBeInTheDocument()
	})

	it('renders Manufacturer field', () => {
		render(<TestWrapper />)
		expect(screen.getByText('Manufacturer')).toBeInTheDocument()
	})
})
