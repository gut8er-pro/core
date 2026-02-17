import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { PhotoGrid } from './photo-grid'
import type { Photo } from '@/hooks/use-photos'

const mockPhotos: Photo[] = [
	{
		id: 'p1',
		reportId: 'r1',
		url: 'https://example.com/photo1.jpg',
		thumbnailUrl: 'https://example.com/thumb1.jpg',
		previewUrl: null,
		aiUrl: null,
		filename: 'damage-front.jpg',
		type: 'DAMAGE_OVERVIEW',
		aiClassification: null,
		aiDescription: null,
		order: 0,
		uploadedAt: '2024-01-01T00:00:00Z',
		annotations: [],
	},
	{
		id: 'p2',
		reportId: 'r1',
		url: 'https://example.com/photo2.jpg',
		thumbnailUrl: null,
		previewUrl: null,
		aiUrl: null,
		filename: 'vin-plate.jpg',
		type: null,
		aiClassification: null,
		aiDescription: null,
		order: 1,
		uploadedAt: '2024-01-01T00:00:00Z',
		annotations: [],
	},
]

describe('PhotoGrid', () => {
	it('renders empty state when no photos', () => {
		render(<PhotoGrid photos={[]} />)
		expect(screen.getByText('No photos uploaded yet')).toBeInTheDocument()
	})

	it('renders photo cards for each photo', () => {
		render(<PhotoGrid photos={mockPhotos} />)
		expect(screen.getByAltText('damage-front.jpg')).toBeInTheDocument()
		expect(screen.getByAltText('vin-plate.jpg')).toBeInTheDocument()
	})

	it('calls onSelect when photo is clicked', async () => {
		const user = userEvent.setup()
		const onSelect = vi.fn()
		render(<PhotoGrid photos={mockPhotos} onSelect={onSelect} />)

		await user.click(screen.getByAltText('damage-front.jpg'))
		expect(onSelect).toHaveBeenCalledWith('p1')
	})

	it('calls onDelete with photo id', async () => {
		const user = userEvent.setup()
		const onDelete = vi.fn()
		render(<PhotoGrid photos={mockPhotos} onDelete={onDelete} />)

		const deleteButtons = screen.getAllByLabelText('Delete photo')
		await user.click(deleteButtons[0]!)
		expect(onDelete).toHaveBeenCalledWith('p1')
	})

	it('shows selected state on matching photo', () => {
		render(<PhotoGrid photos={mockPhotos} selectedId="p1" />)
		const selectedImg = screen.getByAltText('damage-front.jpg')
		const container = selectedImg.closest('.group')
		expect(container?.className).toContain('ring-primary')
	})
})
