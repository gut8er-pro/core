'use client'

import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'

// Options moved inside component for translation access

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

type ValueIncreasingFeaturesSectionProps = {
	className?: string
}

function ValueIncreasingFeaturesSection({ className }: ValueIncreasingFeaturesSectionProps) {
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

	const [_originality, setOriginality] = useState('')
	const [rareEquipment, setRareEquipment] = useState<string[]>([])
	const [condition, setCondition] = useState<string[]>([])
	const [technicalFeatures, setTechnicalFeatures] = useState<string[]>([])
	const [mileage, setMileage] = useState<string[]>([])
	const [history, setHistory] = useState<string[]>([])
	const [rarity, setRarity] = useState<string[]>([])
	const [particulars, setParticulars] = useState('')
	const [_marketReputation, setMarketReputation] = useState('')

	return (
		<CollapsibleSection title={t('valueIncreasingFeatures.title')} info className={className}>
			<div className="flex flex-col gap-6">
				<SelectField
					label={t('valueIncreasingFeatures.originality')}
					options={ORIGINALITY_OPTIONS}
					placeholder="Select"
					onValueChange={setOriginality}
				/>

				<TagInput
					label={t('valueIncreasingFeatures.rareEquipment')}
					tags={rareEquipment}
					onAdd={(tag) => setRareEquipment((prev) => [...prev, tag])}
					onRemove={(i) => setRareEquipment((prev) => prev.filter((_, j) => j !== i))}
					placeholder={t('valueIncreasingFeatures.addRareEquipment')}
				/>

				<TagInput
					label={t('valueIncreasingFeatures.condition')}
					tags={condition}
					onAdd={(tag) => setCondition((prev) => [...prev, tag])}
					onRemove={(i) => setCondition((prev) => prev.filter((_, j) => j !== i))}
					placeholder={t('valueIncreasingFeatures.addConditionNote')}
				/>

				<TagInput
					label={t('valueIncreasingFeatures.technicalFeatures')}
					tags={technicalFeatures}
					onAdd={(tag) => setTechnicalFeatures((prev) => [...prev, tag])}
					onRemove={(i) => setTechnicalFeatures((prev) => prev.filter((_, j) => j !== i))}
					placeholder={t('valueIncreasingFeatures.addTechnicalFeature')}
				/>

				<TagInput
					label={t('valueIncreasingFeatures.mileage')}
					tags={mileage}
					onAdd={(tag) => setMileage((prev) => [...prev, tag])}
					onRemove={(i) => setMileage((prev) => prev.filter((_, j) => j !== i))}
					placeholder={t('valueIncreasingFeatures.addMileageNote')}
				/>

				<TagInput
					label={t('valueIncreasingFeatures.historyDocumentation')}
					tags={history}
					onAdd={(tag) => setHistory((prev) => [...prev, tag])}
					onRemove={(i) => setHistory((prev) => prev.filter((_, j) => j !== i))}
					placeholder={t('valueIncreasingFeatures.addHistoryItem')}
				/>

				<TagInput
					label={t('valueIncreasingFeatures.rarityMarketDemand')}
					tags={rarity}
					onAdd={(tag) => setRarity((prev) => [...prev, tag])}
					onRemove={(i) => setRarity((prev) => prev.filter((_, j) => j !== i))}
					placeholder={t('valueIncreasingFeatures.addRarityNote')}
				/>

				<TextField
					label={t('valueIncreasingFeatures.particularsNotes')}
					placeholder={t('valueIncreasingFeatures.additionalNotes')}
					value={particulars}
					onChange={(e) => setParticulars(e.target.value)}
				/>

				<SelectField
					label={t('valueIncreasingFeatures.marketReputation')}
					options={MARKET_REPUTATION_OPTIONS}
					placeholder="Select"
					onValueChange={setMarketReputation}
				/>
			</div>
		</CollapsibleSection>
	)
}

export { ValueIncreasingFeaturesSection }
