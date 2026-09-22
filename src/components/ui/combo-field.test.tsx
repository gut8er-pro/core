import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ComboField } from './combo-field'

const OPTIONS = [
	{ value: 'Documents original', label: 'Documents original' },
	{ value: 'Document copy', label: 'Document copy' },
]

function Harness({ onBlur }: { onBlur?: () => void }) {
	const [value, setValue] = useState('')
	return (
		<ComboField
			label="Source"
			options={OPTIONS}
			value={value}
			onValueChange={setValue}
			onBlur={onBlur}
			placeholder="Pick or type"
		/>
	)
}

describe('ComboField', () => {
	it('offers the presets and applies a picked one', () => {
		render(<Harness />)
		fireEvent.focus(screen.getByRole('combobox'))
		fireEvent.mouseDown(screen.getByRole('option', { name: 'Document copy' }))
		expect(screen.getByRole('combobox')).toHaveValue('Document copy')
	})

	it('accepts free text', () => {
		render(<Harness />)
		fireEvent.change(screen.getByRole('combobox'), { target: { value: 'DAT SilverDAT3' } })
		expect(screen.getByRole('combobox')).toHaveValue('DAT SilverDAT3')
	})

	it('fires onBlur when a preset is picked so autosave runs', () => {
		const onBlur = vi.fn()
		render(<Harness onBlur={onBlur} />)
		fireEvent.focus(screen.getByRole('combobox'))
		fireEvent.mouseDown(screen.getByRole('option', { name: 'Documents original' }))
		expect(onBlur).toHaveBeenCalled()
	})
})
