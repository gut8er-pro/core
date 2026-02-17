'use client'

import { Controller, useFieldArray } from 'react-hook-form'
import { Info, Plus, Trash2 } from 'lucide-react'
import { TextField } from '@/components/ui/text-field'
import { SelectField } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CalculationSectionProps } from './types'

const TAX_RATE_OPTIONS = [
	{ value: '0', label: '0%' },
	{ value: '7', label: '7%' },
	{ value: '19', label: '19%' },
]

const DAMAGE_CLASS_OPTIONS = [
	{ value: 'class_1', label: 'Class I' },
	{ value: 'class_2', label: 'Class II' },
	{ value: 'class_3', label: 'Class III' },
	{ value: 'class_4', label: 'Class IV' },
	{ value: 'class_5', label: 'Class V' },
	{ value: 'class_6', label: 'Class VI' },
]

function ValueSection({
	register,
	control,
	errors,
	onFieldBlur,
	className,
}: CalculationSectionProps) {
	const { fields, append, remove } = useFieldArray({
		control,
		name: 'additionalCosts',
	})

	return (
		<div className={cn('flex flex-col gap-5', className)}>
			{/* Section header */}
			<div className="flex items-center gap-2">
				<h4 className="text-body font-semibold text-black">Vehicle Value</h4>
				<Info className="h-4 w-4 text-grey-100" />
			</div>

			{/* Replacement value + Tax rate on same row */}
			<div className="grid grid-cols-2 gap-4">
				<TextField
					label="Replacement value"
					type="number"
					prefix="€"
					placeholder="Add value"
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
							label="Choose tax rate"
							options={TAX_RATE_OPTIONS}
							placeholder="Choose"
							value={field.value}
							onValueChange={(val) => {
								field.onChange(val)
								onFieldBlur?.('taxRate')
							}}
							error={errors.taxRate?.message}
						/>
					)}
				/>
			</div>

			{/* Residual value - full width */}
			<TextField
				label="Residual value"
				placeholder="Add value"
				error={errors.residualValue?.message}
				{...register('residualValue')}
				onBlur={() => onFieldBlur?.('residualValue')}
			/>

			{/* Diminution in value - full width */}
			<TextField
				label="Diminution in value"
				placeholder="Add value"
				error={errors.diminutionInValue?.message}
				{...register('diminutionInValue')}
				onBlur={() => onFieldBlur?.('diminutionInValue')}
			/>

			{/* Additional Costs */}
			{fields.map((field, index) => (
				<div key={field.id} className="flex items-end gap-3">
					<div className="flex-1">
						<TextField
							label="Description"
							placeholder="Cost description"
							error={errors.additionalCosts?.[index]?.description?.message}
							{...register(`additionalCosts.${index}.description`)}
							onBlur={() => onFieldBlur?.(`additionalCosts.${index}.description`)}
						/>
					</div>
					<div className="w-36">
						<TextField
							label="Amount"
							type="number"
							prefix="€"
							placeholder="0.00"
							step="0.01"
							error={errors.additionalCosts?.[index]?.amount?.message}
							{...register(`additionalCosts.${index}.amount`)}
							onBlur={() => onFieldBlur?.(`additionalCosts.${index}.amount`)}
						/>
					</div>
					<Button
						type="button"
						variant="danger"
						size="icon"
						onClick={() => remove(index)}
						aria-label="Remove cost"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			))}

			<Button
				type="button"
				variant="outline"
				size="md"
				icon={<Plus className="h-4 w-4" />}
				onClick={() => append({ description: '', amount: '' })}
				className="self-center"
			>
				Additional Costs
			</Button>

			{/* Damage class */}
			<TextField
				label="Damage class"
				placeholder="Add damage class"
				error={errors.damageClass?.message}
				{...register('damageClass')}
				onBlur={() => onFieldBlur?.('damageClass')}
			/>
		</div>
	)
}

export { ValueSection }
