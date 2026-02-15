import { render, screen } from '@/test/test-utils'
import { describe, expect, it } from 'vitest'
import { Badge } from './badge'

describe('Badge', () => {
	it('renders children', () => {
		render(<Badge>New</Badge>)
		expect(screen.getByText('New')).toBeInTheDocument()
	})

	it('renders default variant', () => {
		render(<Badge data-testid="badge">Default</Badge>)
		expect(screen.getByTestId('badge').className).toContain('bg-grey-25')
	})

	it('renders primary variant', () => {
		render(
			<Badge variant="primary" data-testid="badge">
				Pro
			</Badge>,
		)
		expect(screen.getByTestId('badge').className).toContain('bg-primary-light')
		expect(screen.getByTestId('badge').className).toContain('text-primary')
	})

	it('renders success variant', () => {
		render(
			<Badge variant="success" data-testid="badge">
				Active
			</Badge>,
		)
		expect(screen.getByTestId('badge').className).toContain('bg-success-light')
	})

	it('renders error variant', () => {
		render(
			<Badge variant="error" data-testid="badge">
				Failed
			</Badge>,
		)
		expect(screen.getByTestId('badge').className).toContain('bg-error-light')
	})

	it('renders outline variant', () => {
		render(
			<Badge variant="outline" data-testid="badge">
				Draft
			</Badge>,
		)
		expect(screen.getByTestId('badge').className).toContain('border-border')
	})
})
