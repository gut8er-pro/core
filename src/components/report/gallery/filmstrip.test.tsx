import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { Filmstrip } from './filmstrip'
import type { Photo } from '@/hooks/use-photos'

const mockPhotos: Photo[] = [
	{
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
	},
	{
		id: 'p2',
		reportId: 'r1',
		url: 'https://example.com/photo2.jpg',
		thumbnailUrl: null,
		previewUrl: null,
		aiUrl: null,
		annotatedUrl: null,
		filename: 'vin-plate.jpg',
		type: null,
		aiClassification: null,
		aiDescription: null,
		order: 1,
		uploadedAt: '2024-01-01T00:00:00Z',
		annotations: [],
	},
]

describe('Filmstrip', () => {
	it('returns null when no photos', () => {
		const { container } = render(<Filmstrip photos={[]} />)
		expect(container.innerHTML).toBe('')
	})

	it('renders thumbnail for each photo', () => {
		render(<Filmstrip photos={mockPhotos} />)
		expect(screen.getByAltText('damage-front.jpg')).toBeInTheDocument()
		expect(screen.getByAltText('vin-plate.jpg')).toBeInTheDocument()
	})

	it('shows add button when onAdd provided', () => {
		render(<Filmstrip photos={mockPhotos} onAdd={vi.fn()} />)
		expect(screen.getByLabelText('Add more photos')).toBeInTheDocument()
	})

	it('calls onSelect when thumbnail clicked', async () => {
		const user = userEvent.setup()
		const onSelect = vi.fn()
		render(<Filmstrip photos={mockPhotos} onSelect={onSelect} />)

		await user.click(screen.getByAltText('vin-plate.jpg'))
		expect(onSelect).toHaveBeenCalledWith('p2')
	})
})
