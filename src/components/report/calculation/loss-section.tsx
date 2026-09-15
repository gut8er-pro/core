'use client'

import { Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import {
	useControlledFieldProps,
	useFieldProps,
	useSectionBadge,
} from '@/components/report/missing-info'
import { MissingBadge } from '@/components/ui/missing'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'
import { SECTION } from '@/lib/completeness'
import { cn } from '@/lib/utils'
import type { CalculationSectionProps } from './types'

const DROPOUT_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N']

const RENTAL_CLASSES = ['1', '2', '3', '4', '5', '6', '7']

function LossSection({
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
	const badge = useSectionBadge(SECTION.loss)

	const DROPOUT_GROUP_OPTIONS = DROPOUT_GROUPS.map((group) => ({
		value: group,
		label: `${t('lossOfUse.groupLabel')} ${group}`,
	}))

	const RENTAL_CLASS_OPTIONS = RENTAL_CLASSES.map((rentalClass) => ({
		value: rentalClass,
		label: `${t('lossOfUse.classLabel')} ${rentalClass}`,
	}))

	return (
		<div className={cn('flex flex-col gap-5', className)}>
			{/* Section header */}
			<div className="flex items-center gap-2">
				<h4 className="text-body font-semibold text-black">{t('lossOfUse.title')}</h4>
				<Info className="h-4 w-4 text-grey-100" />
				<MissingBadge count={badge.missingCount} label={badge.missingLabel} />
			</div>

			{/* First row: Dropout group, Cost per Day, Rental Car Class */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Controller
					name="dropoutGroup"
					control={control}
					render={({ field }) => (
						<SelectField
							label={t('lossOfUse.dropoutGroup')}
							options={DROPOUT_GROUP_OPTIONS}
							placeholder={tc('select')}
							{...controlled('dropoutGroup', field)}
						/>
					)}
				/>

				<TextField
					label={t('lossOfUse.costPerDay')}
					type="number"
					prefix="€"
					placeholder="0.00"
					step="0.01"
					{...fieldProps('costPerDay')}
				/>

				<Controller
					name="rentalCarClass"
					control={control}
					render={({ field }) => (
						<SelectField
							label={t('lossOfUse.rentalCarClass')}
							options={RENTAL_CLASS_OPTIONS}
							placeholder={tc('select')}
							value={field.value}
							onValueChange={(val) => {
								field.onChange(val)
								onFieldBlur?.('rentalCarClass')
							}}
							error={errors.rentalCarClass?.message}
						/>
					)}
				/>
			</div>

			{/* Second row: Repair time, Replacement time */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<TextField
					label={t('lossOfUse.repairTimeDays')}
					type="number"
					placeholder={t('lossOfUse.addDays')}
					{...fieldProps('repairTimeDays')}
				/>

				<TextField
					label={t('lossOfUse.replacementTimeDays')}
					type="number"
					placeholder={t('lossOfUse.addDays')}
					{...fieldProps('replacementTimeDays')}
				/>
			</div>
		</div>
	)
}

export { LossSection }
