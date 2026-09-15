import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@/test/test-utils'
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

function TestWrapper({ lineItems }: { lineItems: LineItem[] }) {
	const methods = useForm<InvoiceFormData>({
		defaultValues: { ...INVOICE_DEFAULTS, lineItems },
	})
	return (
		<LineItemsSection
			register={methods.register}
			control={methods.control}
			errors={methods.formState.errors}
		/>
	)
}

function amountCell(expected: string) {
	return screen.getByText(
		(content, element) => element?.tagName === 'SPAN' && content.replace(/ /g, ' ') === expected,
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

	it('treats a row without a quantity as a single unit', () => {
		render(<TestWrapper lineItems={[{ ...LINE_ITEM, rate: '250', quantity: '' }]} />)
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
