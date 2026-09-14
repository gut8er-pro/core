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
			<div className="flex flex-col gap-4">
				{/* Row 1: VIN / DATSCode / Market Index */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label={t('vehicle.identification.vin')}
						placeholder="e.g. WVWZZZ3CZWE123456"
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
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label={t('vehicle.identification.manufacturer')}
						placeholder="e.g. Volkswagen AG"
						{...fieldProps('manufacturer')}
					/>
					<TextField
						label={t('vehicle.identification.mainType')}
						placeholder="e.g. Golf VII"
						{...fieldProps('mainType')}
					/>
					<TextField
						label={t('vehicle.identification.subtype')}
						placeholder="e.g. Golf VII 2.0 TDI"
						{...fieldProps('subType')}
					/>
				</div>

				{/* Row 3: KBA Number (standalone) */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label={t('vehicle.identification.kbaNumber')}
						placeholder="e.g. 0603 / BGH"
						maxLength={10}
						{...fieldProps('kbaNumber')}
					/>
				</div>
			</div>
		</CollapsibleSection>
	)
}

export { IdentificationSection }
