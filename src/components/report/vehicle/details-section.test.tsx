import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@/test/test-utils'
import { DetailsSection } from './details-section'
import { VEHICLE_DEFAULTS } from './form-data'
import type { VehicleFormData } from './types'

function TestWrapper({
	onFieldBlur,
	disabled,
	defaults,
}: {
	onFieldBlur?: (field: string) => void
	disabled?: boolean
	defaults?: Partial<VehicleFormData>
}) {
	const methods = useForm<VehicleFormData>({
		defaultValues: { ...VEHICLE_DEFAULTS, ...defaults },
	})
	return (
		<DetailsSection
			register={methods.register}
			control={methods.control}
			errors={methods.formState.errors}
			onFieldBlur={onFieldBlur}
			disabled={disabled}
		/>
	)
}

function open() {
	fireEvent.click(screen.getByText('Vehicle Details'))
}

function row(label: string) {
	const heading = screen.getByText(label)
	const container = heading.parentElement as HTMLElement
	return within(container)
}

describe('DetailsSection', () => {
	it('starts the doors and seats rows at 1', () => {
		render(<TestWrapper />)
		open()

		for (const label of ['Doors', 'Seats']) {
			const pills = row(label).getAllByRole('radio')
			expect(pills.map((pill) => pill.textContent)).not.toContain('0')
			expect(pills[0]).toHaveTextContent('1')
		}
	})

	it('leaves previous owners unselected by default', () => {
		render(<TestWrapper />)
		open()

		const pills = row('Previous Owners').getAllByRole('radio')
		expect(pills.every((pill) => pill.getAttribute('aria-checked') === 'false')).toBe(true)
	})

	it('deselects previous owners back to unknown when the active pill is clicked', () => {
		const onFieldBlur = vi.fn()
		render(<TestWrapper onFieldBlur={onFieldBlur} defaults={{ previousOwners: 2 }} />)
		open()

		const owners = row('Previous Owners')
		const two = owners.getByRole('radio', { name: '2' })
		expect(two).toHaveAttribute('aria-checked', 'true')

		fireEvent.click(two)
		expect(owners.getByRole('radio', { name: '2' })).toHaveAttribute('aria-checked', 'false')
		expect(onFieldBlur).toHaveBeenCalledWith('previousOwners')
	})

	it('commits a custom numeric value from the plus control', () => {
		const onFieldBlur = vi.fn()
		render(<TestWrapper onFieldBlur={onFieldBlur} />)
		open()

		const axles = row('Axles')
		fireEvent.click(axles.getByRole('button', { name: 'Add a different number of axles' }))
		const input = axles.getByRole('spinbutton', { name: 'Add a different number of axles' })
		fireEvent.change(input, { target: { value: '6' } })
		fireEvent.keyDown(input, { key: 'Enter' })

		expect(onFieldBlur).toHaveBeenCalledWith('axles')
		expect(axles.getByText('6')).toBeInTheDocument()
	})

	it('commits a custom label and selects it on a type row', () => {
		const onFieldBlur = vi.fn()
		render(<TestWrapper onFieldBlur={onFieldBlur} />)
		open()

		const types = row('Vehicle Type')
		fireEvent.click(types.getByRole('button', { name: 'Add vehicle type' }))
		const input = types.getByRole('textbox', { name: 'Add vehicle type' })
		fireEvent.change(input, { target: { value: 'Pickup' } })
		fireEvent.keyDown(input, { key: 'Enter' })

		expect(onFieldBlur).toHaveBeenCalledWith('vehicleType')
		expect(types.getByRole('radio', { name: 'Pickup' })).toHaveAttribute('aria-checked', 'true')
	})

	it('disables every pill and plus control on a locked report', () => {
		render(<TestWrapper disabled />)
		open()

		for (const control of screen.getAllByRole('radio')) {
			expect(control).toBeDisabled()
		}
		for (const control of screen.getAllByRole('button', { name: /^Add / })) {
			expect(control).toBeDisabled()
		}
	})
})
