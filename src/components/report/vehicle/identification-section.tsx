'use client'

import { useTranslations } from 'next-intl'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import type { VehicleSectionProps } from './types'

function IdentificationSection({
	register,
	errors,
	onFieldBlur,
	className,
}: VehicleSectionProps & { className?: string }) {
	const t = useTranslations('report')
	return (
		<CollapsibleSection
			title={t('vehicle.identification.heading')}
			info
			defaultOpen
			className={className}
		>
			<div className="flex flex-col gap-4">
				{/* Row 1: VIN / DATSCode / Market Index */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label={t('vehicle.identification.vin')}
						placeholder="e.g. WVWZZZ3CZWE123456"
						maxLength={17}
						error={errors.vin?.message}
						{...register('vin')}
						onBlur={() => onFieldBlur?.('vin')}
					/>
					<TextField
						label={t('vehicle.identification.datsCode')}
						placeholder={t('vehicle.identification.addCode')}
						error={errors.datsCode?.message}
						{...register('datsCode')}
						onBlur={() => onFieldBlur?.('datsCode')}
					/>
					<TextField
						label={t('vehicle.identification.marketIndex')}
						placeholder={t('vehicle.identification.findMarketIndex')}
						error={errors.marketIndex?.message}
						{...register('marketIndex')}
						onBlur={() => onFieldBlur?.('marketIndex')}
					/>
				</div>

				{/* Row 2: Manufacturer / Main Type / Subtype */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label={t('vehicle.identification.manufacturer')}
						placeholder="e.g. Volkswagen AG"
						error={errors.manufacturer?.message}
						{...register('manufacturer')}
						onBlur={() => onFieldBlur?.('manufacturer')}
					/>
					<TextField
						label={t('vehicle.identification.mainType')}
						placeholder="e.g. Golf VII"
						error={errors.mainType?.message}
						{...register('mainType')}
						onBlur={() => onFieldBlur?.('mainType')}
					/>
					<TextField
						label={t('vehicle.identification.subtype')}
						placeholder="e.g. Golf VII 2.0 TDI"
						error={errors.subType?.message}
						{...register('subType')}
						onBlur={() => onFieldBlur?.('subType')}
					/>
				</div>

				{/* Row 3: KBA Number (standalone) */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label={t('vehicle.identification.kbaNumber')}
						placeholder="e.g. 0603 / BGH"
						maxLength={10}
						error={errors.kbaNumber?.message}
						{...register('kbaNumber')}
						onBlur={() => onFieldBlur?.('kbaNumber')}
					/>
				</div>
			</div>
		</CollapsibleSection>
	)
}

export { IdentificationSection }
