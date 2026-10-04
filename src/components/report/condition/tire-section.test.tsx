import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { TireSection } from './tire-section'

describe('TireSection', () => {
	// The card is collapsed by default, and a collapsed CollapsibleSection does not
	// mount its children — so the auto-create must live outside them to run at all.
	it('auto-creates the first tire set while the card is still collapsed', () => {
		const onSaveTireSet = vi.fn()
		render(<TireSection tireSets={[]} onSaveTireSet={onSaveTireSet} onDeleteTireSet={vi.fn()} />)

		expect(screen.getByRole('button', { name: /tires/i })).toHaveAttribute('aria-expanded', 'false')
		expect(onSaveTireSet).toHaveBeenCalledTimes(1)
		expect(onSaveTireSet).toHaveBeenCalledWith(
			expect.objectContaining({
				setNumber: 1,
				tires: ['VL', 'VR', 'HL', 'HR'].map((position) => expect.objectContaining({ position })),
			}),
		)
	})
})
