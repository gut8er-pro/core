'use client'

import { Controller, useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { SelectField } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import type { CalculationSectionProps } from './types'

const REPAIR_METHOD_OPTIONS = [
	{ value: 'conventional', label: 'Conventional' },
	{ value: 'smart_repair', label: 'Smart Repair' },
	{ value: 'replace', label: 'Replace' },
]

const DAMAGE_CLASS_OPTIONS = [
	{ value: 'class_1', label: 'Class I' },
	{ value: 'class_2', label: 'Class II' },
	{ value: 'class_3', label: 'Class III' },
	{ value: 'class_4', label: 'Class IV' },
	{ value: 'class_5', label: 'Class V' },
	{ value: 'class_6', label: 'Class VI' },
]

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
	const { fields, append, remove } = useFieldArray({
		control,
		name: 'additionalCosts',
	})

	return (
		<CollapsibleSection title="Repair" defaultOpen className={className}>
			<div className="flex flex-col gap-6">
				{/* Select fields for repair options */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Controller
						name="wheelAlignment"
						control={control}
						render={({ field }) => (
							<SelectField
								label="Wheel Alignment"
								options={WHEEL_ALIGNMENT_OPTIONS}
								placeholder="Select status"
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
								label="Body Measurements"
								options={BODY_MEASUREMENTS_OPTIONS}
								placeholder="Select status"
								value={field.value}
								onValueChange={(val) => {
									field.onChange(val)
									onFieldBlur?.('bodyMeasurements')
								}}
								error={errors.bodyMeasurements?.message}
							/>
						)}
					/>

					<Controller
						name="bodyPaint"
						control={control}
						render={({ field }) => (
							<SelectField
								label="Body Paint"
								options={BODY_PAINT_OPTIONS}
								placeholder="Select paint scope"
								value={field.value}
								onValueChange={(val) => {
									field.onChange(val)
									onFieldBlur?.('bodyPaint')
								}}
								error={errors.bodyPaint?.message}
							/>
						)}
					/>

					<Controller
						name="plasticRepair"
						control={control}
						render={({ field }) => (
							<label className="flex items-center gap-2 cursor-pointer pt-6">
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
				</div>

				{/* Repair Method & Damage Class */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<Controller
						name="repairMethod"
						control={control}
						render={({ field }) => (
							<SelectField
								label="Repair Method"
								options={REPAIR_METHOD_OPTIONS}
								placeholder="Select repair method"
								value={field.value}
								onValueChange={(val) => {
									field.onChange(val)
									onFieldBlur?.('repairMethod')
								}}
								error={errors.repairMethod?.message}
							/>
						)}
					/>

					<Controller
						name="damageClass"
						control={control}
						render={({ field }) => (
							<SelectField
								label="Damage Class"
								options={DAMAGE_CLASS_OPTIONS}
								placeholder="Select damage class"
								value={field.value}
								onValueChange={(val) => {
									field.onChange(val)
									onFieldBlur?.('damageClass')
								}}
								error={errors.damageClass?.message}
							/>
						)}
					/>
				</div>

				{/* Repair Risks */}
				<TextField
					label="Repair Risks"
					placeholder="Describe any repair risks"
					error={errors.risks?.message}
					{...register('risks')}
					onBlur={() => onFieldBlur?.('risks')}
				/>

				{/* Additional Costs */}
				<div className="flex flex-col gap-4">
					<h4 className="text-h4 font-semibold text-black">Additional Costs</h4>

					{fields.map((field, index) => (
						<div key={field.id} className="flex items-end gap-4">
							<div className="flex-1">
								<TextField
									label="Description"
									placeholder="Cost description"
									error={errors.additionalCosts?.[index]?.description?.message}
									{...register(`additionalCosts.${index}.description`)}
									onBlur={() => onFieldBlur?.(`additionalCosts.${index}.description`)}
								/>
							</div>
							<div className="w-40">
								<TextField
									label="Amount"
									type="number"
									prefix="EUR"
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
						size="sm"
						icon={<Plus className="h-4 w-4" />}
						onClick={() => append({ description: '', amount: '' })}
						className="self-start"
					>
						Add Cost
					</Button>
				</div>
			</div>
		</CollapsibleSection>
	)
}

export { RepairSection }
