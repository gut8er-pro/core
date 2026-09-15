import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@/test/test-utils'
import { ACCIDENT_INFO_DEFAULTS } from './form-data'
import type { AccidentInfoFormData } from './types'
import { VisitSection } from './visit-section'

vi.mock('@/hooks/use-settings', () => ({
	useUserSettings: () => ({ data: { firstName: 'Ivan', lastName: 'Vukasinovic' } }),
}))

function TestWrapper() {
	const methods = useForm<AccidentInfoFormData>({ defaultValues: { ...ACCIDENT_INFO_DEFAULTS } })
	return (
		<>
			<VisitSection
				register={methods.register}
				control={methods.control}
				errors={methods.formState.errors}
				reportType="OT"
			/>
			<output data-testid="present">
				{JSON.stringify(
					methods.watch(['presentExpert', 'presentClient', 'presentWorkshopEmployee']),
				)}
			</output>
		</>
	)
}

function openVisits() {
	render(<TestWrapper />)
	fireEvent.click(screen.getByRole('button', { name: /Visits/ }))
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
