'use client'

import { Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { useFieldProps, useSectionBadge } from '@/components/report/missing-info'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { MISSING_FIELD_CLASS, MissingBadge } from '@/components/ui/missing'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'
import { SECTION } from '@/lib/completeness'
import { cn } from '@/lib/utils'
import type { CalculationSectionProps } from './types'

function RepairSection({
	register,
	control,
	errors,
	onFieldBlur,
	className,
}: CalculationSectionProps) {
	const t = useTranslations('report.calculation')
	const tc = useTranslations('common')
	const fieldProps = useFieldProps({ register, errors, onFieldBlur })
	const badge = useSectionBadge(SECTION.repair)
	const {
		error: risksError,
		isMissing: risksMissing,
		missingLabel: risksMissingLabel,
		...risks
	} = fieldProps('risks')

	const WHEEL_ALIGNMENT_OPTIONS = [
		{ value: 'not_required', label: t('repair.wheelAlignmentOptions.notRequired') },
		{ value: 'required', label: t('repair.wheelAlignmentOptions.required') },
		{ value: 'completed', label: t('repair.wheelAlignmentOptions.completed') },
	]

	const BODY_MEASUREMENTS_OPTIONS = [
		{ value: 'not_required', label: t('repair.wheelAlignmentOptions.notRequired') },
		{ value: 'required', label: t('repair.wheelAlignmentOptions.required') },
		{ value: 'completed', label: t('repair.wheelAlignmentOptions.completed') },
	]

	const BODY_PAINT_OPTIONS = [
		{ value: 'not_required', label: t('repair.wheelAlignmentOptions.notRequired') },
		{ value: 'partial', label: t('repair.bodyPaintOptions.partial') },
		{ value: 'full', label: t('repair.bodyPaintOptions.full') },
	]

	return (
		<div className={cn('flex flex-col gap-5', className)}>
			{/* Section header */}
			<div className="flex items-center gap-2">
				<h4 className="text-body font-semibold text-black">{t('repair.title')}</h4>
				<Info className="h-4 w-4 text-grey-100" />
				<MissingBadge count={badge.missingCount} label={badge.missingLabel} />
			</div>

			{/* Wheel alignment + Body measurements on same row */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Controller
					name="wheelAlignment"
					control={control}
					render={({ field }) => (
						<SelectField
							label={t('repair.wheelAlignment')}
							options={WHEEL_ALIGNMENT_OPTIONS}
							placeholder={tc('select')}
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
							label={t('repair.bodyMeasurements')}
							options={BODY_MEASUREMENTS_OPTIONS}
							placeholder={tc('select')}
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
						label={t('repair.bodyPaint')}
						options={BODY_PAINT_OPTIONS}
						placeholder={tc('select')}
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
						<span className="text-body-sm text-black">{t('repair.plasticRepair')}</span>
					</label>
				)}
			/>

			{/* Repair Method - full width */}
			<TextField
				label={t('repair.repairMethod')}
				placeholder={t('repair.addMethod')}
				{...fieldProps('repairMethod')}
			/>

			{/* Risks - full width */}
			<div className="flex flex-col gap-3">
				<Label htmlFor="risks">{t('repair.risks')}</Label>
				<textarea
					id="risks"
					rows={4}
					placeholder={t('repair.addRisks')}
					data-missing={risksMissing && !risksError ? 'true' : undefined}
					aria-describedby={risksError ? 'risks-error' : risksMissing ? 'risks-missing' : undefined}
					className={cn(
						'w-full resize-y rounded-md border border-border bg-white px-4 py-3 text-body-sm text-black placeholder:text-placeholder focus:border-border-focus focus:outline-none',
						risksError && 'border-error focus:border-error',
						risksMissing && !risksError && MISSING_FIELD_CLASS,
					)}
					{...risks}
				/>
				{risksError && (
					<p id="risks-error" className="text-caption text-error" role="alert">
						{risksError}
					</p>
				)}
				{risksMissing && !risksError && (
					<span id="risks-missing" className="sr-only">
						{risksMissingLabel}
					</span>
				)}
			</div>
		</div>
	)
}

export { RepairSection }
