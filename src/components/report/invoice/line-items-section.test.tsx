import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@/test/test-utils'
import { INVOICE_DEFAULTS } from './form-data'
import { LineItemsSection } from './line-items-section'
import type { InvoiceFormData } from './types'

type LineItem = InvoiceFormData['lineItems'][number]

const LINE_ITEM: LineItem = {
	description: 'Gutachten',
	specialFeature: '',
	isLumpSum: false,
	rate: '890',
	amount: '',
	quantity: '1',
}

function TestWrapper({
	lineItems,
	onRowsChange,
}: {
	lineItems: LineItem[]
	onRowsChange?: () => void
}) {
	const methods = useForm<InvoiceFormData>({
		defaultValues: { ...INVOICE_DEFAULTS, lineItems },
	})
	return (
		<LineItemsSection
			register={methods.register}
			control={methods.control}
			errors={methods.formState.errors}
			onRowsChange={onRowsChange}
		/>
	)
}

function amountCell(expected: string) {
	return screen.getByText(
		(content, element) => element?.tagName === 'SPAN' && content.replace(/ /g, ' ') === expected,
	)
}

describe('LineItemsSection amount column', () => {
	it('shows the amount the assessor entered as the rate', () => {
		render(<TestWrapper lineItems={[LINE_ITEM]} />)
		expect(amountCell('890,00 €')).toBeInTheDocument()
	})

	it('multiplies the rate by the quantity', () => {
		render(<TestWrapper lineItems={[{ ...LINE_ITEM, rate: '120.50', quantity: '3' }]} />)
		expect(amountCell('361,50 €')).toBeInTheDocument()
	})

	it('counts a per-unit row with no quantity as nothing billed', () => {
		render(<TestWrapper lineItems={[{ ...LINE_ITEM, rate: '250', quantity: '' }]} />)
		expect(amountCell('0,00 €')).toBeInTheDocument()
	})

	it('bills a lump-sum row at the rate, ignoring the quantity', () => {
		render(
			<TestWrapper lineItems={[{ ...LINE_ITEM, isLumpSum: true, rate: '250', quantity: '7' }]} />,
		)
		expect(amountCell('250,00 €')).toBeInTheDocument()
	})

	it('shows zero for a row with no rate', () => {
		render(<TestWrapper lineItems={[{ ...LINE_ITEM, rate: '' }]} />)
		expect(amountCell('0,00 €')).toBeInTheDocument()
	})

	it('amounts each row from its own rate', () => {
		render(
			<TestWrapper
				lineItems={[LINE_ITEM, { ...LINE_ITEM, description: 'Fahrtkosten', rate: '45' }]}
			/>,
		)
		expect(amountCell('890,00 €')).toBeInTheDocument()
		expect(amountCell('45,00 €')).toBeInTheDocument()
	})
})

describe('LineItemsSection per-unit pricing', () => {
	it('offers a quantity input on a per-unit row', () => {
		render(<TestWrapper lineItems={[LINE_ITEM]} />)
		expect(screen.getByRole('spinbutton', { name: 'Quantity' })).toBeInTheDocument()
	})

	it('hides the quantity input once the row is a lump sum', () => {
		render(<TestWrapper lineItems={[{ ...LINE_ITEM, isLumpSum: true }]} />)
		expect(screen.queryByRole('spinbutton', { name: 'Quantity' })).not.toBeInTheDocument()
	})

	it('gives a lump-sum-only default row no lump sum checkbox and no quantity', () => {
		render(
			<TestWrapper
				lineItems={[{ ...LINE_ITEM, description: 'Grundhonorar', specialFeature: 'grundhonorar' }]}
			/>,
		)
		expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
		expect(screen.queryByRole('spinbutton', { name: 'Quantity' })).not.toBeInTheDocument()
	})

	it('keeps the lump sum choice on a default row that allows per-unit pricing', () => {
		render(
			<TestWrapper
				lineItems={[{ ...LINE_ITEM, description: 'Anfahrt', specialFeature: 'anfahrt' }]}
			/>,
		)
		expect(screen.getByRole('checkbox')).toBeInTheDocument()
		expect(screen.getByRole('spinbutton', { name: 'Quantity' })).toBeInTheDocument()
	})
})

describe('LineItemsSection row removal', () => {
	it('removes the row the assessor deleted and reports the change', async () => {
		const onRowsChange = vi.fn()
		render(
			<TestWrapper
				lineItems={[LINE_ITEM, { ...LINE_ITEM, description: 'Fahrtkosten', rate: '45' }]}
				onRowsChange={onRowsChange}
			/>,
		)

		const removeButtons = screen.getAllByRole('button', { name: 'Remove row' })
		expect(removeButtons).toHaveLength(2)

		const [firstRemove] = removeButtons
		if (!firstRemove) throw new Error('expected a remove button')
		fireEvent.click(firstRemove)

		expect(screen.getAllByRole('button', { name: 'Remove row' })).toHaveLength(1)
		expect(amountCell('45,00 €')).toBeInTheDocument()
		await vi.waitFor(() => expect(onRowsChange).toHaveBeenCalled())
	})
})
