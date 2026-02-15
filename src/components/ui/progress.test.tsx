import { render, screen } from '@/test/test-utils'
import { describe, expect, it } from 'vitest'
import { Progress } from './progress'

describe('Progress', () => {
	it('renders progress bar', () => {
		render(<Progress value={50} />)
		expect(screen.getByRole('progressbar')).toBeInTheDocument()
	})

	it('renders indicator with correct transform style', () => {
		const { container } = render(<Progress value={75} />)
		const bar = screen.getByRole('progressbar')
		expect(bar).toBeInTheDocument()
		// Check the indicator child has the transform style
		const indicator = bar.firstElementChild
		expect(indicator).toHaveStyle({ transform: 'translateX(-25%)' })
	})

	it('renders 0% as full offset', () => {
		const { container } = render(<Progress value={0} />)
		const bar = screen.getByRole('progressbar')
		const indicator = bar.firstElementChild
		expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' })
	})

	it('renders 100% as no offset', () => {
		render(<Progress value={100} />)
		const bar = screen.getByRole('progressbar')
		const indicator = bar.firstElementChild
		expect(indicator).toHaveStyle({ transform: 'translateX(-0%)' })
	})

	it('applies custom className', () => {
		render(<Progress value={50} className="custom-class" />)
		const bar = screen.getByRole('progressbar')
		expect(bar.className).toContain('custom-class')
	})
})
