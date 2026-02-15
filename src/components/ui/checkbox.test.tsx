import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from './checkbox'

describe('Checkbox', () => {
	it('renders checkbox', () => {
		render(<Checkbox aria-label="Accept terms" />)
		expect(screen.getByRole('checkbox')).toBeInTheDocument()
	})

	it('handles checked change', async () => {
		const user = userEvent.setup()
		const onCheckedChange = vi.fn()
		render(<Checkbox aria-label="Accept terms" onCheckedChange={onCheckedChange} />)
		await user.click(screen.getByRole('checkbox'))
		expect(onCheckedChange).toHaveBeenCalledWith(true)
	})

	it('renders checked state', () => {
		render(<Checkbox aria-label="Accept terms" checked />)
		expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'checked')
	})

	it('renders unchecked state', () => {
		render(<Checkbox aria-label="Accept terms" />)
		expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'unchecked')
	})

	it('renders disabled state', () => {
		render(<Checkbox aria-label="Accept terms" disabled />)
		expect(screen.getByRole('checkbox')).toBeDisabled()
	})
})
