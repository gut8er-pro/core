'use client'

import { Controller } from 'react-hook-form'
import { QrCode } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { SelectField } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ConditionSectionProps } from './types'

const PAINT_TYPE_OPTIONS = [
	{ value: 'Uni (2 Schicht)', label: 'Uni (2 Schicht)' },
	{ value: 'Metallic', label: 'Metallic' },
	{ value: 'Pearl', label: 'Pearl' },
	{ value: 'Matte', label: 'Matte' },
]

const PAINT_OPTIONS = [
	{ value: 'Original manufacturer paint', label: 'Original manufacturer paint' },
	{ value: 'Repainted', label: 'Repainted' },
	{ value: 'Mixed', label: 'Mixed' },
]

const PAINT_CONDITION_OPTIONS = [
	{ value: 'Good', label: 'Good' },
	{ value: 'Fair', label: 'Fair' },
	{ value: 'Poor', label: 'Poor' },
]

const GENERAL_CONDITION_OPTIONS = [
	{ value: 'Well maintained', label: 'Well maintained' },
	{ value: 'Average', label: 'Average' },
	{ value: 'Poor', label: 'Poor' },
]

const BODY_CONDITION_OPTIONS = [
	{ value: 'Minor cosmetic', label: 'Minor cosmetic' },
	{ value: 'No damage', label: 'No damage' },
	{ value: 'Structural damage', label: 'Structural damage' },
]

const INTERIOR_CONDITION_OPTIONS = [
	{ value: 'Clean, no structural damage.', label: 'Clean, no structural damage.' },
	{ value: 'Minor wear', label: 'Minor wear' },
	{ value: 'Significant wear', label: 'Significant wear' },
]

const DRIVING_ABILITY_OPTIONS = [
	{ value: 'Roadworthy', label: 'Roadworthy' },
	{ value: 'Limited', label: 'Limited' },
	{ value: 'Not roadworthy', label: 'Not roadworthy' },
]

const UNIT_OPTIONS = [
	{ value: 'km', label: 'km' },
	{ value: 'MKR', label: 'MKR' },
	{ value: 'miles', label: 'miles' },
]

const MULTI_HIT_COLORS = [
	{ value: 1, bg: 'bg-grey-50', border: 'border-grey-50', text: 'text-black' },
	{ value: 2, bg: 'bg-error', border: 'border-error', text: 'text-white' },
	{ value: 3, bg: 'bg-warning-orange', border: 'border-warning-orange', text: 'text-white' },
	{ value: 4, bg: 'bg-primary', border: 'border-primary', text: 'text-white' },
]

type CheckboxPillProps = {
	label: string
	checked: boolean
	onChange: (checked: boolean) => void
}

function CheckboxPill({ label, checked, onChange }: CheckboxPillProps) {
	return (
		<button
			type="button"
			onClick={() => onChange(!checked)}
			className={cn(
				'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-body-sm font-medium transition-colors',
				checked
					? 'border-primary bg-primary-light text-primary'
					: 'border-border bg-white text-grey-100 hover:bg-grey-25',
			)}
		>
			{checked && (
				<svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
					<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
				</svg>
			)}
			{label}
		</button>
	)
}

