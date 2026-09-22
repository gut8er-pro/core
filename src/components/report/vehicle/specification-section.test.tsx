import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@/test/test-utils'
import { VEHICLE_DEFAULTS } from './form-data'
import { SpecificationSection } from './specification-section'
import type { VehicleFormData } from './types'

function TestWrapper({
	onFieldBlur,
	onDirty,
	disabled,
}: {
	onFieldBlur?: (field: string) => void
	onDirty?: (dirty: boolean) => void
	disabled?: boolean
}) {
	const methods = useForm<VehicleFormData>({ defaultValues: { ...VEHICLE_DEFAULTS } })
	onDirty?.(!!methods.formState.dirtyFields.sourceOfTechnicalData)
	return (
		<SpecificationSection
			register={methods.register}
			control={methods.control}
			errors={methods.formState.errors}
			onFieldBlur={onFieldBlur}
			setValue={methods.setValue}
			disabled={disabled}
		/>
	)
}

function openSection() {
	fireEvent.click(screen.getByText('Specification'))
}

function sourceInput() {
	return screen.getByRole('combobox', { name: 'Source of technical data' })
}

describe('SpecificationSection — source of technical data', () => {
	it('offers both presets', () => {
		render(<TestWrapper />)
		openSection()
		fireEvent.focus(sourceInput())

		expect(screen.getByRole('option', { name: 'Documents original' })).toBeInTheDocument()
		expect(screen.getByRole('option', { name: 'Document copy' })).toBeInTheDocument()
	})

	it('keeps free text typeable', () => {
		render(<TestWrapper />)
		openSection()
		fireEvent.change(sourceInput(), { target: { value: 'DAT SilverDAT3' } })

		expect(sourceInput()).toHaveValue('DAT SilverDAT3')
	})

	it('marks the field dirty when typed into, so the debounced autosave runs', () => {
		const dirtyStates: boolean[] = []
		render(<TestWrapper onDirty={(d) => dirtyStates.push(d)} />)
		openSection()
		fireEvent.change(sourceInput(), { target: { value: 'DAT SilverDAT3' } })

		expect(dirtyStates.at(-1)).toBe(true)
	})

	it('saves on blur', () => {
		const onFieldBlur = vi.fn()
		render(<TestWrapper onFieldBlur={onFieldBlur} />)
		openSection()
		fireEvent.change(sourceInput(), { target: { value: 'KBA' } })
		fireEvent.blur(sourceInput())

		expect(onFieldBlur).toHaveBeenCalledWith('sourceOfTechnicalData')
	})

	it('disables the field on a locked report', () => {
		render(<TestWrapper disabled />)
		openSection()

		expect(sourceInput()).toBeDisabled()
	})
})
