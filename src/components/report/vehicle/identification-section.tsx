'use client'

import { useTranslations } from 'next-intl'
import { useFieldProps, useSectionBadge } from '@/components/report/missing-info'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { SECTION } from '@/lib/completeness'
import type { VehicleSectionProps } from './types'

function IdentificationSection({
	register,
	errors,
	onFieldBlur,
	disabled,
	className,
}: VehicleSectionProps & { className?: string }) {
	const t = useTranslations('report')
	const fieldProps = useFieldProps({ register, errors, onFieldBlur })
	const badge = useSectionBadge(SECTION.identification)

	return (
		<CollapsibleSection
			title={t('vehicle.identification.heading')}
			info
			defaultOpen
			className={className}
			{...badge}
		>
			<fieldset disabled={disabled} className="flex flex-col gap-4">
				{/* Row 1: VIN / DATSCode / Market Index */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
					<TextField
						label={t('vehicle.identification.vin')}
						placeholder={t('vehicle.identification.vinPlaceholder')}
						maxLength={17}
						{...fieldProps('vin')}
					/>
					<TextField
						label={t('vehicle.identification.datsCode')}
						placeholder={t('vehicle.identification.addCode')}
						{...fieldProps('datsCode')}
					/>
					<TextField
						label={t('vehicle.identification.marketIndex')}
						placeholder={t('vehicle.identification.findMarketIndex')}
						{...fieldProps('marketIndex')}
					/>
				</div>

				{/* Row 2: Manufacturer / Main Type / Subtype */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
					<TextField
						label={t('vehicle.identification.manufacturer')}
						placeholder={t('vehicle.identification.manufacturerPlaceholder')}
						{...fieldProps('manufacturer')}
					/>
					<TextField
						label={t('vehicle.identification.mainType')}
						placeholder={t('vehicle.identification.mainTypePlaceholder')}
						{...fieldProps('mainType')}
					/>
					<TextField
						label={t('vehicle.identification.subtype')}
						placeholder={t('vehicle.identification.subtypePlaceholder')}
						{...fieldProps('subType')}
					/>
				</div>

				{/* Row 3: KBA Number (standalone) */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
					<TextField
						label={t('vehicle.identification.kbaNumber')}
						placeholder={t('vehicle.identification.kbaNumberPlaceholder')}
						maxLength={10}
						{...fieldProps('kbaNumber')}
					/>
				</div>
			</fieldset>
		</CollapsibleSection>
	)
}

export { IdentificationSection }
