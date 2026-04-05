'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'
import { cn } from '@/lib/utils'
import type { SectionProps } from './types'

// Options are defined inside the component to access translations

const DEFAULT_VISIT = {
	type: '',
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
	const isOT = reportType === 'OT'

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
		<CollapsibleSection title={t('accidentInfo.visits.title')} className={className}>
			<div className="flex flex-col gap-6">
				{fields.map((field, index) => (
					<div key={field.id} className="relative rounded-lg border border-border bg-white p-4">
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
								<RadioGroup
									className="flex flex-wrap gap-2"
									onValueChange={(value) => {
										const event = { target: { name: `visits.${index}.type`, value } }
										register(`visits.${index}.type`).onChange(event)
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
									placeholder="Street address or po box"
									error={errors.visits?.[index]?.street?.message}
									{...register(`visits.${index}.street`)}
									onBlur={() => onFieldBlur?.(`visits.${index}.street`)}
								/>
								<TextField
									label={t('accidentInfo.postcode')}
									placeholder="eg 006312"
									error={errors.visits?.[index]?.postcode?.message}
									{...register(`visits.${index}.postcode`)}
									onBlur={() => onFieldBlur?.(`visits.${index}.postcode`)}
								/>
								<TextField
									label={t('accidentInfo.location')}
									placeholder="Berlin"
									error={errors.visits?.[index]?.location?.message}
									{...register(`visits.${index}.location`)}
									onBlur={() => onFieldBlur?.(`visits.${index}.location`)}
								/>
							</div>

							{/* Data | Expert | Vehicle condition — 3-column per Figma */}
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<TextField
									label={t('accidentInfo.visits.data')}
									type="date"
									error={errors.visits?.[index]?.date?.message}
									{...register(`visits.${index}.date`)}
									onBlur={() => onFieldBlur?.(`visits.${index}.date`)}
								/>
								<TextField
									label={t('accidentInfo.visits.expert')}
									placeholder={t('accidentInfo.visits.expertName')}
									error={errors.visits?.[index]?.expert?.message}
									{...register(`visits.${index}.expert`)}
									onBlur={() => onFieldBlur?.(`visits.${index}.expert`)}
								/>
								<SelectField
									label={t('accidentInfo.visits.vehicleCondition')}
									options={VEHICLE_CONDITION_OPTIONS}
									placeholder={t('accidentInfo.visits.chooseCondition')}
									error={errors.visits?.[index]?.vehicleCondition?.message}
									onValueChange={(value) => {
										const event = { target: { name: `visits.${index}.vehicleCondition`, value } }
										register(`visits.${index}.vehicleCondition`).onChange(event)
										onFieldBlur?.(`visits.${index}.vehicleCondition`)
									}}
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
							<div className="flex items-center gap-2">
								<Checkbox id="present-expert" />
								<Label htmlFor="present-expert" className="cursor-pointer font-normal">
									Expert Ketn Torres
								</Label>
							</div>
							<div className="flex items-center gap-2">
								<Checkbox id="present-client" />
								<Label htmlFor="present-client" className="cursor-pointer font-normal">
									{t('accidentInfo.visits.presentOptions.client')}
								</Label>
							</div>
							<div className="flex items-center gap-2">
								<Checkbox id="present-workshop" />
								<Label htmlFor="present-workshop" className="cursor-pointer font-normal">
									{t('accidentInfo.visits.presentOptions.workshopEmployee')}
								</Label>
							</div>
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
