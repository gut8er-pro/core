import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@/test/test-utils'
import { ACCIDENT_INFO_DEFAULTS } from './form-data'
import type { AccidentInfoFormData } from './types'
import { VisitSection } from './visit-section'

vi.mock('@/hooks/use-settings', () => ({
	useUserSettings: () => ({ data: { firstName: 'Ivan', lastName: 'Vukasinovic' } }),
}))

function TestWrapper({ defaults }: { defaults?: Partial<AccidentInfoFormData> } = {}) {
	const methods = useForm<AccidentInfoFormData>({
		defaultValues: { ...ACCIDENT_INFO_DEFAULTS, ...defaults },
	})
	return (
		<>
			<VisitSection
				register={methods.register}
				control={methods.control}
				errors={methods.formState.errors}
				reportType="OT"
				getValues={methods.getValues}
				setValue={methods.setValue}
			/>
			<output data-testid="present">
				{JSON.stringify(
					methods.watch(['presentExpert', 'presentClient', 'presentWorkshopEmployee']),
				)}
			</output>
		</>
	)
}

function openVisits(defaults?: Partial<AccidentInfoFormData>) {
	render(<TestWrapper defaults={defaults} />)
	fireEvent.click(screen.getByRole('button', { name: /Visits/ }))
}

const CLAIMANT_ADDRESS = {
	claimantStreet: 'Bahnhofstraße 12',
	claimantPostcode: '28195',
	claimantLocation: 'Bremen',
}

const EMPTY_VISIT = {
	type: '',
	street: '',
	postcode: '',
	location: '',
	date: '',
	expert: '',
	vehicleCondition: '',
}

describe('VisitSection present subsection', () => {
	it('names the signed-in assessor rather than a placeholder person', () => {
		openVisits()
		expect(screen.getByText('Expert Ivan Vukasinovic')).toBeInTheDocument()
		expect(screen.queryByText(/Ketn Torres/)).not.toBeInTheDocument()
	})

	it('keeps every attendee checkbox in form state', () => {
		openVisits()
		expect(screen.getByTestId('present')).toHaveTextContent('[false,false,false]')

		fireEvent.click(screen.getByLabelText('Expert Ivan Vukasinovic'))
		fireEvent.click(screen.getByLabelText('Workshop Employee'))

		expect(screen.getByTestId('present')).toHaveTextContent('[true,false,true]')
	})
})

describe('VisitSection address presets', () => {
	function street() {
		return screen.getAllByPlaceholderText('e.g. Musterstraße 123')[0] as HTMLInputElement
	}
	function postcode() {
		return screen.getAllByPlaceholderText('e.g. 10115')[0] as HTMLInputElement
	}
	function location() {
		return screen.getAllByPlaceholderText('Berlin')[0] as HTMLInputElement
	}

	it('seeds the claimant address when Claimant Residence is picked', () => {
		openVisits({ ...CLAIMANT_ADDRESS, visits: [{ ...EMPTY_VISIT }] })

		fireEvent.click(screen.getByText('Claimant Residence'))

		expect(street()).toHaveValue('Bahnhofstraße 12')
		expect(postcode()).toHaveValue('28195')
		expect(location()).toHaveValue('Bremen')
	})

	it('seeds the same single claimant address for Claimant Office', () => {
		openVisits({ ...CLAIMANT_ADDRESS, visits: [{ ...EMPTY_VISIT }] })

		fireEvent.click(screen.getByText('Claimant Office'))

		expect(street()).toHaveValue('Bahnhofstraße 12')
		expect(location()).toHaveValue('Bremen')
	})

	it('never clobbers an address the assessor typed by hand', () => {
		openVisits({
			...CLAIMANT_ADDRESS,
			visits: [{ ...EMPTY_VISIT, street: 'Werksstraße 8', location: 'Hamburg' }],
		})

		fireEvent.click(screen.getByText('Claimant Residence'))

		expect(street()).toHaveValue('Werksstraße 8')
		expect(location()).toHaveValue('Hamburg')
		// The empty one is still fair game.
		expect(postcode()).toHaveValue('28195')
	})

	it('seeds nothing for Other', () => {
		openVisits({ ...CLAIMANT_ADDRESS, visits: [{ ...EMPTY_VISIT }] })

		fireEvent.click(screen.getByText('Other'))

		expect(street()).toHaveValue('')
		expect(location()).toHaveValue('')
	})

	it('seeds nothing when the claimant has no address yet', () => {
		openVisits({ visits: [{ ...EMPTY_VISIT }] })

		fireEvent.click(screen.getByText('Claimant Residence'))

		expect(street()).toHaveValue('')
		expect(postcode()).toHaveValue('')
	})
})
