import { render, screen } from '@/test/test-utils'
import { describe, expect, it } from 'vitest'
import { LicensePlate } from './license-plate'

describe('LicensePlate', () => {
	it('renders plate text', () => {
		render(<LicensePlate plate="HB-AB 1234" />)
		expect(screen.getByText('HB-AB 1234')).toBeInTheDocument()
	})

	it('renders default country code D', () => {
		render(<LicensePlate plate="HB-AB 1234" />)
		expect(screen.getByText('D')).toBeInTheDocument()
	})

	it('renders custom country code', () => {
		render(<LicensePlate plate="W-12345" country="A" />)
		expect(screen.getByText('A')).toBeInTheDocument()
	})

	it('renders EU label', () => {
		render(<LicensePlate plate="HB-AB 1234" />)
		expect(screen.getByText('EU')).toBeInTheDocument()
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
})
