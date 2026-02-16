'use client'

import { useCallback } from 'react'
import { useWatch } from 'react-hook-form'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { SelectField } from '@/components/ui/select'
import { kwToHp, hpToKw } from '@/lib/utils/power-conversion'
import type { VehicleSectionProps } from './types'

const ENGINE_DESIGN_OPTIONS = [
	{ value: 'Inline', label: 'Inline' },
	{ value: 'V-Type', label: 'V-Type' },
	{ value: 'Boxer', label: 'Boxer' },
	{ value: 'Rotary', label: 'Rotary' },
	{ value: 'Other', label: 'Other' },
]

const TRANSMISSION_OPTIONS = [
	{ value: 'Manual (5-speed)', label: 'Manual (5-speed)' },
	{ value: 'Manual (6-speed)', label: 'Manual (6-speed)' },
	{ value: 'Automatic', label: 'Automatic' },
	{ value: 'CVT', label: 'CVT' },
	{ value: 'DCT', label: 'DCT' },
]

function SpecificationSection({
	register,
	control,
	errors,
	onFieldBlur,
	setValue,
	className,
}: VehicleSectionProps & { className?: string }) {
	const engineDesign = useWatch({ control, name: 'engineDesign' })
	const transmission = useWatch({ control, name: 'transmission' })

	const handleKwBlur = useCallback(() => {
		const kwInput = document.querySelector<HTMLInputElement>('[name="powerKw"]')
		const kwValue = kwInput?.value
		if (kwValue && setValue) {
			const kw = parseFloat(kwValue)
			if (!isNaN(kw)) {
				setValue('powerHp', String(kwToHp(kw)))
			}
		}
		onFieldBlur?.('powerKw')
	}, [onFieldBlur, setValue])

	const handleHpBlur = useCallback(() => {
		const hpInput = document.querySelector<HTMLInputElement>('[name="powerHp"]')
		const hpValue = hpInput?.value
		if (hpValue && setValue) {
			const hp = parseFloat(hpValue)
			if (!isNaN(hp)) {
				setValue('powerKw', String(hpToKw(hp)))
			}
		}
		onFieldBlur?.('powerHp')
	}, [onFieldBlur, setValue])

	return (
		<CollapsibleSection title="Specification" info className={className}>
			<div className="flex flex-col gap-4">
				{/* Row 1: Power (kW) / Power (HP) / Engine Design */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label="Power (kW)"
						type="number"
						placeholder="e.g. 110 kW"
						error={errors.powerKw?.message}
						{...register('powerKw')}
						onBlur={handleKwBlur}
					/>
					<TextField
						label="Power ( HP)"
						type="number"
						placeholder="e.g. 150 HP"
						error={errors.powerHp?.message}
						{...register('powerHp')}
						onBlur={handleHpBlur}
					/>
					<SelectField
						label="Engine Design"
						options={ENGINE_DESIGN_OPTIONS}
						placeholder="Select"
						value={engineDesign || undefined}
						onValueChange={(value) => {
							setValue?.('engineDesign', value)
							onFieldBlur?.('engineDesign')
						}}
						error={errors.engineDesign?.message}
					/>
				</div>

				{/* Row 2: Cylinder / Transmission / Engine displacement */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label="Cylinder"
						type="number"
						placeholder="e.g. 4"
						error={errors.cylinders?.message}
						{...register('cylinders')}
						onBlur={() => onFieldBlur?.('cylinders')}
					/>
					<SelectField
						label="Transmission"
						options={TRANSMISSION_OPTIONS}
						placeholder="Select"
						value={transmission || undefined}
						onValueChange={(value) => {
							setValue?.('transmission', value)
							onFieldBlur?.('transmission')
						}}
						error={errors.transmission?.message}
					/>
					<TextField
						label="Engine displacement (ccm)"
						type="number"
						placeholder="e.g. 1968 ccm"
						error={errors.displacement?.message}
						{...register('displacement')}
						onBlur={() => onFieldBlur?.('displacement')}
					/>
				</div>

				{/* Row 3: First registration / Last registration / Source of technical data */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label="First registration"
						type="date"
						error={errors.firstRegistration?.message}
						{...register('firstRegistration')}
						onBlur={() => onFieldBlur?.('firstRegistration')}
					/>
					<TextField
						label="Last registration"
						type="date"
						error={errors.lastRegistration?.message}
						{...register('lastRegistration')}
						onBlur={() => onFieldBlur?.('lastRegistration')}
					/>
					<TextField
						label="Source of technical data"
						placeholder="KBA (Kraftfahrt-Bundesamt)"
						error={errors.sourceOfTechnicalData?.message}
						{...register('sourceOfTechnicalData')}
						onBlur={() => onFieldBlur?.('sourceOfTechnicalData')}
					/>
				</div>
			</div>
		</CollapsibleSection>
	)
}

export { SpecificationSection }
