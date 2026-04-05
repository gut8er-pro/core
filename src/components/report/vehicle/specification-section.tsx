'use client'

import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
import { useWatch } from 'react-hook-form'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'
import { hpToKw, kwToHp } from '@/lib/utils/power-conversion'
import type { VehicleSectionProps } from './types'

function SpecificationSection({
	register,
	control,
	errors,
	onFieldBlur,
	setValue,
	className,
}: VehicleSectionProps & { className?: string }) {
	const t = useTranslations('report')
	const engineDesign = useWatch({ control, name: 'engineDesign' })
	const transmission = useWatch({ control, name: 'transmission' })

	const ENGINE_DESIGN_OPTIONS = [
		{ value: 'Inline', label: t('vehicle.identification.engineDesignOptions.inline') },
		{ value: 'V-Type', label: t('vehicle.identification.engineDesignOptions.vType') },
		{ value: 'Boxer', label: t('vehicle.identification.engineDesignOptions.boxer') },
		{ value: 'Rotary', label: t('vehicle.identification.engineDesignOptions.rotary') },
		{ value: 'Other', label: 'Other' },
	]

	const TRANSMISSION_OPTIONS = [
		{ value: 'Manual (5-speed)', label: t('vehicle.identification.transmissionOptions.manual5') },
		{ value: 'Manual (6-speed)', label: t('vehicle.identification.transmissionOptions.manual6') },
		{ value: 'Automatic', label: t('vehicle.identification.transmissionOptions.automatic') },
		{ value: 'CVT', label: t('vehicle.identification.transmissionOptions.cvt') },
		{ value: 'DCT', label: t('vehicle.identification.transmissionOptions.dct') },
	]

	const handleKwBlur = useCallback(() => {
		const kwInput = document.querySelector<HTMLInputElement>('[name="powerKw"]')
		const kwValue = kwInput?.value
		if (kwValue && setValue) {
			const kw = parseFloat(kwValue)
			if (!Number.isNaN(kw)) {
				setValue('powerHp', String(kwToHp(kw)))
			}
		}
		onFieldBlur?.('powerKw')
		// Also save the auto-calculated HP
		setTimeout(() => onFieldBlur?.('powerHp'), 100)
	}, [onFieldBlur, setValue])

	const handleHpBlur = useCallback(() => {
		const hpInput = document.querySelector<HTMLInputElement>('[name="powerHp"]')
		const hpValue = hpInput?.value
		if (hpValue && setValue) {
			const hp = parseFloat(hpValue)
			if (!Number.isNaN(hp)) {
				setValue('powerKw', String(hpToKw(hp)))
			}
		}
		onFieldBlur?.('powerHp')
		// Also save the auto-calculated kW
		setTimeout(() => onFieldBlur?.('powerKw'), 100)
	}, [onFieldBlur, setValue])

	return (
		<CollapsibleSection
			title={t('vehicle.identification.specification')}
			info
			className={className}
		>
			<div className="flex flex-col gap-4">
				{/* Row 1: Power (kW) / Power (HP) / Engine Design */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label={t('vehicle.identification.powerKw')}
						type="number"
						placeholder="e.g. 110 kW"
						error={errors.powerKw?.message}
						{...register('powerKw')}
						onBlur={handleKwBlur}
					/>
					<TextField
						label={t('vehicle.identification.powerHp')}
						type="number"
						placeholder="e.g. 150 HP"
						error={errors.powerHp?.message}
						{...register('powerHp')}
						onBlur={handleHpBlur}
					/>
					<SelectField
						label={t('vehicle.identification.engineDesign')}
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
						label={t('vehicle.identification.cylinder')}
						type="number"
						placeholder="e.g. 4"
						error={errors.cylinders?.message}
						{...register('cylinders')}
						onBlur={() => onFieldBlur?.('cylinders')}
					/>
					<SelectField
						label={t('vehicle.identification.transmission')}
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
						label={t('vehicle.identification.displacement')}
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
						label={t('vehicle.identification.firstRegistration')}
						type="date"
						error={errors.firstRegistration?.message}
						{...register('firstRegistration')}
						onBlur={() => onFieldBlur?.('firstRegistration')}
					/>
					<TextField
						label={t('vehicle.identification.lastRegistration')}
						type="date"
						error={errors.lastRegistration?.message}
						{...register('lastRegistration')}
						onBlur={() => onFieldBlur?.('lastRegistration')}
					/>
					<TextField
						label={t('vehicle.identification.technicalDataSource')}
						placeholder={t('vehicle.identification.kba')}
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
