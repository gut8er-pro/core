import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { Camera, Car, FileText, Calculator, Receipt } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { ReportSidebar } from './report-sidebar'

const sections = [
	{ key: 'gallery', label: 'Gallery', icon: Camera },
	{ key: 'accident', label: 'Accident Info', icon: FileText },
	{ key: 'vehicle', label: 'Vehicle', icon: Car },
	{ key: 'calculation', label: 'Calculation', icon: Calculator },
	{ key: 'invoice', label: 'Invoice', icon: Receipt },
]

describe('ReportSidebar', () => {
	it('renders all sections', () => {
		render(<ReportSidebar sections={sections} activeSection="gallery" />)
		expect(screen.getByText('Gallery')).toBeInTheDocument()
		expect(screen.getByText('Accident Info')).toBeInTheDocument()
		expect(screen.getByText('Vehicle')).toBeInTheDocument()
		expect(screen.getByText('Calculation')).toBeInTheDocument()
		expect(screen.getByText('Invoice')).toBeInTheDocument()
	})

	it('marks active section with aria-current', () => {
		render(<ReportSidebar sections={sections} activeSection="gallery" />)
		const activeBtn = screen.getByText('Gallery').closest('button')
		expect(activeBtn).toHaveAttribute('aria-current', 'page')
	})

	it('does not mark inactive sections', () => {
		render(<ReportSidebar sections={sections} activeSection="gallery" />)
		const inactiveBtn = screen.getByText('Vehicle').closest('button')
		expect(inactiveBtn).not.toHaveAttribute('aria-current')
	})

	it('calls onSectionChange on click', async () => {
		const user = userEvent.setup()
		const onSectionChange = vi.fn()
		render(
			<ReportSidebar
				sections={sections}
				activeSection="gallery"
				onSectionChange={onSectionChange}
			/>,
		)
		await user.click(screen.getByText('Vehicle'))
		expect(onSectionChange).toHaveBeenCalledWith('vehicle')
	})

	it('has navigation landmark', () => {
		render(<ReportSidebar sections={sections} activeSection="gallery" />)
		expect(screen.getByRole('navigation', { name: 'Report navigation' })).toBeInTheDocument()
	})

	it('applies primary text to active section', () => {
		render(<ReportSidebar sections={sections} activeSection="gallery" />)
		const activeBtn = screen.getByText('Gallery').closest('button')
		expect(activeBtn?.className).toContain('text-primary')
	})
})
