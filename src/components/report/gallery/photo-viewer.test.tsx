import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { PhotoViewer } from './photo-viewer'
import type { Photo } from '@/hooks/use-photos'

const mockPhoto: Photo = {
	id: 'p1',
	reportId: 'r1',
	url: 'https://example.com/photo1.jpg',
	thumbnailUrl: 'https://example.com/thumb1.jpg',
	previewUrl: null,
	aiUrl: null,
	annotatedUrl: null,
	filename: 'damage-front.jpg',
	type: 'DAMAGE_OVERVIEW',
	aiClassification: null,
	aiDescription: null,
	order: 0,
	uploadedAt: '2024-01-01T00:00:00Z',
	annotations: [],
}

describe('PhotoViewer', () => {
	it('shows empty state when photo is null', () => {
		render(<PhotoViewer photo={null} />)
		expect(screen.getByText('Select a photo to view')).toBeInTheDocument()
	})

	it('renders photo image', () => {
		render(<PhotoViewer photo={mockPhoto} />)
		expect(screen.getByAltText('damage-front.jpg')).toBeInTheDocument()
	})

	it('shows floating action buttons (Annotate, Delete)', () => {
		render(
			<PhotoViewer
				photo={mockPhoto}
				onAnnotate={vi.fn()}
				onDelete={vi.fn()}
			/>,
		)
		expect(screen.getByLabelText('Annotate photo')).toBeInTheDocument()
		expect(screen.getByLabelText('Delete photo')).toBeInTheDocument()
	})

	it('shows watermark', () => {
		render(<PhotoViewer photo={mockPhoto} />)
		expect(screen.getByText('Gut8erPRO')).toBeInTheDocument()
	})

	it('calls onDelete when delete clicked', async () => {
		const user = userEvent.setup()
		const onDelete = vi.fn()
		render(<PhotoViewer photo={mockPhoto} onDelete={onDelete} />)

		await user.click(screen.getByLabelText('Delete photo'))
		expect(onDelete).toHaveBeenCalledOnce()
	})

	it('calls onAnnotate when annotate clicked', async () => {
		const user = userEvent.setup()
		const onAnnotate = vi.fn()
		render(<PhotoViewer photo={mockPhoto} onAnnotate={onAnnotate} />)

		await user.click(screen.getByLabelText('Annotate photo'))
		expect(onAnnotate).toHaveBeenCalledOnce()
	})

	it('calls onAnnotate when photo image clicked', async () => {
		const user = userEvent.setup()
		const onAnnotate = vi.fn()
		render(<PhotoViewer photo={mockPhoto} onAnnotate={onAnnotate} />)

		await user.click(screen.getByAltText('damage-front.jpg'))
		expect(onAnnotate).toHaveBeenCalledOnce()
	})
})
