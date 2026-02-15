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
	filename: 'damage-front.jpg',
	type: 'DAMAGE_OVERVIEW',
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

	it('renders photo filename', () => {
		render(<PhotoViewer photo={mockPhoto} />)
		expect(screen.getByText('damage-front.jpg')).toBeInTheDocument()
	})

	it('shows action buttons (Edit, Annotate, Delete)', () => {
		render(
			<PhotoViewer
				photo={mockPhoto}
				onEdit={vi.fn()}
				onAnnotate={vi.fn()}
				onDelete={vi.fn()}
			/>,
		)
		expect(screen.getByText('Edit')).toBeInTheDocument()
		expect(screen.getByText('Annotate')).toBeInTheDocument()
		expect(screen.getByText('Delete')).toBeInTheDocument()
	})

	it('shows AI description when present', () => {
		const photoWithAI: Photo = {
			...mockPhoto,
			aiDescription: 'Front bumper damage with deep scratches',
		}
		render(<PhotoViewer photo={photoWithAI} />)
		expect(screen.getByText('AI Description')).toBeInTheDocument()
		expect(
			screen.getByText('Front bumper damage with deep scratches'),
		).toBeInTheDocument()
	})

	it('calls onDelete when delete clicked', async () => {
		const user = userEvent.setup()
		const onDelete = vi.fn()
		render(<PhotoViewer photo={mockPhoto} onDelete={onDelete} />)

		await user.click(screen.getByText('Delete'))
		expect(onDelete).toHaveBeenCalledOnce()
	})
})
