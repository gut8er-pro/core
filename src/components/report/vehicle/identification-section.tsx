'use client'

import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import type { VehicleSectionProps } from './types'

function IdentificationSection({
	register,
	errors,
	onFieldBlur,
	className,
}: VehicleSectionProps & { className?: string }) {
	return (
		<CollapsibleSection title="Vehicle Information" defaultOpen className={className}>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<TextField
					label="VIN"
					placeholder="e.g. WVWZZZ3CZWE123456"
					maxLength={17}
					hint="17 character Vehicle Identification Number"
					error={errors.vin?.message}
					{...register('vin')}
					onBlur={() => onFieldBlur?.('vin')}
				/>
				<TextField
					label="DATSCode"
					placeholder="Enter DATSCode"
					error={errors.datsCode?.message}
					{...register('datsCode')}
					onBlur={() => onFieldBlur?.('datsCode')}
				/>
				<TextField
					label="Market Index"
					placeholder="Enter market index"
					error={errors.marketIndex?.message}
					{...register('marketIndex')}
					onBlur={() => onFieldBlur?.('marketIndex')}
				/>
				<TextField
					label="Manufacturer"
					placeholder="e.g. Volkswagen"
					error={errors.manufacturer?.message}
					{...register('manufacturer')}
					onBlur={() => onFieldBlur?.('manufacturer')}
				/>
				<TextField
					label="Main Type"
					placeholder="e.g. Golf"
					error={errors.mainType?.message}
					{...register('mainType')}
					onBlur={() => onFieldBlur?.('mainType')}
				/>
				<TextField
					label="Sub Type"
					placeholder="e.g. GTI"
					error={errors.subType?.message}
					{...register('subType')}
					onBlur={() => onFieldBlur?.('subType')}
				/>
				<TextField
					label="KBA Number"
					placeholder="e.g. 0603/BJC"
					maxLength={10}
					error={errors.kbaNumber?.message}
					{...register('kbaNumber')}
					onBlur={() => onFieldBlur?.('kbaNumber')}
				/>
			</div>
		</CollapsibleSection>
	)
}

export { IdentificationSection }
