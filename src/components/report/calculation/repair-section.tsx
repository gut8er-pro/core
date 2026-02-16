'use client'

import { Controller } from 'react-hook-form'
import { Info } from 'lucide-react'
import { TextField } from '@/components/ui/text-field'
import { SelectField } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { CalculationSectionProps } from './types'

const WHEEL_ALIGNMENT_OPTIONS = [
	{ value: 'not_required', label: 'Not required' },
	{ value: 'required', label: 'Required' },
	{ value: 'completed', label: 'Completed' },
]

const BODY_MEASUREMENTS_OPTIONS = [
	{ value: 'not_required', label: 'Not required' },
	{ value: 'required', label: 'Required' },
	{ value: 'completed', label: 'Completed' },
]

const BODY_PAINT_OPTIONS = [
	{ value: 'not_required', label: 'Not required' },
	{ value: 'partial', label: 'Partial' },
	{ value: 'full', label: 'Full' },
]

function RepairSection({
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
				<h4 className="text-body font-semibold text-black">Repair</h4>
				<Info className="h-4 w-4 text-grey-100" />
			</div>

			{/* Wheel alignment + Body measurements on same row */}
			<div className="grid grid-cols-2 gap-4">
				<Controller
					name="wheelAlignment"
					control={control}
					render={({ field }) => (
						<SelectField
							label="Wheel alignment"
							options={WHEEL_ALIGNMENT_OPTIONS}
							placeholder="Choose"
							value={field.value}
							onValueChange={(val) => {
								field.onChange(val)
								onFieldBlur?.('wheelAlignment')
							}}
							error={errors.wheelAlignment?.message}
						/>
					)}
				/>

				<Controller
					name="bodyMeasurements"
					control={control}
					render={({ field }) => (
						<SelectField
							label="Body measurements"
							options={BODY_MEASUREMENTS_OPTIONS}
							placeholder="Choose"
							value={field.value}
							onValueChange={(val) => {
								field.onChange(val)
								onFieldBlur?.('bodyMeasurements')
							}}
							error={errors.bodyMeasurements?.message}
						/>
					)}
				/>
			</div>

			{/* Body paint (optional) - full width */}
			<Controller
				name="bodyPaint"
				control={control}
				render={({ field }) => (
					<SelectField
						label="Body paint (optional)"
						options={BODY_PAINT_OPTIONS}
						placeholder="Optional choose"
						value={field.value}
						onValueChange={(val) => {
							field.onChange(val)
							onFieldBlur?.('bodyPaint')
						}}
						error={errors.bodyPaint?.message}
					/>
				)}
			/>

			{/* Plastic Repair checkbox */}
			<Controller
				name="plasticRepair"
				control={control}
				render={({ field }) => (
					<label className="flex items-center gap-2 cursor-pointer">
						<Checkbox
							checked={field.value}
							onCheckedChange={(checked) => {
								field.onChange(checked)
								onFieldBlur?.('plasticRepair')
							}}
						/>
						<span className="text-body-sm text-black">Plastic Repair</span>
					</label>
				)}
			/>

			{/* Repair Method - full width */}
			<TextField
				label="Repair Method"
				placeholder="Add method"
				error={errors.repairMethod?.message}
				{...register('repairMethod')}
				onBlur={() => onFieldBlur?.('repairMethod')}
			/>

			{/* Risks - full width */}
			<TextField
				label="Risks"
				placeholder="Add risks"
				error={errors.risks?.message}
				{...register('risks')}
				onBlur={() => onFieldBlur?.('risks')}
			/>
		</div>
	)
}

export { RepairSection }
