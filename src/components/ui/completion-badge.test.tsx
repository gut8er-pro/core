import { render, screen } from '@/test/test-utils'
import { describe, expect, it } from 'vitest'
import { CompletionBadge } from './completion-badge'

describe('CompletionBadge', () => {
	it('renders percentage with default label', () => {
		render(<CompletionBadge percentage={50} />)
		expect(screen.getByText('50% Complete')).toBeInTheDocument()
	})

	it('renders percentage with custom label', () => {
		render(<CompletionBadge percentage={75} label="Done" />)
		expect(screen.getByText('75% Done')).toBeInTheDocument()
	})

	it('renders 0%', () => {
		render(<CompletionBadge percentage={0} />)
		expect(screen.getByText('0% Complete')).toBeInTheDocument()
	})

	it('renders 100%', () => {
		render(<CompletionBadge percentage={100} />)
		expect(screen.getByText('100% Complete')).toBeInTheDocument()
	})

	it('applies custom className', () => {
		render(<CompletionBadge percentage={50} className="custom-class" />)
		const badge = screen.getByText('50% Complete')
		expect(badge.className).toContain('custom-class')
	})
})
