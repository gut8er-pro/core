'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Controller, useFieldArray, useWatch } from 'react-hook-form'
import { useFieldProps, useSectionBadge } from '@/components/report/missing-info'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { SECTION } from '@/lib/completeness'
import { defaultLineItemByKey, lineItemAmount } from '@/lib/invoice/default-line-items'
import { cn } from '@/lib/utils'
import type { InvoiceSectionProps } from './types'

function formatEUR(value: number): string {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
	}).format(value)
}

type LineItemRowProps = InvoiceSectionProps & {
	index: number
	onRemove: (index: number) => void
}

function LineItemRow({
	register,
	control,
	errors,
	onFieldBlur,
	index,
	onRemove,
}: LineItemRowProps) {
	const t = useTranslations('report.invoice')
	const fieldProps = useFieldProps({ register, errors, onFieldBlur })
	const rate = useWatch({ control, name: `lineItems.${index}.rate` })
	const qty = useWatch({ control, name: `lineItems.${index}.quantity` })
	const isLumpSum = useWatch({ control, name: `lineItems.${index}.isLumpSum` })
	const key = useWatch({ control, name: `lineItems.${index}.specialFeature` })

	const defaultItem = defaultLineItemByKey(key)
	const lumpSumOnly = defaultItem?.lumpSumOnly ?? false
	const showQuantity = !lumpSumOnly && !isLumpSum
	const amountVal = lineItemAmount({ specialFeature: key, isLumpSum, rate, quantity: qty })

	return (
		<div
			className={cn(
				'flex flex-col gap-2 border-b border-border pb-4 last:border-b-0',
				'md:grid md:grid-cols-12 md:items-center md:gap-4 md:px-1',
			)}
		>
			<div className="md:col-span-3">
				<TextField
					label={t('description')}
					placeholder={t('serviceDescription')}
					{...fieldProps(`lineItems.${index}.description`)}
					className="md:[&>label]:hidden"
				/>
			</div>

			<div className="md:col-span-2 flex items-center gap-2">
				{!lumpSumOnly && (
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
								<span className="text-body-sm text-black">{t('lumpSum')}</span>
							</label>
						)}
					/>
				)}
			</div>

			<div className="md:col-span-2">
				{showQuantity && (
					<TextField
						label={t('quantity')}
						type="number"
						min="0"
						step="1"
						placeholder={defaultItem?.unitKey ? t(defaultItem.unitKey) : '0'}
						{...fieldProps(`lineItems.${index}.quantity`)}
						className="md:[&>label]:hidden"
					/>
				)}
			</div>

			<div className="md:col-span-2">
				<TextField
					label={t('rate')}
					type="number"
					prefix="€"
					placeholder="0,00"
					step="0.01"
					{...fieldProps(`lineItems.${index}.rate`)}
					className="md:[&>label]:hidden"
				/>
			</div>

			<div className="md:col-span-2 flex items-center justify-end">
				<span className="text-body font-semibold text-black">{formatEUR(amountVal)}</span>
			</div>

			<div className="md:col-span-1 flex items-center justify-end">
				<button
					type="button"
					onClick={() => onRemove(index)}
					aria-label={t('removeRow')}
					className="cursor-pointer rounded-md p-2 text-grey-100 transition-colors hover:bg-grey-25 hover:text-danger"
				>
					<Trash2 className="h-4 w-4" />
				</button>
			</div>
		</div>
	)
}

type LineItemsSectionProps = InvoiceSectionProps & {
	bvskContent?: ReactNode
	onRowsChange?: () => void
}

function LineItemsSection({
	register,
	control,
	errors,
	onFieldBlur,
	className,
	bvskContent,
	onRowsChange,
}: LineItemsSectionProps) {
	const t = useTranslations('report.invoice')
	const badge = useSectionBadge(SECTION.lineItems)
	const { fields, append, remove } = useFieldArray({
		control,
		name: 'lineItems',
	})

	return (
		<CollapsibleSection title={t('itemDetails')} info defaultOpen className={className} {...badge}>
			<div className="flex flex-col gap-5">
				{bvskContent}

				<div className="hidden border-b border-border pb-2 md:grid md:grid-cols-12 md:gap-4 md:px-1">
					<span className="col-span-3 text-caption font-medium text-grey-100">
						{t('description')}
					</span>
					<span className="col-span-2 text-caption font-medium text-grey-100">
						{t('specialFeature')}
					</span>
					<span className="col-span-2 text-caption font-medium text-grey-100">{t('quantity')}</span>
					<span className="col-span-2 text-caption font-medium text-grey-100">{t('rate')}</span>
					<span className="col-span-2 text-caption font-medium text-grey-100 text-right">
						{t('amount')}
					</span>
					<span className="col-span-1" />
				</div>

				{fields.map((row, index) => (
					<LineItemRow
						key={row.id}
						register={register}
						control={control}
						errors={errors}
						onFieldBlur={onFieldBlur}
						index={index}
						onRemove={(target) => {
							remove(target)
							queueMicrotask(() => onRowsChange?.())
						}}
					/>
				))}

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
					{t('addRow')}
				</Button>
			</div>
		</CollapsibleSection>
	)
}

export { LineItemsSection }
