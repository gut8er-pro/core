import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'

describe('Card', () => {
	it('renders children', () => {
		render(<Card>Content</Card>)
		expect(screen.getByText('Content')).toBeInTheDocument()
	})

	it('renders default variant with shadow', () => {
		render(<Card data-testid="card">Content</Card>)
		expect(screen.getByTestId('card').className).toContain('shadow-card')
	})

	it('renders selectable variant with button role', () => {
		render(<Card variant="selectable">Select me</Card>)
		expect(screen.getByRole('button')).toBeInTheDocument()
	})

	it('renders selected variant with primary border', () => {
		render(
			<Card variant="selected" data-testid="card">
				Selected
			</Card>,
		)
		const card = screen.getByTestId('card')
		expect(card.className).toContain('border-primary')
		expect(card.className).toContain('bg-primary-light')
	})

	it('renders elevated variant', () => {
		render(
			<Card variant="elevated" data-testid="card">
				Elevated
			</Card>,
		)
		expect(screen.getByTestId('card').className).toContain('shadow-elevated')
	})

	it('renders with different padding sizes', () => {
		const { rerender } = render(
			<Card padding="sm" data-testid="card">
				Small
			</Card>,
		)
		expect(screen.getByTestId('card').className).toContain('p-2')

		rerender(
			<Card padding="md" data-testid="card">
				Medium
			</Card>,
		)
		expect(screen.getByTestId('card').className).toContain('p-4')

		rerender(
			<Card padding="lg" data-testid="card">
				Large
			</Card>,
		)
		expect(screen.getByTestId('card').className).toContain('p-6')
	})

	it('handles click on selectable', async () => {
		const user = userEvent.setup()
		const onClick = vi.fn()
		render(
			<Card variant="selectable" onClick={onClick}>
				Click
			</Card>,
		)
		await user.click(screen.getByRole('button'))
		expect(onClick).toHaveBeenCalledOnce()
	})

	it('renders compound components', () => {
		render(
			<Card>
				<CardHeader>
					<CardTitle>Title</CardTitle>
					<CardDescription>Description</CardDescription>
				</CardHeader>
				<CardContent>Body</CardContent>
				<CardFooter>Footer</CardFooter>
			</Card>,
		)
		expect(screen.getByText('Title')).toBeInTheDocument()
		expect(screen.getByText('Description')).toBeInTheDocument()
		expect(screen.getByText('Body')).toBeInTheDocument()
		expect(screen.getByText('Footer')).toBeInTheDocument()
	})
})
