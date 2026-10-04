import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
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

	it('does not mount collapsed children, so their effects wait for the first expand', async () => {
		const user = userEvent.setup()
		const childEffect = vi.fn()
		function Child() {
			useEffect(childEffect, [])
			return <p>Child</p>
		}
		render(
			<CollapsibleSection title="Vehicle Info">
				<Child />
			</CollapsibleSection>,
		)
		expect(childEffect).not.toHaveBeenCalled()

		await user.click(screen.getByText('Vehicle Info'))
		expect(childEffect).toHaveBeenCalledTimes(1)
	})

	it('runs effects of the component that renders it, even while collapsed', () => {
		const sectionEffect = vi.fn()
		function Section() {
			useEffect(sectionEffect, [])
			return (
				<CollapsibleSection title="Vehicle Info">
					<p>Content</p>
				</CollapsibleSection>
			)
		}
		render(<Section />)
		expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
		expect(sectionEffect).toHaveBeenCalledTimes(1)
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
