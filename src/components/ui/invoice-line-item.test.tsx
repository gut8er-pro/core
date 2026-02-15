import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InvoiceLineItem, formatEUR } from './invoice-line-item'

describe('InvoiceLineItem', () => {
	it('renders description', () => {
		render(
			<InvoiceLineItem description="Basic Fees" rate={124} amount={124} />,
		)
		expect(screen.getByText('Basic Fees')).toBeInTheDocument()
	})

	it('renders special feature', () => {
		render(
			<InvoiceLineItem
				description="Photos"
				specialFeature="10 Photos / Per Photo 1.5€"
				rate={1.5}
				amount={15}
			/>,
		)
		expect(screen.getByText('10 Photos / Per Photo 1.5€')).toBeInTheDocument()
	})

	it('renders formatted amount', () => {
		render(
			<InvoiceLineItem description="Basic Fees" rate={124} amount={124} />,
		)
		expect(screen.getByLabelText('Amount')).toHaveTextContent('124,00')
	})

	it('renders lump sum badge', () => {
		render(
			<InvoiceLineItem description="Travel" rate={40} amount={40} isLumpSum />,
		)
		expect(screen.getByText('Lump Sum')).toBeInTheDocument()
	})

	it('renders delete button when onDelete provided', () => {
		render(
			<InvoiceLineItem description="Test" rate={10} amount={10} onDelete={() => {}} />,
		)
		expect(screen.getByLabelText('Delete line item')).toBeInTheDocument()
	})

	it('calls onDelete when delete clicked', async () => {
		const user = userEvent.setup()
		const onDelete = vi.fn()
		render(
			<InvoiceLineItem description="Test" rate={10} amount={10} onDelete={onDelete} />,
		)
		await user.click(screen.getByLabelText('Delete line item'))
		expect(onDelete).toHaveBeenCalledOnce()
	})

	it('renders editable inputs when editable', () => {
		render(
			<InvoiceLineItem description="Test" rate={10} amount={10} editable />,
		)
		expect(screen.getByLabelText('Description')).toBeInTheDocument()
		expect(screen.getByLabelText('Rate')).toBeInTheDocument()
	})

	it('renders read-only when not editable', () => {
		render(
			<InvoiceLineItem description="Test" rate={10} amount={10} />,
		)
		expect(screen.queryByLabelText('Description')).not.toBeInTheDocument()
	})
})

describe('formatEUR', () => {
	it('formats with 2 decimal places', () => {
		expect(formatEUR(124)).toContain('124')
	})

	it('formats zero', () => {
		expect(formatEUR(0)).toContain('0')
	})

	it('formats decimal values', () => {
		const formatted = formatEUR(1.5)
		expect(formatted).toContain('1,50')
	})
})
