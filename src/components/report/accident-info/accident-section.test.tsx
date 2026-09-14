import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { AccidentSection } from './accident-section'
import { ACCIDENT_INFO_DEFAULTS } from './form-data'
import type { AccidentInfoFormData } from './types'

function TestWrapper({ onFieldBlur }: { onFieldBlur?: (f: string) => void }) {
	const methods = useForm<AccidentInfoFormData>({ defaultValues: { ...ACCIDENT_INFO_DEFAULTS } })
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
		expect(screen.getByPlaceholderText('Enter accident location')).toBeVisible()
	})
})
