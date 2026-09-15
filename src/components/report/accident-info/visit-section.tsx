'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Controller, useFieldArray } from 'react-hook-form'
import { useFieldProps, useSectionBadge } from '@/components/report/missing-info'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'
import { useUserSettings } from '@/hooks/use-settings'
import { SECTION } from '@/lib/completeness'
import { cn } from '@/lib/utils'
import type { AccidentInfoFormData, SectionProps } from './types'

// Options are defined inside the component to access translations

type PresentKey = 'expert' | 'client' | 'workshopEmployee'

const PRESENT_KEYS: PresentKey[] = ['expert', 'client', 'workshopEmployee']

const PRESENT_FIELDS = {
	expert: 'presentExpert',
	client: 'presentClient',
	workshopEmployee: 'presentWorkshopEmployee',
} as const satisfies Record<PresentKey, keyof AccidentInfoFormData>

const DEFAULT_VISIT = {
	type: 'other',
	street: '',
	postcode: '',
	location: '',
	date: '',
	expert: '',
	vehicleCondition: '',
}

function VisitSection({
	control,
	register,
	errors,
	onFieldBlur,
	reportType,
	className,
}: SectionProps & { className?: string }) {
	const t = useTranslations('report')
	const fieldProps = useFieldProps({ register, errors, onFieldBlur })
	const badge = useSectionBadge(SECTION.visits)
	const { data: settings } = useUserSettings()
	const isOT = reportType === 'OT'

	const expertName = [settings?.firstName, settings?.lastName].filter(Boolean).join(' ')

	const PRESENT_LABELS: Record<PresentKey, string> = {
		expert: expertName
			? t('accidentInfo.visits.presentOptions.expertNamed', { name: expertName })
			: t('accidentInfo.visits.presentOptions.expert'),
		client: t('accidentInfo.visits.presentOptions.client'),
		workshopEmployee: t('accidentInfo.visits.presentOptions.workshopEmployee'),
	}

	const VISIT_TYPE_OPTIONS = [
		{ value: 'claimant_residence', label: t('accidentInfo.visits.typeOptions.claimantResidence') },
		{ value: 'claimant_office', label: t('accidentInfo.visits.typeOptions.claimantOffice') },
		{ value: 'other', label: t('accidentInfo.visits.typeOptions.other') },
	] as const

	const VEHICLE_CONDITION_OPTIONS = [
		{ value: 'drivable', label: t('accidentInfo.visits.conditionOptions.drivable') },
		{
			value: 'conditionally_drivable',
			label: t('accidentInfo.visits.conditionOptions.conditionallyDrivable'),
		},
		{ value: 'not_drivable', label: t('accidentInfo.visits.conditionOptions.notDrivable') },
		{ value: 'total_loss', label: t('accidentInfo.visits.conditionOptions.totalLoss') },
	]

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'visits',
	})

	return (
		<CollapsibleSection title={t('accidentInfo.visits.title')} className={className} {...badge}>
			<div className="flex flex-col gap-6">
				{fields.map((row, index) => (
					<div key={row.id} className="relative rounded-lg border border-border bg-white p-4">
						<div className="mb-4 flex items-center justify-between">
							<span className="text-body-sm font-semibold text-black">
								{t('accidentInfo.visits.visitIndex', { index: index + 1 })}
							</span>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => remove(index)}
								aria-label={t('accidentInfo.visits.removeVisit')}
							>
								<Trash2 className="h-4 w-4 text-grey-100" />
							</Button>
						</div>

						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-1">
								<Label>{t('accidentInfo.visits.type')}</Label>
								<Controller
									control={control}
									name={`visits.${index}.type`}
									render={({ field: typeField }) => (
										<RadioGroup
											className="flex flex-wrap gap-2"
											value={typeField.value || ''}
											onValueChange={(value) => {
												typeField.onChange(value)
												onFieldBlur?.(`visits.${index}.type`)
											}}
										>
											{VISIT_TYPE_OPTIONS.map((option) => (
												<label
													key={option.value}
													className={cn(
														'flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-body-sm transition-colors hover:bg-grey-25',
													)}
												>
													<RadioGroupItem value={option.value} />
													<span>{option.label}</span>
												</label>
											))}
										</RadioGroup>
									)}
								/>
								{errors.visits?.[index]?.type?.message && (
									<p className="text-caption text-error" role="alert">
										{errors.visits[index]?.type?.message}
									</p>
								)}
							</div>

							{/* Street | Postcode | Location — 3-column per Figma */}
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<TextField
									label={t('accidentInfo.street')}
									placeholder={t('accidentInfo.streetPlaceholder')}
									{...fieldProps(`visits.${index}.street`)}
								/>
								<TextField
									label={t('accidentInfo.postcode')}
									placeholder={t('accidentInfo.postcodePlaceholder')}
									{...fieldProps(`visits.${index}.postcode`)}
								/>
								<TextField
									label={t('accidentInfo.location')}
									placeholder="Berlin"
									{...fieldProps(`visits.${index}.location`)}
								/>
							</div>

							{/* Data | Expert | Vehicle condition — 3-column per Figma */}
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<TextField
									label={t('accidentInfo.visits.data')}
									type="date"
									{...fieldProps(`visits.${index}.date`)}
								/>
								<TextField
									label={t('accidentInfo.visits.expert')}
									placeholder={t('accidentInfo.visits.expertName')}
									{...fieldProps(`visits.${index}.expert`)}
								/>
								<Controller
									control={control}
									name={`visits.${index}.vehicleCondition`}
									render={({ field: conditionField }) => (
										<SelectField
											label={t('accidentInfo.visits.vehicleCondition')}
											options={VEHICLE_CONDITION_OPTIONS}
											placeholder={t('accidentInfo.visits.chooseCondition')}
											value={conditionField.value ?? ''}
											error={errors.visits?.[index]?.vehicleCondition?.message}
											onValueChange={(value) => {
												conditionField.onChange(value)
												onFieldBlur?.(`visits.${index}.vehicleCondition`)
											}}
										/>
									)}
								/>
							</div>
						</div>
					</div>
				))}

				{/* Present subsection — OT only */}
				{isOT && (
					<div className="flex flex-col gap-3">
						<Label className="text-body-sm font-semibold">{t('accidentInfo.visits.present')}</Label>
						<div className="flex flex-wrap items-center gap-4">
							{PRESENT_KEYS.map((key) => (
								<Controller
									key={key}
									name={PRESENT_FIELDS[key]}
									control={control}
									render={({ field }) => (
										<div className="flex items-center gap-2">
											<Checkbox
												id={`present-${key}`}
												checked={!!field.value}
												onCheckedChange={(checked) => {
													field.onChange(checked === true)
													onFieldBlur?.(PRESENT_FIELDS[key])
												}}
											/>
											<Label htmlFor={`present-${key}`} className="cursor-pointer font-normal">
												{PRESENT_LABELS[key]}
											</Label>
										</div>
									)}
								/>
							))}
						</div>
					</div>
				)}

				<Button
					type="button"
					variant="outline"
					onClick={() => append(DEFAULT_VISIT)}
					icon={<Plus className="h-4 w-4" />}
				>
					{t('accidentInfo.visits.addVisit')}
				</Button>
			</div>
		</CollapsibleSection>
	)
}

export { VisitSection }
