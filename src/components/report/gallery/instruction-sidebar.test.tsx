import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { InstructionSidebar } from './instruction-sidebar'

describe('InstructionSidebar', () => {
	it('renders "Photo Tips" heading', () => {
		render(<InstructionSidebar />)
		expect(screen.getByText('Photo Tips')).toBeInTheDocument()
	})

	it('renders all 6 tips', () => {
		render(<InstructionSidebar />)
		expect(
			screen.getByText('Take photos in good lighting'),
		).toBeInTheDocument()
		expect(screen.getByText('Avoid using flash')).toBeInTheDocument()
		expect(
			screen.getByText('Capture all 4 diagonal angles'),
		).toBeInTheDocument()
		expect(
			screen.getByText('Include close-ups of all damage'),
		).toBeInTheDocument()
		expect(
			screen.getByText('Photograph VIN plate and registration'),
		).toBeInTheDocument()
		expect(
			screen.getByText('Maximum 20 photos per report'),
		).toBeInTheDocument()
	})

	it('renders "Suggested Photos" section with photo type labels', () => {
		render(<InstructionSidebar />)
		expect(screen.getByText('Suggested Photos')).toBeInTheDocument()
		expect(screen.getByText('Front Left')).toBeInTheDocument()
		expect(screen.getByText('Front Right')).toBeInTheDocument()
		expect(screen.getByText('Rear Left')).toBeInTheDocument()
		expect(screen.getByText('Rear Right')).toBeInTheDocument()
		expect(screen.getByText('VIN Plate')).toBeInTheDocument()
		expect(screen.getByText('Registration')).toBeInTheDocument()
		expect(screen.getByText('Damage Overview')).toBeInTheDocument()
		expect(screen.getByText('Damage Detail')).toBeInTheDocument()
	})
})
