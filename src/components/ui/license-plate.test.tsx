import { describe, expect, it } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { LicensePlate } from './license-plate'

describe('LicensePlate', () => {
	it('renders plate parts', () => {
		render(<LicensePlate plate="HB-AB 1234" />)
		expect(screen.getByText('HB-AB')).toBeInTheDocument()
		expect(screen.getByText('1234')).toBeInTheDocument()
	})

	it('has accessible label', () => {
		render(<LicensePlate plate="HB-AB 1234" />)
		expect(screen.getByLabelText('License plate: HB-AB 1234')).toBeInTheDocument()
	})

	it('applies custom className', () => {
		render(<LicensePlate plate="HB-AB 1234" className="my-class" />)
		const plate = screen.getByLabelText('License plate: HB-AB 1234')
		expect(plate.className).toContain('my-class')
	})

	it('handles single-word plate', () => {
		render(<LicensePlate plate="ABCDEF" />)
		expect(screen.getByLabelText('License plate: ABCDEF')).toBeInTheDocument()
	})
})
