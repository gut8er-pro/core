import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { VEHICLE_DEFAULTS } from '@/components/report/vehicle/form-data'
import { IdentificationSection } from '@/components/report/vehicle/identification-section'
import type { VehicleFormData } from '@/components/report/vehicle/types'
import { render, screen } from '@/test/test-utils'
import { MissingFieldsProvider, MissingInfoProvider, useMissingInfoToggle } from './missing-info'

/** The toggle lives in the details layout; this stands in for it. */
function Toggle() {
	const { showMissing, setShowMissing } = useMissingInfoToggle()
	return (
		<button type="button" onClick={() => setShowMissing(!showMissing)}>
			toggle
		</button>
	)
}

function TestScreen() {
	const { register, control, formState } = useForm<VehicleFormData>({
		defaultValues: { ...VEHICLE_DEFAULTS },
	})

	return (
		<MissingInfoProvider>
			<Toggle />
			<MissingFieldsProvider tab="vehicle" reportType="HS" control={control}>
				<IdentificationSection register={register} control={control} errors={formState.errors} />
			</MissingFieldsProvider>
		</MissingInfoProvider>
	)
}

describe('missing information review mode', () => {
	it('marks nothing until the toggle is on', () => {
		render(<TestScreen />)

		expect(document.querySelectorAll('[data-missing="true"]')).toHaveLength(0)
	})

	it('marks the empty required fields and leaves the optional ones alone', async () => {
		const user = userEvent.setup()
		render(<TestScreen />)

		await user.click(screen.getByRole('button', { name: 'toggle' }))

		expect(document.querySelector('input[name="vin"]')).toHaveAttribute('data-missing', 'true')
		expect(document.querySelector('input[name="manufacturer"]')).toHaveAttribute(
			'data-missing',
			'true',
		)
		expect(document.querySelector('input[name="subType"]')).not.toHaveAttribute('data-missing')
	})

	it('clears a mark as soon as its field is filled', async () => {
		const user = userEvent.setup()
		render(<TestScreen />)

		await user.click(screen.getByRole('button', { name: 'toggle' }))
		await user.type(screen.getByPlaceholderText('e.g. WVWZZZ3CZWE123456'), 'WVWZZZ3CZWE123456')

		expect(document.querySelector('input[name="vin"]')).not.toHaveAttribute('data-missing')
	})

	it('counts what a section is still missing on its header', async () => {
		const user = userEvent.setup()
		render(<TestScreen />)

		await user.click(screen.getByRole('button', { name: 'toggle' }))

		// VIN, manufacturer, main type and KBA number.
		expect(screen.getByText('4')).toBeInTheDocument()
	})

	it('stops marking when the toggle goes back off', async () => {
		const user = userEvent.setup()
		render(<TestScreen />)

		await user.click(screen.getByRole('button', { name: 'toggle' }))
		await user.click(screen.getByRole('button', { name: 'toggle' }))

		expect(document.querySelectorAll('[data-missing="true"]')).toHaveLength(0)
	})
})
