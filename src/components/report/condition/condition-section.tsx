'use client'

import { QrCode } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Controller, type Path } from 'react-hook-form'
import {
	useControlledFieldProps,
	useFieldProps,
	useMissingProps,
	useSectionBadge,
} from '@/components/report/missing-info'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { ComboField } from '@/components/ui/combo-field'
import { DateField } from '@/components/ui/date-field'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'
import { YesNoField } from '@/components/ui/yes-no-field'
import { SECTION } from '@/lib/completeness'
import { cn } from '@/lib/utils'
import { EmissionSticker } from './emission-sticker'
import { formatMileage, toMileageDigits } from './mileage'
import type { ConditionFormData, ConditionSectionProps } from './types'
import { EMISSION_GROUPS, MILEAGE_UNITS } from './types'

// Options are defined inside the component to access translations

type CheckboxPillProps = {
	label: string
	checked: boolean
	disabled?: boolean
	onChange: (checked: boolean) => void
}

function CheckboxPill({ label, checked, disabled, onChange }: CheckboxPillProps) {
	return (
		<button
			type="button"
			onClick={() => onChange(!checked)}
			disabled={disabled}
			className={cn(
				'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-body-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
				checked
					? 'border-primary bg-primary-light text-primary'
					: 'border-border bg-white text-grey-100 hover:bg-grey-25',
			)}
		>
			{checked && (
				<svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
					<path
						fillRule="evenodd"
						d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
						clipRule="evenodd"
					/>
				</svg>
			)}
			{label}
		</button>
	)
}

type MileageFieldProps = {
	label: string
	placeholder: string
	name: string
	disabled?: boolean
	error?: string
	isMissing?: boolean
	missingLabel?: string
	field: { value: unknown; onChange: (value: unknown) => void }
	onFieldBlur?: (field: string) => void
}

/**
 * Mileage reads as a German number but stores plain digits. The mask runs on
 * change so the grouping keeps up with typing; the caret stays put because
 * every edit that matters here happens at the end of the value.
 */
function MileageField({
	label,
	placeholder,
	name,
	disabled,
	error,
	isMissing,
	missingLabel,
	field,
	onFieldBlur,
}: MileageFieldProps) {
	return (
		<TextField
			label={label}
			name={name}
			type="text"
			inputMode="numeric"
			autoComplete="off"
			placeholder={placeholder}
			disabled={disabled}
			error={error}
			isMissing={isMissing}
			missingLabel={missingLabel}
			value={formatMileage(String(field.value ?? ''))}
			onChange={(event) => field.onChange(toMileageDigits(event.target.value))}
			onBlur={() => onFieldBlur?.(name)}
		/>
	)
}

