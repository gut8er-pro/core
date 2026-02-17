import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { InstructionSidebar } from './instruction-sidebar'

describe('InstructionSidebar', () => {
	it('renders "Instruction" heading', () => {
		render(<InstructionSidebar />)
		expect(screen.getByText('Instruction')).toBeInTheDocument()
	})

	it('renders all 3 instruction items', () => {
		render(<InstructionSidebar />)
		expect(screen.getByText('Good lighting or use of flash')).toBeInTheDocument()
		expect(screen.getByText('JPG or PNG format')).toBeInTheDocument()
		expect(screen.getByText('Maximum 20 images')).toBeInTheDocument()
	})

	it('renders "Suggested Photos" section with category labels', () => {
		render(<InstructionSidebar />)
		expect(screen.getByText('Suggested Photos')).toBeInTheDocument()
		expect(screen.getByText('Vehicle Diagonals')).toBeInTheDocument()
		expect(screen.getByText('Damage Overview')).toBeInTheDocument()
		expect(screen.getByText('Document Shot')).toBeInTheDocument()
	})

	it('renders category descriptions', () => {
		render(<InstructionSidebar />)
		expect(screen.getByText('Front and rear diagonal photos of the vehicle')).toBeInTheDocument()
		expect(screen.getByText('Detailed close-ups of all damaged areas')).toBeInTheDocument()
		expect(screen.getByText('Photos of all relevant vehicle documents')).toBeInTheDocument()
	})

	it('renders AI Analysis card when generationSummary is provided', () => {
		render(
			<InstructionSidebar
				generationSummary={{
					totalFieldsFilled: 19,
					damageMarkersPlaced: 2,
					photosProcessed: 5,
					classifications: { overview: 2, damage: 1, document: 1, vin: 1 },
					warnings: [],
				}}
			/>,
		)
		expect(screen.getByText('AI Analysis')).toBeInTheDocument()
		expect(screen.getByText('19')).toBeInTheDocument()
		expect(screen.getByText('2')).toBeInTheDocument()
		expect(screen.getByText('5')).toBeInTheDocument()
	})

	it('shows category counts from persisted summary when no classifications map', () => {
		render(
			<InstructionSidebar
				generationSummary={{
					totalFieldsFilled: 10,
					damageMarkersPlaced: 0,
					photosProcessed: 3,
					classifications: { overview: 2, damage: 1 },
					warnings: [],
				}}
			/>,
		)
		expect(screen.getByText('2 photos')).toBeInTheDocument()
		expect(screen.getByText('1 photo')).toBeInTheDocument()
	})
})
