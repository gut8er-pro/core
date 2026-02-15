import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TabBar } from './tab-bar'

const tabs = [
	{ key: 'accident', label: 'Accident Info', completion: '3/4' },
	{ key: 'vehicle', label: 'Vehicle', isComplete: true },
	{ key: 'condition', label: 'Condition' },
	{ key: 'calculation', label: 'Calculation' },
	{ key: 'invoice', label: 'Invoice' },
]

describe('TabBar', () => {
	it('renders all tabs', () => {
		render(<TabBar tabs={tabs} activeTab="accident" onTabChange={() => {}} />)
		expect(screen.getByText('Accident Info')).toBeInTheDocument()
		expect(screen.getByText('Vehicle')).toBeInTheDocument()
		expect(screen.getByText('Condition')).toBeInTheDocument()
		expect(screen.getByText('Calculation')).toBeInTheDocument()
		expect(screen.getByText('Invoice')).toBeInTheDocument()
	})

	it('applies active styling to current tab', () => {
		render(<TabBar tabs={tabs} activeTab="accident" onTabChange={() => {}} />)
		const activeTab = screen.getByRole('tab', { name: /Accident Info/i })
		expect(activeTab.className).toContain('bg-black')
		expect(activeTab.className).toContain('text-white')
	})

	it('applies inactive styling to non-active tabs', () => {
		render(<TabBar tabs={tabs} activeTab="accident" onTabChange={() => {}} />)
		const inactiveTab = screen.getByRole('tab', { name: /Condition/i })
		expect(inactiveTab.className).toContain('text-grey-100')
	})

	it('shows completion badge', () => {
		render(<TabBar tabs={tabs} activeTab="accident" onTabChange={() => {}} />)
		expect(screen.getByText('3/4')).toBeInTheDocument()
	})

	it('calls onTabChange when tab clicked', async () => {
		const user = userEvent.setup()
		const onTabChange = vi.fn()
		render(<TabBar tabs={tabs} activeTab="accident" onTabChange={onTabChange} />)
		await user.click(screen.getByRole('tab', { name: /Vehicle/i }))
		expect(onTabChange).toHaveBeenCalledWith('vehicle')
	})

	it('supports keyboard navigation', async () => {
		const user = userEvent.setup()
		render(<TabBar tabs={tabs} activeTab="accident" onTabChange={() => {}} />)
		const firstTab = screen.getByRole('tab', { name: /Accident Info/i })
		firstTab.focus()
		await user.keyboard('{ArrowRight}')
		expect(screen.getByRole('tab', { name: /Vehicle/i })).toHaveFocus()
	})
})
