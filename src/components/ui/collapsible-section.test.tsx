import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CollapsibleSection } from './collapsible-section'

describe('CollapsibleSection', () => {
	it('renders title', () => {
		render(
			<CollapsibleSection title="Vehicle Info">
				<p>Content here</p>
			</CollapsibleSection>,
		)
		expect(screen.getByText('Vehicle Info')).toBeInTheDocument()
	})

	it('hides content by default', () => {
		render(
			<CollapsibleSection title="Vehicle Info">
				<p>Hidden content</p>
			</CollapsibleSection>,
		)
		// Radix accordion removes closed content from DOM
		expect(screen.queryByText('Hidden content')).not.toBeInTheDocument()
	})

	it('shows content when defaultOpen', () => {
		render(
			<CollapsibleSection title="Vehicle Info" defaultOpen>
				<p>Visible content</p>
			</CollapsibleSection>,
		)
		expect(screen.getByText('Visible content')).toBeVisible()
	})

	it('toggles content on click', async () => {
		const user = userEvent.setup()
		render(
			<CollapsibleSection title="Vehicle Info">
				<p>Toggle me</p>
			</CollapsibleSection>,
		)
		await user.click(screen.getByText('Vehicle Info'))
		expect(screen.getByText('Toggle me')).toBeVisible()
	})

	it('renders info icon when info prop is true', () => {
		render(
			<CollapsibleSection title="Vehicle Info" info>
				<p>Content</p>
			</CollapsibleSection>,
		)
		const trigger = screen.getByRole('button')
		const svgs = trigger.querySelectorAll('svg')
		// Should have info icon + chevron
		expect(svgs.length).toBeGreaterThanOrEqual(2)
	})

	it('has proper ARIA attributes', () => {
		render(
			<CollapsibleSection title="Vehicle Info">
				<p>Content</p>
			</CollapsibleSection>,
		)
		const trigger = screen.getByRole('button')
		expect(trigger).toHaveAttribute('aria-expanded', 'false')
	})
})
