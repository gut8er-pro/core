'use client'

import { Controller } from 'react-hook-form'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { SelectField } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import type { ConditionSectionProps } from './types'

const PAINT_TYPE_OPTIONS = [
	{ value: 'original', label: 'Original' },
	{ value: 'repainted', label: 'Repainted' },
	{ value: 'mixed', label: 'Mixed' },
]

const CONDITION_OPTIONS = [
	{ value: 'excellent', label: 'Excellent' },
	{ value: 'good', label: 'Good' },
	{ value: 'fair', label: 'Fair' },
	{ value: 'poor', label: 'Poor' },
]

const UNIT_OPTIONS = [
	{ value: 'km', label: 'km' },
	{ value: 'miles', label: 'miles' },
]

function ConditionSection({
	register,
	control,
	errors,
	onFieldBlur,
	className,
}: ConditionSectionProps) {
	return (
		<CollapsibleSection title="Vehicle Condition" defaultOpen className={className}>
			<div className="flex flex-col gap-6">
				{/* Paint & General Condition */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					<Controller
						name="paintType"
						control={control}
						render={({ field }) => (
							<SelectField
								label="Paint Type"
								options={PAINT_TYPE_OPTIONS}
								placeholder="Select paint type"
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
						name="generalCondition"
						control={control}
						render={({ field }) => (
							<SelectField
								label="General Condition"
								options={CONDITION_OPTIONS}
								placeholder="Select condition"
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
						name="paintCondition"
						control={control}
						render={({ field }) => (
							<SelectField
								label="Paint Condition"
								options={CONDITION_OPTIONS}
								placeholder="Select paint condition"
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

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					<Controller
						name="bodyCondition"
						control={control}
						render={({ field }) => (
							<SelectField
								label="Body Condition"
								options={CONDITION_OPTIONS}
								placeholder="Select body condition"
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
								label="Interior Condition"
								options={CONDITION_OPTIONS}
								placeholder="Select interior condition"
								value={field.value}
								onValueChange={(val) => {
									field.onChange(val)
									onFieldBlur?.('interiorCondition')
								}}
								error={errors.interiorCondition?.message}
							/>
						)}
					/>

					<TextField
						label="Driving Ability"
						placeholder="e.g. Roadworthy, Limited"
						error={errors.drivingAbility?.message}
						{...register('drivingAbility')}
						onBlur={() => onFieldBlur?.('drivingAbility')}
					/>
				</div>

				{/* Mileage row */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label="Mileage (Read)"
						type="number"
						placeholder="Enter mileage"
						error={errors.mileageRead?.message}
						{...register('mileageRead')}
						onBlur={() => onFieldBlur?.('mileageRead')}
					/>

					<TextField
						label="Mileage (Estimated)"
						type="number"
						placeholder="Estimated mileage"
						error={errors.estimateMileage?.message}
						{...register('estimateMileage')}
						onBlur={() => onFieldBlur?.('estimateMileage')}
					/>

					<Controller
						name="unit"
						control={control}
						render={({ field }) => (
							<SelectField
								label="Unit"
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

				{/* Additional fields */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<TextField
						label="Hard"
						placeholder="Hardness details"
						error={errors.hard?.message}
						{...register('hard')}
						onBlur={() => onFieldBlur?.('hard')}
					/>

					<TextField
						label="Next MOT"
						type="date"
						error={errors.nextMot?.message}
						{...register('nextMot')}
						onBlur={() => onFieldBlur?.('nextMot')}
					/>
				</div>

				<TextField
					label="Special Features"
					placeholder="Enter any special features or equipment"
					error={errors.specialFeatures?.message}
					{...register('specialFeatures')}
					onBlur={() => onFieldBlur?.('specialFeatures')}
				/>

				{/* Checkboxes */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<Controller
						name="parkingSensors"
						control={control}
						render={({ field }) => (
							<label className="flex items-center gap-2 cursor-pointer">
								<Checkbox
									checked={field.value}
									onCheckedChange={(checked) => {
										field.onChange(checked)
										onFieldBlur?.('parkingSensors')
									}}
								/>
								<span className="text-body-sm text-black">Parking Sensors</span>
							</label>
						)}
					/>

					<Controller
						name="fullServiceHistory"
						control={control}
						render={({ field }) => (
							<label className="flex items-center gap-2 cursor-pointer">
								<Checkbox
									checked={field.value}
									onCheckedChange={(checked) => {
										field.onChange(checked)
										onFieldBlur?.('fullServiceHistory')
									}}
								/>
								<span className="text-body-sm text-black">Full Service History</span>
							</label>
						)}
					/>

					<Controller
						name="testDrivePerformed"
						control={control}
						render={({ field }) => (
							<label className="flex items-center gap-2 cursor-pointer">
								<Checkbox
									checked={field.value}
									onCheckedChange={(checked) => {
										field.onChange(checked)
										onFieldBlur?.('testDrivePerformed')
									}}
								/>
								<span className="text-body-sm text-black">Test Drive Performed</span>
							</label>
						)}
					/>

					<Controller
						name="errorMemoryRead"
						control={control}
						render={({ field }) => (
							<label className="flex items-center gap-2 cursor-pointer">
								<Checkbox
									checked={field.value}
									onCheckedChange={(checked) => {
										field.onChange(checked)
										onFieldBlur?.('errorMemoryRead')
									}}
								/>
								<span className="text-body-sm text-black">Error Memory Read</span>
							</label>
						)}
					/>

					<Controller
						name="airbagsDeployed"
						control={control}
						render={({ field }) => (
							<label className="flex items-center gap-2 cursor-pointer">
								<Checkbox
									checked={field.value}
									onCheckedChange={(checked) => {
										field.onChange(checked)
										onFieldBlur?.('airbagsDeployed')
									}}
								/>
								<span className="text-body-sm text-black">Airbags Deployed</span>
							</label>
						)}
					/>
				</div>

				{/* Notes */}
				<TextField
					label="Notes"
					placeholder="Additional notes about vehicle condition"
					error={errors.notes?.message}
					{...register('notes')}
					onBlur={() => onFieldBlur?.('notes')}
				/>
			</div>
		</CollapsibleSection>
	)
}

export { ConditionSection }
