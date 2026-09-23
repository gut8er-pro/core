'use client'

import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
import { useWatch } from 'react-hook-form'
import { useFieldProps, useMissingProps, useSectionBadge } from '@/components/report/missing-info'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { ComboField } from '@/components/ui/combo-field'
import { DateField } from '@/components/ui/date-field'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'
import { SECTION } from '@/lib/completeness'
import { hpToKw, kwToHp } from '@/lib/utils/power-conversion'
import type { VehicleSectionProps } from './types'

function SpecificationSection({
	register,
	control,
	errors,
	onFieldBlur,
	setValue,
	disabled,
	className,
}: VehicleSectionProps & { className?: string }) {
	const t = useTranslations('report')
	const tc = useTranslations('common')
	const fieldProps = useFieldProps({ register, errors, onFieldBlur })
	const missing = useMissingProps()
	const badge = useSectionBadge(SECTION.specification)
	const engineDesign = useWatch({ control, name: 'engineDesign' })
	const transmission = useWatch({ control, name: 'transmission' })
	const sourceOfTechnicalData = useWatch({ control, name: 'sourceOfTechnicalData' })

	const TECHNICAL_DATA_SOURCE_OPTIONS = [
		{
			value: t('vehicle.identification.technicalDataSourceOptions.documentsOriginal'),
			label: t('vehicle.identification.technicalDataSourceOptions.documentsOriginal'),
		},
		{
			value: t('vehicle.identification.technicalDataSourceOptions.documentCopy'),
			label: t('vehicle.identification.technicalDataSourceOptions.documentCopy'),
		},
	]

	const ENGINE_DESIGN_OPTIONS = [
		{ value: 'Inline', label: t('vehicle.identification.engineDesignOptions.inline') },
		{ value: 'V-Type', label: t('vehicle.identification.engineDesignOptions.vType') },
		{ value: 'Boxer', label: t('vehicle.identification.engineDesignOptions.boxer') },
		{ value: 'Rotary', label: t('vehicle.identification.engineDesignOptions.rotary') },
		{ value: 'Other', label: t('vehicle.identification.engineDesignOptions.other') },
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
			{...badge}
		>
			<fieldset disabled={disabled} className="flex min-w-0 flex-col gap-4">
				{/* Row 1: Power (kW) / Power (HP) / Engine Design */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
					<TextField
						label={t('vehicle.identification.powerKw')}
						type="number"
						placeholder={t('vehicle.identification.powerKwPlaceholder')}
						{...fieldProps('powerKw')}
						onBlur={handleKwBlur}
					/>
					<TextField
						label={t('vehicle.identification.powerHp')}
						type="number"
						placeholder={t('vehicle.identification.powerHpPlaceholder')}
						{...fieldProps('powerHp')}
						onBlur={handleHpBlur}
					/>
					<SelectField
						label={t('vehicle.identification.engineDesign')}
						options={ENGINE_DESIGN_OPTIONS}
						placeholder={tc('select')}
						value={engineDesign || undefined}
						onValueChange={(value) => {
							setValue?.('engineDesign', value)
							onFieldBlur?.('engineDesign')
						}}
						error={errors.engineDesign?.message}
						disabled={disabled}
					/>
				</div>

				{/* Row 2: Cylinder / Transmission / Engine displacement */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
					<TextField
						label={t('vehicle.identification.cylinder')}
						type="number"
						placeholder={t('vehicle.identification.cylinderPlaceholder')}
						{...fieldProps('cylinders')}
					/>
					<SelectField
						label={t('vehicle.identification.transmission')}
						options={TRANSMISSION_OPTIONS}
						placeholder={tc('select')}
						value={transmission || undefined}
						onValueChange={(value) => {
							setValue?.('transmission', value)
							onFieldBlur?.('transmission')
						}}
						error={errors.transmission?.message}
						disabled={disabled}
						{...missing('transmission')}
					/>
					<TextField
						label={t('vehicle.identification.displacement')}
						type="number"
						placeholder={t('vehicle.identification.displacementPlaceholder')}
						{...fieldProps('displacement')}
					/>
				</div>

				{/* Row 3: First registration / Last registration / Source of technical data */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
					<DateField
						label={t('vehicle.identification.firstRegistration')}
						disabled={disabled}
						{...fieldProps('firstRegistration')}
					/>
					<DateField
						label={t('vehicle.identification.lastRegistration')}
						disabled={disabled}
						{...fieldProps('lastRegistration')}
					/>
					<ComboField
						label={t('vehicle.identification.technicalDataSource')}
						name="sourceOfTechnicalData"
						options={TECHNICAL_DATA_SOURCE_OPTIONS}
						placeholder={t('vehicle.identification.kba')}
						value={sourceOfTechnicalData || ''}
						onValueChange={(value) =>
							setValue?.('sourceOfTechnicalData', value, { shouldDirty: true })
						}
						onBlur={() => onFieldBlur?.('sourceOfTechnicalData')}
						error={errors.sourceOfTechnicalData?.message}
						disabled={disabled}
						{...missing('sourceOfTechnicalData')}
					/>
				</div>
			</fieldset>
		</CollapsibleSection>
	)
}

export { SpecificationSection }
