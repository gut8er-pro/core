import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VehicleDiagram, PaintLegend } from './vehicle-diagram'

describe('VehicleDiagram', () => {
	it('renders damage diagram by default', () => {
		render(<VehicleDiagram />)
		expect(screen.getByLabelText('Vehicle damage diagram')).toBeInTheDocument()
	})

	it('renders paint diagram in paint mode', () => {
		render(<VehicleDiagram mode="paint" />)
		expect(screen.getByLabelText('Vehicle paint diagram')).toBeInTheDocument()
	})

	it('renders markers', () => {
		const markers = [
			{ id: '1', x: 50, y: 50, comment: 'Dent on hood' },
			{ id: '2', x: 30, y: 70, comment: 'Scratch on door' },
		]
		render(<VehicleDiagram markers={markers} />)
		expect(screen.getByLabelText('Damage marker: Dent on hood')).toBeInTheDocument()
		expect(screen.getByLabelText('Damage marker: Scratch on door')).toBeInTheDocument()
	})

	it('renders paint markers with thickness labels', () => {
		const markers = [
			{ id: '1', x: 50, y: 50, value: 120 },
			{ id: '2', x: 30, y: 70, value: 450 },
		]
		render(<VehicleDiagram mode="paint" markers={markers} />)
		expect(screen.getByLabelText('Paint: 120µm')).toBeInTheDocument()
		expect(screen.getByLabelText('Paint: 450µm')).toBeInTheDocument()
	})

	it('calls onMarkerClick when marker clicked', async () => {
		const user = userEvent.setup()
		const onMarkerClick = vi.fn()
		const markers = [{ id: '1', x: 50, y: 50, comment: 'Dent' }]
		render(<VehicleDiagram markers={markers} onMarkerClick={onMarkerClick} />)
		await user.click(screen.getByLabelText('Damage marker: Dent'))
		expect(onMarkerClick).toHaveBeenCalledWith(markers[0])
	})

	it('shows paint legend in paint mode', () => {
		render(<VehicleDiagram mode="paint" />)
		expect(screen.getByText('<70µm')).toBeInTheDocument()
		expect(screen.getByText('≥70µm')).toBeInTheDocument()
		expect(screen.getByText('>160µm')).toBeInTheDocument()
		expect(screen.getByText('>300µm')).toBeInTheDocument()
		expect(screen.getByText('>700µm')).toBeInTheDocument()
	})

	it('does not show legend in damages mode', () => {
		render(<VehicleDiagram mode="damages" />)
		expect(screen.queryByText('<70µm')).not.toBeInTheDocument()
	})
})

describe('PaintLegend', () => {
	it('renders all 5 color labels', () => {
		render(<PaintLegend />)
		expect(screen.getByText('<70µm')).toBeInTheDocument()
		expect(screen.getByText('≥70µm')).toBeInTheDocument()
		expect(screen.getByText('>160µm')).toBeInTheDocument()
		expect(screen.getByText('>300µm')).toBeInTheDocument()
		expect(screen.getByText('>700µm')).toBeInTheDocument()
	})
})
