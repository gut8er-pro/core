'use client'

import { Controller, useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
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

function LineItemsSection({
	register,
	control,
	errors,
	onFieldBlur,
	className,
}: InvoiceSectionProps) {
	const { fields, append, remove } = useFieldArray({
		control,
		name: 'lineItems',
	})

	const total = fields.reduce((sum, _field, index) => {
		const el = document.querySelector<HTMLInputElement>(
			`[name="lineItems.${index}.amount"]`,
		)
		const val = el ? parseFloat(el.value) : 0
		return sum + (isNaN(val) ? 0 : val)
	}, 0)

	return (
		<CollapsibleSection title="Line Items" defaultOpen className={className}>
			<div className="flex flex-col gap-4">
				{/* Header row */}
				<div className="hidden md:grid md:grid-cols-12 md:gap-4 md:px-4">
					<span className="col-span-3 text-caption font-medium text-grey-100">
						Description
					</span>
					<span className="col-span-2 text-caption font-medium text-grey-100">
						Special Feature
					</span>
					<span className="col-span-1 text-caption font-medium text-grey-100 text-center">
						Lump Sum
					</span>
					<span className="col-span-2 text-caption font-medium text-grey-100 text-right">
						Rate
					</span>
					<span className="col-span-1 text-caption font-medium text-grey-100 text-right">
						Qty
					</span>
					<span className="col-span-2 text-caption font-medium text-grey-100 text-right">
						Amount
					</span>
					<span className="col-span-1" />
				</div>

				{/* Line item rows */}
				{fields.map((field, index) => (
					<div
						key={field.id}
						className={cn(
							'flex flex-col gap-2 rounded-lg border border-border bg-white p-4',
							'md:grid md:grid-cols-12 md:items-end md:gap-4 md:p-4',
						)}
					>
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

						<div className="md:col-span-2">
							<TextField
								label="Special Feature"
								placeholder="Optional"
								error={errors.lineItems?.[index]?.specialFeature?.message}
								{...register(`lineItems.${index}.specialFeature`)}
								onBlur={() => onFieldBlur?.(`lineItems.${index}.specialFeature`)}
								className="md:[&>label]:hidden"
							/>
						</div>

						<div className="md:col-span-1 flex items-center justify-center">
							<Controller
								name={`lineItems.${index}.isLumpSum`}
								control={control}
								render={({ field: checkboxField }) => (
									<label className="flex items-center gap-2 cursor-pointer">
										<Checkbox
											checked={checkboxField.value}
											onCheckedChange={(checked) => {
												checkboxField.onChange(checked)
												onFieldBlur?.(`lineItems.${index}.isLumpSum`)
											}}
										/>
										<span className="text-body-sm text-black md:hidden">
											Lump Sum
										</span>
									</label>
								)}
							/>
						</div>

						<div className="md:col-span-2">
							<TextField
								label="Rate"
								type="number"
								prefix="EUR"
								placeholder="0.00"
								step="0.01"
								error={errors.lineItems?.[index]?.rate?.message}
								{...register(`lineItems.${index}.rate`)}
								onBlur={() => onFieldBlur?.(`lineItems.${index}.rate`)}
								className="md:[&>label]:hidden"
							/>
						</div>

						<div className="md:col-span-1">
							<TextField
								label="Qty"
								type="number"
								placeholder="1"
								step="1"
								error={errors.lineItems?.[index]?.quantity?.message}
								{...register(`lineItems.${index}.quantity`)}
								onBlur={() => onFieldBlur?.(`lineItems.${index}.quantity`)}
								className="md:[&>label]:hidden"
							/>
						</div>

						<div className="md:col-span-2">
							<TextField
								label="Amount"
								type="number"
								prefix="EUR"
								placeholder="0.00"
								step="0.01"
								error={errors.lineItems?.[index]?.amount?.message}
								{...register(`lineItems.${index}.amount`)}
								onBlur={() => onFieldBlur?.(`lineItems.${index}.amount`)}
								className="md:[&>label]:hidden"
							/>
						</div>

						<div className="md:col-span-1 flex items-center justify-end">
							<Button
								type="button"
								variant="danger"
								size="icon"
								onClick={() => remove(index)}
								aria-label="Delete line item"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</div>
				))}

				{/* Totals row */}
				{fields.length > 0 && (
					<div className="flex items-center justify-end gap-4 border-t border-border px-4 pt-4">
						<span className="text-body-sm font-semibold text-black">
							Total:
						</span>
						<span className="text-body font-bold text-black">
							{formatEUR(total)}
						</span>
					</div>
				)}

				{/* Add row button */}
				<Button
					type="button"
					variant="outline"
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
