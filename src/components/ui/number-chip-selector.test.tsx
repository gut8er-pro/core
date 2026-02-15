import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NumberChipSelector } from './number-chip-selector'

const options = [
	{ value: '2', label: '2' },
	{ value: '3', label: '3' },
	{ value: '4', label: '4' },
	{ value: '5', label: '5' },
]

describe('NumberChipSelector', () => {
	it('renders all options', () => {
		render(<NumberChipSelector options={options} selected="2" onChange={() => {}} />)
		expect(screen.getByText('2')).toBeInTheDocument()
		expect(screen.getByText('3')).toBeInTheDocument()
		expect(screen.getByText('4')).toBeInTheDocument()
		expect(screen.getByText('5')).toBeInTheDocument()
	})

	it('applies selected styling to active option', () => {
		render(<NumberChipSelector options={options} selected="3" onChange={() => {}} />)
		const selected = screen.getByRole('radio', { checked: true })
		expect(selected.className).toContain('bg-primary')
		expect(selected.className).toContain('text-white')
	})

	it('applies unselected styling to inactive options', () => {
		render(<NumberChipSelector options={options} selected="3" onChange={() => {}} />)
		const unselected = screen.getAllByRole('radio', { checked: false })
		expect(unselected[0]?.className).toContain('border-border')
	})

	it('calls onChange when option clicked', async () => {
		const user = userEvent.setup()
		const onChange = vi.fn()
		render(<NumberChipSelector options={options} selected="2" onChange={onChange} />)
		await user.click(screen.getByText('4'))
		expect(onChange).toHaveBeenCalledWith('4')
	})

	it('has radiogroup role', () => {
		render(<NumberChipSelector options={options} selected="2" onChange={() => {}} />)
		expect(screen.getByRole('radiogroup')).toBeInTheDocument()
	})

	it('renders circular chips', () => {
		render(<NumberChipSelector options={options} selected="2" onChange={() => {}} />)
		const chip = screen.getByText('2').closest('button')
		expect(chip?.className).toContain('rounded-full')
		expect(chip?.className).toContain('h-10')
		expect(chip?.className).toContain('w-10')
	})
})
