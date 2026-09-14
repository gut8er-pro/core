'use client'

import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'
import type { OldtimerDetailsData } from './types'

type TagInputProps = {
	label: string
	tags: string[]
	onAdd: (tag: string) => void
	onRemove: (index: number) => void
	placeholder?: string
}

function TagInput({ label, tags, onAdd, onRemove, placeholder }: TagInputProps) {
	const [input, setInput] = useState('')

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Enter' && input.trim()) {
			e.preventDefault()
			onAdd(input.trim())
			setInput('')
		}
	}

	return (
		<div className="flex flex-col gap-2">
			<label className="text-body font-medium text-black">{label}</label>
			<div className="flex flex-wrap gap-2">
				{tags.map((tag, i) => (
					<span
						key={`${tag}-${i}`}
						className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-body-sm text-primary"
					>
						{tag}
						<button
							type="button"
							onClick={() => onRemove(i)}
							className="cursor-pointer text-primary/60 hover:text-primary"
							aria-label={`Remove ${tag}`}
						>
							<X className="h-3 w-3" />
						</button>
					</span>
				))}
			</div>
			<input
				type="text"
				value={input}
				onChange={(e) => setInput(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder ?? 'Type and press Enter'}
				className="flex h-11 w-full rounded-md border border-border bg-white px-4 py-3 text-body-sm text-black placeholder:text-placeholder focus:border-border-focus focus:outline-none"
			/>
		</div>
	)
}

/** The six tag lists, in the order the section renders them. */
const TAG_LISTS = [
	{ field: 'rareEquipment', label: 'rareEquipment', placeholder: 'addRareEquipment' },
	{ field: 'conditionNotes', label: 'condition', placeholder: 'addConditionNote' },
	{ field: 'technicalFeatures', label: 'technicalFeatures', placeholder: 'addTechnicalFeature' },
	{ field: 'mileageNotes', label: 'mileage', placeholder: 'addMileageNote' },
	{ field: 'historyDocumentation', label: 'historyDocumentation', placeholder: 'addHistoryItem' },
	{ field: 'rarityMarketDemand', label: 'rarityMarketDemand', placeholder: 'addRarityNote' },
] as const

type ValueIncreasingFeaturesSectionProps = {
	values: OldtimerDetailsData
	onChange: <K extends keyof OldtimerDetailsData>(field: K, value: OldtimerDetailsData[K]) => void
	className?: string
}

/**
 * The value-increasing features of an Oldtimer. Nothing here is required — a car
 * with no rare equipment is a real answer — but all of it is now saved, so the
 * substance of a valuation survives a reload.
 */
function ValueIncreasingFeaturesSection({
	values,
	onChange,
	className,
}: ValueIncreasingFeaturesSectionProps) {
	const t = useTranslations('report.condition')

	const ORIGINALITY_OPTIONS = [
		{ value: 'original', label: t('valueIncreasingFeatures.originalityOptions.original') },
		{
			value: 'partially_original',
			label: t('valueIncreasingFeatures.originalityOptions.partiallyOriginal'),
		},
		{ value: 'restored', label: t('valueIncreasingFeatures.originalityOptions.restored') },
		{ value: 'modified', label: t('valueIncreasingFeatures.originalityOptions.modified') },
	]

	const MARKET_REPUTATION_OPTIONS = [
		{ value: 'excellent', label: t('valueIncreasingFeatures.marketReputationOptions.excellent') },
		{ value: 'good', label: t('valueIncreasingFeatures.marketReputationOptions.good') },
		{ value: 'average', label: t('valueIncreasingFeatures.marketReputationOptions.average') },
		{
			value: 'below_average',
			label: t('valueIncreasingFeatures.marketReputationOptions.belowAverage'),
		},
	]

	return (
		<CollapsibleSection title={t('valueIncreasingFeatures.title')} info className={className}>
			<div className="flex flex-col gap-6">
				<SelectField
					label={t('valueIncreasingFeatures.originality')}
					options={ORIGINALITY_OPTIONS}
					placeholder="Select"
					value={values.originality || undefined}
					onValueChange={(value) => onChange('originality', value)}
				/>

				{TAG_LISTS.map(({ field, label, placeholder }) => (
					<TagInput
						key={field}
						label={t(`valueIncreasingFeatures.${label}`)}
						tags={values[field]}
						onAdd={(tag) => onChange(field, [...values[field], tag])}
						onRemove={(i) =>
							onChange(
								field,
								values[field].filter((_, j) => j !== i),
							)
						}
						placeholder={t(`valueIncreasingFeatures.${placeholder}`)}
					/>
				))}

				<TextField
					label={t('valueIncreasingFeatures.particularsNotes')}
					placeholder={t('valueIncreasingFeatures.additionalNotes')}
					value={values.particulars}
					onChange={(e) => onChange('particulars', e.target.value)}
				/>

				<SelectField
					label={t('valueIncreasingFeatures.marketReputation')}
					options={MARKET_REPUTATION_OPTIONS}
					placeholder="Select"
					value={values.marketReputation || undefined}
					onValueChange={(value) => onChange('marketReputation', value)}
				/>
			</div>
		</CollapsibleSection>
	)
}

export { ValueIncreasingFeaturesSection }
