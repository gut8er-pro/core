import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { VEHICLE_DEFAULTS } from './form-data'
import { IdentificationSection } from './identification-section'
import type { VehicleFormData } from './types'

function TestWrapper({ onFieldBlur }: { onFieldBlur?: (f: string) => void }) {
	const methods = useForm<VehicleFormData>({ defaultValues: { ...VEHICLE_DEFAULTS } })
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
	it('renders "Vehicle Informations" section title', () => {
		render(<TestWrapper />)
		expect(screen.getByText('Vehicle Informations')).toBeInTheDocument()
	})

	it('renders VIN field', () => {
		render(<TestWrapper />)
		expect(screen.getByText('Vehicle identification number (VIN)')).toBeInTheDocument()
	})

	it('renders Manufacturer field', () => {
		render(<TestWrapper />)
		expect(screen.getByText('Manufacturer')).toBeInTheDocument()
	})
})
