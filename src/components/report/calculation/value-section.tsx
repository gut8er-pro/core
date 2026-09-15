'use client'

import { Info, Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Controller, useFieldArray } from 'react-hook-form'
import {
	useControlledFieldProps,
	useFieldProps,
	useSectionBadge,
} from '@/components/report/missing-info'
import { Button } from '@/components/ui/button'
import { MissingBadge } from '@/components/ui/missing'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'
import { SECTION } from '@/lib/completeness'
import { cn } from '@/lib/utils'
import type { CalculationSectionProps } from './types'

const TAX_RATE_OPTIONS = [
	{ value: '0', label: '0%' },
	{ value: '7', label: '7%' },
	{ value: '19', label: '19%' },
]

const _DAMAGE_CLASS_OPTIONS = [
	{ value: 'class_1', label: 'Class I' },
	{ value: 'class_2', label: 'Class II' },
	{ value: 'class_3', label: 'Class III' },
	{ value: 'class_4', label: 'Class IV' },
	{ value: 'class_5', label: 'Class V' },
	{ value: 'class_6', label: 'Class VI' },
]

function ValueSection({
	register,
	control,
	errors,
	onFieldBlur,
	className,
}: CalculationSectionProps) {
	const t = useTranslations('report.calculation')
	const tc = useTranslations('common')
	const fieldProps = useFieldProps({ register, errors, onFieldBlur })
	const controlled = useControlledFieldProps({ errors, onFieldBlur })
	const badge = useSectionBadge(SECTION.value)
	const { fields, append, remove } = useFieldArray({
		control,
		name: 'additionalCosts',
	})

	return (
		<div className={cn('flex flex-col gap-5', className)}>
			{/* Section header */}
			<div className="flex items-center gap-2">
				<h4 className="text-body font-semibold text-black">{t('vehicleValue')}</h4>
				<Info className="h-4 w-4 text-grey-100" />
				<MissingBadge count={badge.missingCount} label={badge.missingLabel} />
			</div>

			{/* Replacement value + Tax rate on same row */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
				<TextField
					label={t('replacementValue')}
					type="number"
					prefix="€"
					placeholder={t('addValue')}
					step="0.01"
					className="min-w-0 flex-1"
					{...fieldProps('replacementValue')}
				/>

				<Controller
					name="taxRate"
					control={control}
					render={({ field }) => (
						<SelectField
							label={t('chooseTaxRate')}
							options={TAX_RATE_OPTIONS}
							placeholder={tc('select')}
							className="gap-3 sm:w-32 sm:shrink-0 sm:border-l sm:border-border-subtle sm:pl-6"
							{...controlled('taxRate', field)}
						/>
					)}
				/>
			</div>

			{/* Residual value - full width */}
			<TextField
				label={t('residualValue')}
				placeholder={t('addValue')}
				{...fieldProps('residualValue')}
			/>

			{/* Diminution in value - full width */}
			<TextField
				label={t('diminutionInValue')}
				placeholder={t('addValue')}
				{...fieldProps('diminutionInValue')}
			/>

			{/* Additional Costs */}
			{fields.map((row, index) => (
				<div key={row.id} className="flex items-end gap-3">
					<div className="flex-1">
						<TextField
							label={t('description')}
							placeholder={t('costDescription')}
							{...fieldProps(`additionalCosts.${index}.description`)}
						/>
					</div>
					<div className="w-36">
						<TextField
							label={t('amount')}
							type="number"
							prefix="€"
							placeholder="0.00"
							step="0.01"
							{...fieldProps(`additionalCosts.${index}.amount`)}
						/>
					</div>
					<Button
						type="button"
						variant="danger"
						size="icon"
						onClick={() => remove(index)}
						aria-label={t('additionalCosts')}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			))}

			<Button
				type="button"
				variant="outline"
				size="md"
				icon={<Plus className="h-4 w-4" />}
				onClick={() => append({ description: '', amount: '' })}
				className="self-center"
			>
				{t('additionalCosts')}
			</Button>

			{/* Damage class */}
			<TextField
				label={t('damageClass')}
				placeholder={t('addDamageClass')}
				{...fieldProps('damageClass')}
			/>
		</div>
	)
}

export { ValueSection }
