'use client'

import { Controller } from 'react-hook-form'
import { Info } from 'lucide-react'
import { TextField } from '@/components/ui/text-field'
import { SelectField } from '@/components/ui/select'
import { cn } from '@/lib/utils'
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
		<div className={cn('flex flex-col gap-5', className)}>
			{/* Section header */}
			<div className="flex items-center gap-2">
				<h4 className="text-body font-semibold text-black">Loss of Use</h4>
				<Info className="h-4 w-4 text-grey-100" />
			</div>

			{/* First row: Dropout group, Cost per Day, Rental Car Class */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Controller
					name="dropoutGroup"
					control={control}
					render={({ field }) => (
						<SelectField
							label="Dropout group"
							options={DROPOUT_GROUP_OPTIONS}
							placeholder="Choose"
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
					label="Cost per Day (€)"
					type="number"
					prefix="€"
					placeholder="0.00"
					step="0.01"
					error={errors.costPerDay?.message}
					{...register('costPerDay')}
					onBlur={() => onFieldBlur?.('costPerDay')}
				/>

				<Controller
					name="rentalCarClass"
					control={control}
					render={({ field }) => (
						<SelectField
							label="Rental Car Class"
							options={RENTAL_CLASS_OPTIONS}
							placeholder="Choose"
							value={field.value}
							onValueChange={(val) => {
								field.onChange(val)
								onFieldBlur?.('rentalCarClass')
							}}
							error={errors.rentalCarClass?.message}
						/>
					)}
				/>
			</div>

			{/* Second row: Repair time, Replacement time */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<TextField
					label="Repair time (days)"
					type="number"
					placeholder="Add days"
					error={errors.repairTimeDays?.message}
					{...register('repairTimeDays')}
					onBlur={() => onFieldBlur?.('repairTimeDays')}
				/>

				<TextField
					label="Replacement time (days)"
					type="number"
					placeholder="Add days"
					error={errors.replacementTimeDays?.message}
					{...register('replacementTimeDays')}
					onBlur={() => onFieldBlur?.('replacementTimeDays')}
				/>
			</div>
		</div>
	)
}

export { LossSection }