function ConditionSection({
	register,
	control,
	errors,
	onFieldBlur,
	className,
}: ConditionSectionProps) {
	return (
		<CollapsibleSection title="Vehicle Condition" info defaultOpen className={className}>
			<div className="flex flex-col gap-6">
				{/* Row 1: Paint type / Paint / Paint condition */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<Controller
						name="paintType"
						control={control}
						render={({ field }) => (
							<SelectField
								label="Paint type"
								options={PAINT_TYPE_OPTIONS}
								placeholder="Select"
								value={field.value}
								onValueChange={(val) => {
									field.onChange(val)
									onFieldBlur?.('paintType')
								}}
								error={errors.paintType?.message}
							/>
						)}
					/>

					<Controller
						name="hard"
						control={control}
						render={({ field }) => (
							<SelectField
								label="Paint"
								options={PAINT_OPTIONS}
								placeholder="Select"
								value={field.value}
								onValueChange={(val) => {
									field.onChange(val)
									onFieldBlur?.('hard')
								}}
								error={errors.hard?.message}
							/>
						)}
					/>

					<Controller
						name="paintCondition"
						control={control}
						render={({ field }) => (
							<SelectField
								label="Paint condition"
								options={PAINT_CONDITION_OPTIONS}
								placeholder="Select"
								value={field.value}
								onValueChange={(val) => {
									field.onChange(val)
									onFieldBlur?.('paintCondition')
								}}
								error={errors.paintCondition?.message}
							/>
						)}
					/>
				</div>

				{/* Row 2: General condition / Body condition / Interior condition */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<Controller
						name="generalCondition"
						control={control}
						render={({ field }) => (
							<SelectField
								label="General condition"
								options={GENERAL_CONDITION_OPTIONS}
								placeholder="Select"
								value={field.value}
								onValueChange={(val) => {
									field.onChange(val)
									onFieldBlur?.('generalCondition')
								}}
								error={errors.generalCondition?.message}
							/>
						)}
					/>

					<Controller
						name="bodyCondition"
						control={control}
						render={({ field }) => (
							<SelectField
								label="Body condition"
								options={BODY_CONDITION_OPTIONS}
								placeholder="Select"
								value={field.value}
								onValueChange={(val) => {
									field.onChange(val)
									onFieldBlur?.('bodyCondition')
								}}
								error={errors.bodyCondition?.message}
							/>
						)}
					/>

					<Controller
						name="interiorCondition"
						control={control}
						render={({ field }) => (
							<SelectField
								label="Interior condition"
								options={INTERIOR_CONDITION_OPTIONS}
								placeholder="Select"
								value={field.value}
								onValueChange={(val) => {
									field.onChange(val)
									onFieldBlur?.('interiorCondition')
								}}
								error={errors.interiorCondition?.message}
							/>
						)}
					/>
				</div>

				{/* Row 3: Driving ability / Special features / Parking sensors */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<Controller
						name="drivingAbility"
						control={control}
						render={({ field }) => (
							<SelectField
								label="Driving ability"
								options={DRIVING_ABILITY_OPTIONS}
								placeholder="Select"
								value={field.value}
								onValueChange={(val) => {
									field.onChange(val)
									onFieldBlur?.('drivingAbility')
								}}
								error={errors.drivingAbility?.message}
							/>
						)}
					/>

					<TextField
						label="Special features"
						placeholder="Parking sensors"
						error={errors.specialFeatures?.message}
						{...register('specialFeatures')}
						onBlur={() => onFieldBlur?.('specialFeatures')}
					/>
				</div>

				{/* Row 4: Mileage Read / Estimation mileage / Unit in km */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label="Mileage Read"
						type="number"
						placeholder="e.g. 125,450 km"
						error={errors.mileageRead?.message}
						{...register('mileageRead')}
						onBlur={() => onFieldBlur?.('mileageRead')}
					/>

					<TextField
						label="Estimation mileage"
						type="number"
						placeholder="e.g. 125,450 km"
						error={errors.estimateMileage?.message}
						{...register('estimateMileage')}
						onBlur={() => onFieldBlur?.('estimateMileage')}
					/>

					<Controller
						name="unit"
						control={control}
						render={({ field }) => (
							<SelectField
								label="Unit in km"
								options={UNIT_OPTIONS}
								value={field.value || 'km'}
								onValueChange={(val) => {
									field.onChange(val)
									onFieldBlur?.('unit')
								}}
								error={errors.unit?.message}
							/>
						)}
					/>
				</div>

				{/* Next MOT (optional) with QR area */}
				<div className="flex items-end gap-4">
					<div className="w-full max-w-xs">
						<TextField
							label="Next MOT (optional)"
							type="date"
							placeholder="MM/YY/YY"
							error={errors.nextMot?.message}
							{...register('nextMot')}
							onBlur={() => onFieldBlur?.('nextMot')}
						/>
					</div>
					<div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-white">
						<QrCode className="h-5 w-5 text-grey-100" />
					</div>
				</div>

				{/* Checkbox pills row */}
				<div className="flex flex-wrap items-center gap-2">
					<Controller
						name="fullServiceHistory"
						control={control}
						render={({ field }) => (
							<CheckboxPill
								label="Full serviced history"
								checked={field.value}
								onChange={(checked) => {
									field.onChange(checked)
									onFieldBlur?.('fullServiceHistory')
								}}
							/>
						)}
					/>
					<Controller
						name="testDrivePerformed"
						control={control}
						render={({ field }) => (
							<CheckboxPill
								label="Test drive performed"
								checked={field.value}
								onChange={(checked) => {
									field.onChange(checked)
									onFieldBlur?.('testDrivePerformed')
								}}
							/>
						)}
					/>
					<Controller
						name="errorMemoryRead"
						control={control}
						render={({ field }) => (
							<CheckboxPill
								label="Error memory read"
								checked={field.value}
								onChange={(checked) => {
									field.onChange(checked)
									onFieldBlur?.('errorMemoryRead')
								}}
							/>
						)}
					/>
					<Controller
						name="airbagsDeployed"
						control={control}
						render={({ field }) => (
							<CheckboxPill
								label="Airbags deployed"
								checked={field.value}
								onChange={(checked) => {
									field.onChange(checked)
									onFieldBlur?.('airbagsDeployed')
								}}
							/>
						)}
					/>
				</div>

				{/* Multi-hit Groups */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="text-body-sm font-medium text-black">Multi-hit Groups</span>
					</div>
					<div className="flex items-center gap-1">
						{MULTI_HIT_COLORS.map((item) => (
							<div
								key={item.value}
								className={cn(
									'flex h-8 w-8 items-center justify-center rounded-full text-caption font-bold',
									item.bg,
									item.text,
								)}
							>
								{item.value}
							</div>
						))}
					</div>
				</div>

				{/* Notes */}
				<div className="flex flex-col gap-1">
					<span className="text-body-sm font-medium text-black">Notes</span>
					<textarea
						className="min-h-30 w-full rounded-md border border-border bg-white px-4 py-3 text-body-sm text-black placeholder:text-placeholder focus:border-border-focus focus:outline-none"
						placeholder="Add notes"
						{...register('notes')}
						onBlur={() => onFieldBlur?.('notes')}
					/>
				</div>
			</div>
		</CollapsibleSection>
	)
}

export { ConditionSection }
