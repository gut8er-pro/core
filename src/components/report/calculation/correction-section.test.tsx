import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@/test/test-utils'
import { CorrectionSection } from './correction-section'
import { CALCULATION_DEFAULTS } from './form-data'
import type { CalculationFormData } from './types'

describe('CorrectionSection', () => {
	it('opens the DAT modal when an account is connected', () => {
		const onOpenDat = vi.fn()
		render(<CorrectionSection mode="dat" datConnected onOpenDat={onOpenDat} />)

		fireEvent.click(screen.getByRole('button', { name: /Dat/i }))

		expect(onOpenDat).toHaveBeenCalledTimes(1)
		expect(screen.queryByText(/No DAT account is connected/i)).not.toBeInTheDocument()
	})

	it('says why DAT cannot calculate instead of silently opening it', () => {
		const onOpenDat = vi.fn()
		render(<CorrectionSection mode="dat" datConnected={false} onOpenDat={onOpenDat} />)

		fireEvent.click(screen.getByRole('button', { name: /Dat/i }))

		expect(onOpenDat).not.toHaveBeenCalled()
		expect(screen.getByText(/No DAT account is connected/i)).toBeInTheDocument()
	})

	it('runs the AI calculation from the AI card', () => {
		const onRunAi = vi.fn()
		render(<CorrectionSection mode="dat" onRunAi={onRunAi} />)

		fireEvent.click(screen.getByRole('button', { name: /AI Calculation/i }))

		expect(onRunAi).toHaveBeenCalledTimes(1)
	})

	it('shows progress and blocks a second run while the AI is working', () => {
		const onRunAi = vi.fn()
		render(<CorrectionSection mode="ai" isAiRunning onRunAi={onRunAi} />)

		const card = screen.getByRole('button', { name: /Auto-filling/i })
		expect(card).toBeDisabled()

		fireEvent.click(card)
		expect(onRunAi).not.toHaveBeenCalled()
	})

	it('surfaces the AI result message on the AI card', () => {
		render(<CorrectionSection mode="ai" aiMessage="Auto-filled 5 fields" />)

		expect(screen.getByText('Auto-filled 5 fields')).toBeInTheDocument()
	})

	it('opens the manual correction entry with both amount fields', () => {
		function Harness() {
			const { control } = useForm<CalculationFormData>({
				defaultValues: { ...CALCULATION_DEFAULTS },
			})
			return (
				<CorrectionSection
					mode="manual"
					control={control}
					resultWithoutLabel="Results without repair"
					resultWithLabel="Results with repair"
				/>
			)
		}
		render(<Harness />)

		expect(screen.getByText('Manual correction entry')).toBeInTheDocument()
		expect(screen.getByLabelText('Results without repair')).toBeInTheDocument()
		expect(screen.getByLabelText('Results with repair')).toBeInTheDocument()
	})

	it('reports a manual amount for saving when the field is left', () => {
		const onFieldBlur = vi.fn()
		function Harness() {
			const { control } = useForm<CalculationFormData>({
				defaultValues: { ...CALCULATION_DEFAULTS },
			})
			return (
				<CorrectionSection
					mode="manual"
					control={control}
					onFieldBlur={onFieldBlur}
					resultWithoutLabel="Results without repair"
					resultWithLabel="Results with repair"
				/>
			)
		}
		render(<Harness />)

		const input = screen.getByLabelText('Results without repair')
		fireEvent.change(input, { target: { value: '32500' } })
		fireEvent.blur(input)

		expect(onFieldBlur).toHaveBeenCalledWith('correctionResultWithout')
	})

	it('reports the selected mode back to the page', () => {
		const onModeChange = vi.fn()
		render(<CorrectionSection mode="dat" onModeChange={onModeChange} />)

		fireEvent.click(screen.getByRole('button', { name: /Manual/i }))

		expect(onModeChange).toHaveBeenCalledWith('manual')
	})
})
