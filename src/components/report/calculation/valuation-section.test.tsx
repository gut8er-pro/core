import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@/test/test-utils'
import { CALCULATION_DEFAULTS } from './form-data'
import type { CalculationFormData } from './types'
import { ValuationSection, type ValuationSectionProps } from './valuation-section'

type HarnessProps = Pick<ValuationSectionProps, 'datConnected' | 'onOpenDat'>

/** The section is form-driven; only the DAT wiring is under test here. */
function Harness(props: HarnessProps) {
	const { register, control, formState } = useForm<CalculationFormData>({
		defaultValues: CALCULATION_DEFAULTS,
	})
	return (
		<ValuationSection register={register} control={control} errors={formState.errors} {...props} />
	)
}

describe('ValuationSection', () => {
	it('opens the DAT modal from Quick Valuation when an account is connected', () => {
		const onOpenDat = vi.fn()
		render(<Harness datConnected onOpenDat={onOpenDat} />)

		fireEvent.click(screen.getByRole('button', { name: 'Quick Valuation' }))

		expect(onOpenDat).toHaveBeenCalledTimes(1)
		expect(screen.queryByText(/No DAT account is connected/i)).not.toBeInTheDocument()
	})

	it('opens the DAT modal from Detail Valuation too', () => {
		const onOpenDat = vi.fn()
		render(<Harness datConnected onOpenDat={onOpenDat} />)

		fireEvent.click(screen.getByRole('button', { name: 'Detail Valuation' }))

		expect(onOpenDat).toHaveBeenCalledTimes(1)
	})

	it('says why Quick Valuation cannot run instead of going silent', () => {
		const onOpenDat = vi.fn()
		render(<Harness datConnected={false} onOpenDat={onOpenDat} />)

		fireEvent.click(screen.getByRole('button', { name: 'Quick Valuation' }))

		expect(onOpenDat).not.toHaveBeenCalled()
		expect(screen.getByText(/No DAT account is connected/i)).toBeInTheDocument()
	})

	it('says why Detail Valuation cannot run instead of going silent', () => {
		render(<Harness datConnected={false} />)

		fireEvent.click(screen.getByRole('button', { name: 'Detail Valuation' }))

		expect(screen.getByText(/No DAT account is connected/i)).toBeInTheDocument()
	})

	it('names the missing DAT calculation when connected but nothing can be opened', () => {
		render(<Harness datConnected />)

		fireEvent.click(screen.getByRole('button', { name: 'Quick Valuation' }))

		expect(screen.getByText(/Run the DAT calculation first/i)).toBeInTheDocument()
	})

	it('clears the not-connected hint once DAT is available', () => {
		const onOpenDat = vi.fn()
		const { rerender } = render(<Harness datConnected={false} onOpenDat={onOpenDat} />)

		fireEvent.click(screen.getByRole('button', { name: 'Quick Valuation' }))
		expect(screen.getByText(/No DAT account is connected/i)).toBeInTheDocument()

		rerender(<Harness datConnected onOpenDat={onOpenDat} />)
		fireEvent.click(screen.getByRole('button', { name: 'Quick Valuation' }))

		expect(screen.queryByText(/No DAT account is connected/i)).not.toBeInTheDocument()
		expect(onOpenDat).toHaveBeenCalledTimes(1)
	})
})
