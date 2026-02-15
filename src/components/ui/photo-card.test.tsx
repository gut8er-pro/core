import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PhotoCard } from './photo-card'

describe('PhotoCard', () => {
	it('renders image', () => {
		render(<PhotoCard src="/test.jpg" alt="Test photo" />)
		const img = screen.getByAltText('Test photo')
		expect(img).toBeInTheDocument()
		expect(img).toHaveAttribute('src', '/test.jpg')
	})

	it('renders with default alt text', () => {
		render(<PhotoCard src="/test.jpg" />)
		expect(screen.getByAltText('Photo')).toBeInTheDocument()
	})

	it('renders grid variant', () => {
		render(<PhotoCard src="/test.jpg" variant="grid" />)
		const container = screen.getByAltText('Photo').parentElement
		expect(container?.className).toContain('aspect-[4/3]')
	})

	it('renders thumbnail variant', () => {
		render(<PhotoCard src="/test.jpg" variant="thumbnail" />)
		const container = screen.getByAltText('Photo').parentElement
		expect(container?.className).toContain('h-16')
	})

	it('shows selected ring', () => {
		render(<PhotoCard src="/test.jpg" selected />)
		const container = screen.getByAltText('Photo').parentElement
		expect(container?.className).toContain('ring-primary')
	})

	it('shows watermark', () => {
		render(<PhotoCard src="/test.jpg" watermark />)
		expect(screen.getByText('Gut8erPRO')).toBeInTheDocument()
	})

	it('renders edit and delete buttons on grid variant', () => {
		render(
			<PhotoCard src="/test.jpg" variant="grid" onEdit={() => {}} onDelete={() => {}} />,
		)
		expect(screen.getByLabelText('Edit photo')).toBeInTheDocument()
		expect(screen.getByLabelText('Delete photo')).toBeInTheDocument()
	})

	it('calls onEdit when edit button clicked', async () => {
		const user = userEvent.setup()
		const onEdit = vi.fn()
		render(<PhotoCard src="/test.jpg" variant="grid" onEdit={onEdit} />)
		await user.click(screen.getByLabelText('Edit photo'))
		expect(onEdit).toHaveBeenCalledOnce()
	})

	it('calls onDelete when delete button clicked', async () => {
		const user = userEvent.setup()
		const onDelete = vi.fn()
		render(<PhotoCard src="/test.jpg" variant="grid" onDelete={onDelete} />)
		await user.click(screen.getByLabelText('Delete photo'))
		expect(onDelete).toHaveBeenCalledOnce()
	})

	it('does not show action buttons on thumbnail variant', () => {
		render(
			<PhotoCard
				src="/test.jpg"
				variant="thumbnail"
				onEdit={() => {}}
				onDelete={() => {}}
			/>,
		)
		expect(screen.queryByLabelText('Edit photo')).not.toBeInTheDocument()
	})
})
