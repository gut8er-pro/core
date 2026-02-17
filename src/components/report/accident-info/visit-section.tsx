'use client'

import { useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { SelectField } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { SectionProps } from './types'

const VISIT_TYPE_OPTIONS = [
	{ value: 'claimant_residence', label: 'Claimant Residence' },
	{ value: 'claimant_office', label: 'Claimant Office' },
	{ value: 'other', label: 'Other' },
] as const

const VEHICLE_CONDITION_OPTIONS = [
	{ value: 'drivable', label: 'Drivable' },
	{ value: 'conditionally_drivable', label: 'Conditionally Drivable' },
	{ value: 'not_drivable', label: 'Not Drivable' },
	{ value: 'total_loss', label: 'Total Loss' },
]

const DEFAULT_VISIT = {
	type: '',
	street: '',
	postcode: '',
	location: '',
	date: '',
	expert: '',
	vehicleCondition: '',
}

function VisitSection({ control, register, errors, onFieldBlur, className }: SectionProps & { className?: string }) {
	const { fields, append, remove } = useFieldArray({
		control,
		name: 'visits',
	})

	return (
		<CollapsibleSection title="Visits" className={className}>
			<div className="flex flex-col gap-6">
				{fields.map((field, index) => (
					<div
						key={field.id}
						className="relative rounded-lg border border-border bg-white p-4"
					>
						<div className="mb-4 flex items-center justify-between">
							<span className="text-body-sm font-semibold text-black">
								Visit {index + 1}
							</span>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => remove(index)}
								aria-label={`Remove visit ${index + 1}`}
							>
								<Trash2 className="h-4 w-4 text-grey-100" />
							</Button>
						</div>

						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-1">
								<Label>Type</Label>
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
									label="Street & house number or PO box"
									placeholder="Street address or po box"
									error={errors.visits?.[index]?.street?.message}
									{...register(`visits.${index}.street`)}
									onBlur={() => onFieldBlur?.(`visits.${index}.street`)}
								/>
								<TextField
									label="Postcode"
									placeholder="eg 006312"
									error={errors.visits?.[index]?.postcode?.message}
									{...register(`visits.${index}.postcode`)}
									onBlur={() => onFieldBlur?.(`visits.${index}.postcode`)}
								/>
								<TextField
									label="Location"
									placeholder="Berlin"
									error={errors.visits?.[index]?.location?.message}
									{...register(`visits.${index}.location`)}
									onBlur={() => onFieldBlur?.(`visits.${index}.location`)}
								/>
							</div>

							{/* Data | Expert | Vehicle condition — 3-column per Figma */}
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<TextField
									label="Data"
									type="date"
									error={errors.visits?.[index]?.date?.message}
									{...register(`visits.${index}.date`)}
									onBlur={() => onFieldBlur?.(`visits.${index}.date`)}
								/>
								<TextField
									label="Expert"
									placeholder="Expert name"
									error={errors.visits?.[index]?.expert?.message}
									{...register(`visits.${index}.expert`)}
									onBlur={() => onFieldBlur?.(`visits.${index}.expert`)}
								/>
								<SelectField
									label="Vehicle condition"
									options={VEHICLE_CONDITION_OPTIONS}
									placeholder="Choose condition"
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

				<Button
					type="button"
					variant="outline"
					onClick={() => append(DEFAULT_VISIT)}
					icon={<Plus className="h-4 w-4" />}
				>
					Add Visit
				</Button>
			</div>
		</CollapsibleSection>
	)
}

export { VisitSection }
