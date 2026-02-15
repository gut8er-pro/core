import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToggleSwitch } from './toggle-switch'

describe('ToggleSwitch', () => {
	it('renders label', () => {
		render(<ToggleSwitch label="Show preview" />)
		expect(screen.getByText('Show preview')).toBeInTheDocument()
	})

	it('renders switch element', () => {
		render(<ToggleSwitch label="Show preview" />)
		expect(screen.getByRole('switch')).toBeInTheDocument()
	})

	it('calls onCheckedChange when toggled', async () => {
		const user = userEvent.setup()
		const onCheckedChange = vi.fn()
		render(<ToggleSwitch label="Show preview" onCheckedChange={onCheckedChange} />)
		await user.click(screen.getByRole('switch'))
		expect(onCheckedChange).toHaveBeenCalledWith(true)
	})

	it('renders checked state', () => {
		render(<ToggleSwitch label="Show preview" checked />)
		expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'checked')
	})

	it('renders unchecked state', () => {
		render(<ToggleSwitch label="Show preview" />)
		expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'unchecked')
	})

	it('associates label with switch via htmlFor', () => {
		render(<ToggleSwitch label="Show preview" />)
		const label = screen.getByText('Show preview')
		const switchEl = screen.getByRole('switch')
		expect(label).toHaveAttribute('for', switchEl.id)
	})

	it('renders disabled state', () => {
		render(<ToggleSwitch label="Show preview" disabled />)
		expect(screen.getByRole('switch')).toBeDisabled()
	})
})
