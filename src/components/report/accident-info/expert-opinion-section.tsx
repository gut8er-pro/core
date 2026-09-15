'use client'

import { useTranslations } from 'next-intl'
import { useFieldProps, useSectionBadge } from '@/components/report/missing-info'
import { Checkbox } from '@/components/ui/checkbox'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { Label } from '@/components/ui/label'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'
import { SECTION } from '@/lib/completeness'
import type { SectionProps } from './types'

function ExpertOpinionSection({
	register,
	errors,
	onFieldBlur,
	className,
}: SectionProps & { className?: string }) {
	const t = useTranslations('report')
	const fieldProps = useFieldProps({ register, errors, onFieldBlur })
	const badge = useSectionBadge(SECTION.expertOpinion)

	const ORDER_PLACEMENT_OPTIONS = [
		{ value: 'direct', label: t('accidentInfo.expertOpinion.orderOptions.direct') },
		{ value: 'via_lawyer', label: t('accidentInfo.expertOpinion.orderOptions.viaLawyer') },
		{ value: 'via_insurance', label: t('accidentInfo.expertOpinion.orderOptions.viaInsurance') },
	]

	return (
		<CollapsibleSection
			title={t('accidentInfo.expertOpinion.title')}
			className={className}
			{...badge}
		>
			<div className="flex flex-col gap-4">
				<TextField
					label={t('accidentInfo.visits.expertName')}
					placeholder={t('accidentInfo.visits.expertName')}
					{...fieldProps('expertName')}
				/>

				{/* File number | Case date — 2-column per Figma */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<TextField
						label={t('accidentInfo.expertOpinion.fileNumber')}
						placeholder="HB3351"
						{...fieldProps('fileNumber')}
					/>
					<TextField
						label={t('accidentInfo.expertOpinion.caseDate')}
						type="date"
						{...fieldProps('caseDate')}
					/>
				</div>

				{/* Order was placement | Issued date — 2-column per Figma */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<SelectField
						label={t('accidentInfo.expertOpinion.orderPlacement')}
						options={ORDER_PLACEMENT_OPTIONS}
						placeholder={t('accidentInfo.expertOpinion.orderOptions.personal')}
						error={errors.orderWasPlacement?.message}
						onValueChange={(value) => {
							const event = { target: { name: 'orderWasPlacement', value } }
							register('orderWasPlacement').onChange(event)
							onFieldBlur?.('orderWasPlacement')
						}}
					/>
					<TextField
						label={t('accidentInfo.expertOpinion.issuedDate')}
						type="date"
						{...fieldProps('issuedDate')}
					/>
				</div>

				<div className="flex items-center gap-2 pt-2">
					<Checkbox
						id="order-by-claimant"
						onCheckedChange={(checked) => {
							const event = { target: { name: 'orderByClaimant', value: !!checked } }
							register('orderByClaimant').onChange(event)
							onFieldBlur?.('orderByClaimant')
						}}
						{...register('orderByClaimant')}
					/>
					<Label htmlFor="order-by-claimant" className="cursor-pointer font-normal">
						{t('accidentInfo.expertOpinion.orderByClaimant')}
					</Label>
				</div>

				<TextField
					label={t('accidentInfo.expertOpinion.mediator')}
					placeholder={t('accidentInfo.expertOpinion.mediatorPlaceholder')}
					{...fieldProps('mediator')}
				/>
			</div>
		</CollapsibleSection>
	)
}

export { ExpertOpinionSection }
