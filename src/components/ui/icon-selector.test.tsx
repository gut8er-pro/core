import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { Car, Zap, Fuel } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { IconSelector } from './icon-selector'

const options = [
	{ value: 'sedan', icon: Car, label: 'Sedan' },
	{ value: 'electric', icon: Zap, label: 'Electric' },
	{ value: 'diesel', icon: Fuel, label: 'Diesel' },
]

describe('IconSelector', () => {
	it('renders all options with labels', () => {
		render(<IconSelector options={options} selected="sedan" onChange={() => {}} />)
		expect(screen.getByText('Sedan')).toBeInTheDocument()
		expect(screen.getByText('Electric')).toBeInTheDocument()
		expect(screen.getByText('Diesel')).toBeInTheDocument()
	})

	it('applies selected styling', () => {
		render(<IconSelector options={options} selected="sedan" onChange={() => {}} />)
		const selected = screen.getByRole('radio', { checked: true })
		expect(selected.className).toContain('border-primary')
		expect(selected.className).toContain('bg-primary-light')
	})

	it('applies unselected styling', () => {
		render(<IconSelector options={options} selected="sedan" onChange={() => {}} />)
		const unselected = screen.getAllByRole('radio', { checked: false })
		expect(unselected[0]?.className).toContain('border-border')
	})

	it('calls onChange when clicked', async () => {
		const user = userEvent.setup()
		const onChange = vi.fn()
		render(<IconSelector options={options} selected="sedan" onChange={onChange} />)
		await user.click(screen.getByText('Electric'))
		expect(onChange).toHaveBeenCalledWith('electric')
	})

	it('has radiogroup role', () => {
		render(<IconSelector options={options} selected="sedan" onChange={() => {}} />)
		expect(screen.getByRole('radiogroup')).toBeInTheDocument()
	})

	it('uses aria-label from option label', () => {
		render(<IconSelector options={options} selected="sedan" onChange={() => {}} />)
		expect(screen.getByLabelText('Sedan')).toBeInTheDocument()
	})

	it('works without labels using value as aria-label', () => {
		const noLabelOptions = [
			{ value: 'sedan', icon: Car },
			{ value: 'electric', icon: Zap },
		]
		render(<IconSelector options={noLabelOptions} selected="sedan" onChange={() => {}} />)
		expect(screen.getByLabelText('sedan')).toBeInTheDocument()
	})
})
