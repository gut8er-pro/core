'use client'

import { Controller } from 'react-hook-form'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { SelectField } from '@/components/ui/select'
import type { CalculationSectionProps } from './types'

const TAX_RATE_OPTIONS = [
	{ value: '0', label: '0%' },
	{ value: '7', label: '7%' },
	{ value: '19', label: '19%' },
]

function ValueSection({
	register,
	control,
	errors,
	onFieldBlur,
	className,
}: CalculationSectionProps) {
	return (
		<CollapsibleSection title="Vehicle Value" defaultOpen className={className}>
			<div className="flex flex-col gap-4">
				<TextField
					label="Replacement Value"
					type="number"
					prefix="EUR"
					placeholder="0.00"
					step="0.01"
					error={errors.replacementValue?.message}
					{...register('replacementValue')}
					onBlur={() => onFieldBlur?.('replacementValue')}
				/>

				<Controller
					name="taxRate"
					control={control}
					render={({ field }) => (
						<SelectField
							label="Tax Rate"
							options={TAX_RATE_OPTIONS}
							placeholder="Select tax rate"
							value={field.value}
							onValueChange={(val) => {
								field.onChange(val)
								onFieldBlur?.('taxRate')
							}}
							error={errors.taxRate?.message}
						/>
					)}
				/>

				<TextField
					label="Residual Value"
					type="number"
					prefix="EUR"
					placeholder="0.00"
					step="0.01"
					error={errors.residualValue?.message}
					{...register('residualValue')}
					onBlur={() => onFieldBlur?.('residualValue')}
				/>

				<TextField
					label="Diminution in Value"
					type="number"
					prefix="EUR"
					placeholder="0.00"
					step="0.01"
					error={errors.diminutionInValue?.message}
					{...register('diminutionInValue')}
					onBlur={() => onFieldBlur?.('diminutionInValue')}
				/>
			</div>
		</CollapsibleSection>
	)
}

export { ValueSection }
