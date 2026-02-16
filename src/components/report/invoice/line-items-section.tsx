'use client'

import type { ReactNode } from 'react'
import { Controller, useFieldArray } from 'react-hook-form'
import { Plus } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { InvoiceSectionProps } from './types'

function formatEUR(value: number): string {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
	}).format(value)
}

type LineItemsSectionProps = InvoiceSectionProps & {
	bvskContent?: ReactNode
}

function LineItemsSection({
	register,
	control,
	errors,
	onFieldBlur,
	className,
	bvskContent,
}: LineItemsSectionProps) {
	const { fields, append } = useFieldArray({
		control,
		name: 'lineItems',
	})

	return (
		<CollapsibleSection title="Item Details" info defaultOpen className={className}>
			<div className="flex flex-col gap-5">
				{/* BVSK rate table content, passed from parent */}
				{bvskContent}

				{/* Column headers */}
				<div className="hidden border-b border-border pb-2 md:grid md:grid-cols-12 md:gap-4 md:px-1">
					<span className="col-span-3 text-caption font-medium text-grey-100">
						Description
					</span>
					<span className="col-span-2 text-caption font-medium text-grey-100">
						Special Feature
					</span>
					<span className="col-span-2 text-caption font-medium text-grey-100 text-center">
					</span>
					<span className="col-span-2 text-caption font-medium text-grey-100">
						Rate
					</span>
					<span className="col-span-3 text-caption font-medium text-grey-100 text-right">
						Amount
					</span>
				</div>

				{/* Line item rows */}
				{fields.map((field, index) => {
					const amountVal = parseFloat(
						(document.querySelector<HTMLInputElement>(
							`[name="lineItems.${index}.amount"]`,
						)?.value ?? '0'),
					) || 0

					return (
						<div
							key={field.id}
							className={cn(
								'flex flex-col gap-2 border-b border-border pb-4 last:border-b-0',
								'md:grid md:grid-cols-12 md:items-center md:gap-4 md:px-1',
							)}
						>
							{/* Description */}
							<div className="md:col-span-3">
								<TextField
									label="Description"
									placeholder="Service description"
									error={errors.lineItems?.[index]?.description?.message}
									{...register(`lineItems.${index}.description`)}
									onBlur={() => onFieldBlur?.(`lineItems.${index}.description`)}
									className="md:[&>label]:hidden"
								/>
							</div>

							{/* Special Feature with Lump Sum checkbox */}
							<div className="md:col-span-2 flex items-center gap-2">
								<Controller
									name={`lineItems.${index}.isLumpSum`}
									control={control}
									render={({ field: checkboxField }) => (
										<label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
											<Checkbox
												checked={checkboxField.value}
												onCheckedChange={(checked) => {
													checkboxField.onChange(checked)
													onFieldBlur?.(`lineItems.${index}.isLumpSum`)
												}}
											/>
											<span className="text-body-sm text-black">Lump sum</span>
										</label>
									)}
								/>
							</div>

							{/* Rate */}
							<div className="md:col-span-2" />

							<div className="md:col-span-2">
								<TextField
									label="Rate"
									type="number"
									prefix="EUR"
									placeholder="0,00"
									step="0.01"
									error={errors.lineItems?.[index]?.rate?.message}
									{...register(`lineItems.${index}.rate`)}
									onBlur={() => onFieldBlur?.(`lineItems.${index}.rate`)}
									className="md:[&>label]:hidden"
								/>
							</div>

							{/* Amount */}
							<div className="md:col-span-3 flex items-center justify-end">
								<span className="text-body font-semibold text-black">
									{formatEUR(amountVal)}
								</span>
							</div>
						</div>
					)
				})}

				{/* Add Row button */}
				<Button
					type="button"
					variant="primary"
					size="sm"
					icon={<Plus className="h-4 w-4" />}
					onClick={() =>
						append({
							description: '',
							specialFeature: '',
							isLumpSum: false,
							rate: '',
							amount: '',
							quantity: '1',
						})
					}
					className="self-start"
				>
					Add Row
				</Button>
			</div>
		</CollapsibleSection>
	)
}

export { LineItemsSection }