function ConditionSection({
	register,
	control,
	errors,
	onFieldBlur,
	disabled,
	className,
}: ConditionSectionProps) {
	const t = useTranslations('report')
	const tc = useTranslations('common')
	const fieldProps = useFieldProps({ register, errors, onFieldBlur })
	const controlled = useControlledFieldProps({ errors, onFieldBlur })
	const missing = useMissingProps()
	const badge = useSectionBadge(SECTION.condition)

	// Free typing means a keystroke is not a decision: the combos keep the
	// shared value/error/missing wiring but defer the save to blur, where a
	// select's single pick already lands.
	const comboProps = (
		name: Path<ConditionFormData>,
		field: { value: unknown; onChange: (value: unknown) => void },
	) => {
		const { onValueChange: _saveOnChange, ...rest } = controlled(name, field)
		return {
			...rest,
			name,
			disabled,
			value: rest.value ?? '',
			onValueChange: (value: string) => field.onChange(value),
			onBlur: () => onFieldBlur?.(name),
		}
	}

	const PAINT_TYPE_OPTIONS = [
		{ value: 'Uni (2 Schicht)', label: t('condition.paintTypeOptions.uni') },
		{ value: 'Metallic', label: t('condition.paintTypeOptions.metallic') },
		{ value: 'Pearl', label: t('condition.paintTypeOptions.pearl') },
		{ value: 'Matte', label: t('condition.paintTypeOptions.matte') },
	]

	const PAINT_OPTIONS = [
		{ value: 'Original manufacturer paint', label: t('condition.paintOptions.original') },
		{ value: 'Repainted', label: t('condition.paintOptions.repainted') },
		{ value: 'Mixed', label: t('condition.paintOptions.mixed') },
	]

	const PAINT_CONDITION_OPTIONS = [
		{ value: 'Good', label: t('condition.paintConditionOptions.good') },
		{ value: 'Fair', label: t('condition.paintConditionOptions.fair') },
		{ value: 'Poor', label: t('condition.paintConditionOptions.poor') },
	]

	const GENERAL_CONDITION_OPTIONS = [
		{ value: 'Well maintained', label: t('condition.generalConditionOptions.wellMaintained') },
		{ value: 'Average', label: t('condition.generalConditionOptions.average') },
		{ value: 'Poor', label: t('condition.paintConditionOptions.poor') },
	]

	const BODY_CONDITION_OPTIONS = [
		{ value: 'Minor cosmetic', label: t('condition.bodyConditionOptions.minorCosmetic') },
		{ value: 'No damage', label: t('condition.bodyConditionOptions.noDamage') },
		{ value: 'Structural damage', label: t('condition.bodyConditionOptions.structuralDamage') },
	]

	const INTERIOR_CONDITION_OPTIONS = [
		{ value: 'Clean, no structural damage.', label: t('condition.interiorConditionOptions.clean') },
		{ value: 'Minor wear', label: t('condition.interiorConditionOptions.minorWear') },
		{ value: 'Significant wear', label: t('condition.interiorConditionOptions.significantWear') },
	]

	const DRIVING_ABILITY_OPTIONS = [
		{ value: 'Roadworthy', label: t('condition.drivingAbilityOptions.roadworthy') },
		{ value: 'Limited', label: t('condition.drivingAbilityOptions.limited') },
		{ value: 'Not roadworthy', label: t('condition.drivingAbilityOptions.notRoadworthy') },
	]

	const UNIT_OPTIONS = MILEAGE_UNITS.map((unit) => ({
		value: unit,
		label: t(`condition.unitOptions.${unit}`),
	}))

	return (
		<CollapsibleSection
			title={t('condition.vehicleCondition')}
			info
			defaultOpen
			className={className}
			{...badge}
		>
			<div className="flex flex-col gap-6">
				{/* Row 1: Paint type / Paint / Paint condition */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<Controller
						name="paintType"
						control={control}
						render={({ field }) => (
							<ComboField
								label={t('condition.paintType')}
								options={PAINT_TYPE_OPTIONS}
								placeholder={tc('select')}
								{...comboProps('paintType', field)}
							/>
						)}
					/>

					<Controller
						name="hard"
						control={control}
						render={({ field }) => (
							<ComboField
								label={t('condition.paint')}
								options={PAINT_OPTIONS}
								placeholder={tc('select')}
								{...comboProps('hard', field)}
							/>
						)}
					/>

					<Controller
						name="paintCondition"
						control={control}
						render={({ field }) => (
							<ComboField
								label={t('condition.paintCondition')}
								options={PAINT_CONDITION_OPTIONS}
								placeholder={tc('select')}
								{...comboProps('paintCondition', field)}
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
							<ComboField
								label={t('condition.generalCondition')}
								options={GENERAL_CONDITION_OPTIONS}
								placeholder={tc('select')}
								{...comboProps('generalCondition', field)}
							/>
						)}
					/>

					<Controller
						name="bodyCondition"
						control={control}
						render={({ field }) => (
							<ComboField
								label={t('condition.bodyCondition')}
								options={BODY_CONDITION_OPTIONS}
								placeholder={tc('select')}
								{...comboProps('bodyCondition', field)}
							/>
						)}
					/>

					<Controller
						name="interiorCondition"
						control={control}
						render={({ field }) => (
							<ComboField
								label={t('condition.interiorCondition')}
								options={INTERIOR_CONDITION_OPTIONS}
								placeholder={tc('select')}
								{...comboProps('interiorCondition', field)}
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
							<ComboField
								label={t('condition.drivingAbility')}
								options={DRIVING_ABILITY_OPTIONS}
								placeholder={tc('select')}
								{...comboProps('drivingAbility', field)}
							/>
						)}
					/>

					<TextField
						label={t('condition.vehicleColor')}
						placeholder={t('condition.vehicleColorPlaceholder')}
						disabled={disabled}
						{...fieldProps('vehicleColor')}
					/>

					<TextField
						label={t('condition.specialFeatures')}
						placeholder={t('condition.parkingSensors')}
						disabled={disabled}
						{...fieldProps('specialFeatures')}
					/>
				</div>

				{/* Row 4: Mileage Read / Estimation mileage / Unit in km */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<Controller
						name="mileageRead"
						control={control}
						render={({ field }) => (
							<MileageField
								label={t('condition.mileageRead')}
								placeholder={t('condition.mileagePlaceholder')}
								disabled={disabled}
								field={field}
								onFieldBlur={onFieldBlur}
								name="mileageRead"
								error={errors.mileageRead?.message}
								{...missing('mileageRead')}
							/>
						)}
					/>

					<Controller
						name="estimateMileage"
						control={control}
						render={({ field }) => (
							<MileageField
								label={t('condition.estimationMileage')}
								placeholder={t('condition.mileagePlaceholder')}
								disabled={disabled}
								field={field}
								onFieldBlur={onFieldBlur}
								name="estimateMileage"
								error={errors.estimateMileage?.message}
								{...missing('estimateMileage')}
							/>
						)}
					/>

					<Controller
						name="unit"
						control={control}
						render={({ field }) => (
							<SelectField
								label={t('condition.unitInKm')}
								options={UNIT_OPTIONS}
								value={field.value || 'km'}
								disabled={disabled}
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
						<DateField
							label={t('condition.nextMot')}
							disabled={disabled}
							{...fieldProps('nextMot')}
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
								label={t('condition.fullServiceHistory')}
								checked={field.value}
								disabled={disabled}
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
								label={t('condition.testDrivePerformed')}
								checked={field.value}
								disabled={disabled}
								onChange={(checked) => {
									field.onChange(checked)
									onFieldBlur?.('testDrivePerformed')
								}}
							/>
						)}
					/>
					<Controller
						name="parkingSensors"
						control={control}
						render={({ field }) => (
							<CheckboxPill
								label={t('condition.parkingSensors')}
								checked={field.value}
								disabled={disabled}
								onChange={(checked) => {
									field.onChange(checked)
									onFieldBlur?.('parkingSensors')
								}}
							/>
						)}
					/>
				</div>

				{/* Findings the report states outright — answered yes or no, never
				    left to an unchecked box that reads as "no". */}
				<div className="flex flex-wrap items-start gap-8">
					<Controller
						name="airbagsDeployed"
						control={control}
						render={({ field }) => (
							<YesNoField
								label={t('condition.airbagsDeployed')}
								value={field.value}
								disabled={disabled}
								onChange={(answer) => {
									field.onChange(answer)
									onFieldBlur?.('airbagsDeployed')
								}}
								yesLabel={tc('yes')}
								noLabel={tc('no')}
								{...missing('airbagsDeployed')}
							/>
						)}
					/>
					<Controller
						name="errorMemoryRead"
						control={control}
						render={({ field }) => (
							<YesNoField
								label={t('condition.errorMemoryRead')}
								value={field.value}
								disabled={disabled}
								onChange={(answer) => {
									field.onChange(answer)
									onFieldBlur?.('errorMemoryRead')
								}}
								yesLabel={tc('yes')}
								noLabel={tc('no')}
								{...missing('errorMemoryRead')}
							/>
						)}
					/>
				</div>

				{/* Schadstoffplakette */}
				<Controller
					name="emissionGroup"
					control={control}
					render={({ field }) => (
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="text-body-sm font-medium text-black">
									{t('condition.multiHitGroups')}
								</span>
							</div>
							<div className="flex items-center gap-1">
								{EMISSION_GROUPS.map((group) => (
									<EmissionSticker
										key={group}
										group={group}
										selected={field.value === group}
										disabled={disabled}
										label={
											group === '1'
												? t('condition.emissionGroupNone')
												: t('condition.emissionGroupLabel', { group })
										}
										onClick={() => {
											// Clicking the active group clears it: unknown stays
											// unknown, and the report omits it.
											field.onChange(field.value === group ? null : group)
											onFieldBlur?.('emissionGroup')
										}}
									/>
								))}
							</div>
						</div>
					)}
				/>

				{/* Notes */}
				<div className="flex flex-col gap-1">
					<span className="text-body-sm font-medium text-black">{t('condition.notes')}</span>
					<textarea
						className="min-h-30 w-full rounded-md border border-border bg-white px-4 py-3 text-body-sm text-black placeholder:text-placeholder focus:border-border-focus focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						placeholder={t('condition.addNotes')}
						disabled={disabled}
						{...register('notes')}
						onBlur={() => onFieldBlur?.('notes')}
					/>
				</div>
			</div>
		</CollapsibleSection>
	)
}

export { ConditionSection }
