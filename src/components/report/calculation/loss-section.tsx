'use client'

import { Controller } from 'react-hook-form'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { SelectField } from '@/components/ui/select'
import type { CalculationSectionProps } from './types'

const DROPOUT_GROUP_OPTIONS = [
	{ value: 'A', label: 'Group A' },
	{ value: 'B', label: 'Group B' },
	{ value: 'C', label: 'Group C' },
	{ value: 'D', label: 'Group D' },
	{ value: 'E', label: 'Group E' },
	{ value: 'F', label: 'Group F' },
	{ value: 'G', label: 'Group G' },
	{ value: 'H', label: 'Group H' },
	{ value: 'I', label: 'Group I' },
	{ value: 'J', label: 'Group J' },
	{ value: 'K', label: 'Group K' },
	{ value: 'L', label: 'Group L' },
	{ value: 'M', label: 'Group M' },
	{ value: 'N', label: 'Group N' },
]

const RENTAL_CLASS_OPTIONS = [
	{ value: '1', label: 'Class 1' },
	{ value: '2', label: 'Class 2' },
	{ value: '3', label: 'Class 3' },
	{ value: '4', label: 'Class 4' },
	{ value: '5', label: 'Class 5' },
	{ value: '6', label: 'Class 6' },
	{ value: '7', label: 'Class 7' },
]

function LossSection({
	register,
	control,
	errors,
	onFieldBlur,
	className,
}: CalculationSectionProps) {
	return (
		<CollapsibleSection title="Loss of Use" className={className}>
			<div className="flex flex-col gap-4">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<Controller
						name="dropoutGroup"
						control={control}
						render={({ field }) => (
							<SelectField
								label="Dropout Group"
								options={DROPOUT_GROUP_OPTIONS}
								placeholder="Select dropout group"
								value={field.value}
								onValueChange={(val) => {
									field.onChange(val)
									onFieldBlur?.('dropoutGroup')
								}}
								error={errors.dropoutGroup?.message}
							/>
						)}
					/>

					<TextField
						label="Cost Per Day"
						type="number"
						prefix="EUR"
						placeholder="0.00"
						step="0.01"
						error={errors.costPerDay?.message}
						{...register('costPerDay')}
						onBlur={() => onFieldBlur?.('costPerDay')}
					/>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<Controller
						name="rentalCarClass"
						control={control}
						render={({ field }) => (
							<SelectField
								label="Rental Car Class"
								options={RENTAL_CLASS_OPTIONS}
								placeholder="Select rental class"
								value={field.value}
								onValueChange={(val) => {
									field.onChange(val)
									onFieldBlur?.('rentalCarClass')
								}}
								error={errors.rentalCarClass?.message}
							/>
						)}
					/>

					<TextField
						label="Repair Days"
						type="number"
						placeholder="0"
						error={errors.repairTimeDays?.message}
						{...register('repairTimeDays')}
						onBlur={() => onFieldBlur?.('repairTimeDays')}
					/>

					<TextField
						label="Replacement Days"
						type="number"
						placeholder="0"
						error={errors.replacementTimeDays?.message}
						{...register('replacementTimeDays')}
						onBlur={() => onFieldBlur?.('replacementTimeDays')}
					/>
				</div>
			</div>
		</CollapsibleSection>
	)
}

export { LossSection }
