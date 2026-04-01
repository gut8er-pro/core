'use client'

import { X } from 'lucide-react'
import { useState } from 'react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'

const ORIGINALITY_OPTIONS = [
	{ value: 'original', label: 'Original' },
	{ value: 'partially_original', label: 'Partially Original' },
	{ value: 'restored', label: 'Restored' },
	{ value: 'modified', label: 'Modified' },
]

const MARKET_REPUTATION_OPTIONS = [
	{ value: 'excellent', label: 'Excellent' },
	{ value: 'good', label: 'Good' },
	{ value: 'average', label: 'Average' },
	{ value: 'below_average', label: 'Below Average' },
]

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
	const [originality, setOriginality] = useState('')
	const [rareEquipment, setRareEquipment] = useState<string[]>([])
	const [condition, setCondition] = useState<string[]>([])
	const [technicalFeatures, setTechnicalFeatures] = useState<string[]>([])
	const [mileage, setMileage] = useState<string[]>([])
	const [history, setHistory] = useState<string[]>([])
	const [rarity, setRarity] = useState<string[]>([])
	const [particulars, setParticulars] = useState('')
	const [marketReputation, setMarketReputation] = useState('')

	return (
		<CollapsibleSection title="Value Increasing Features" info className={className}>
			<div className="flex flex-col gap-6">
				<SelectField
					label="Originality"
					options={ORIGINALITY_OPTIONS}
					placeholder="Select"
					onValueChange={setOriginality}
				/>

				<TagInput
					label="Rare equipment"
					tags={rareEquipment}
					onAdd={(tag) => setRareEquipment((prev) => [...prev, tag])}
					onRemove={(i) => setRareEquipment((prev) => prev.filter((_, j) => j !== i))}
					placeholder="Add rare equipment"
				/>

				<TagInput
					label="Condition"
					tags={condition}
					onAdd={(tag) => setCondition((prev) => [...prev, tag])}
					onRemove={(i) => setCondition((prev) => prev.filter((_, j) => j !== i))}
					placeholder="Add condition note"
				/>

				<TagInput
					label="Technical features"
					tags={technicalFeatures}
					onAdd={(tag) => setTechnicalFeatures((prev) => [...prev, tag])}
					onRemove={(i) => setTechnicalFeatures((prev) => prev.filter((_, j) => j !== i))}
					placeholder="Add technical feature"
				/>

				<TagInput
					label="Mileage"
					tags={mileage}
					onAdd={(tag) => setMileage((prev) => [...prev, tag])}
					onRemove={(i) => setMileage((prev) => prev.filter((_, j) => j !== i))}
					placeholder="Add mileage note"
				/>

				<TagInput
					label="History & documentation"
					tags={history}
					onAdd={(tag) => setHistory((prev) => [...prev, tag])}
					onRemove={(i) => setHistory((prev) => prev.filter((_, j) => j !== i))}
					placeholder="Add history item"
				/>

				<TagInput
					label="Rarity & market demand"
					tags={rarity}
					onAdd={(tag) => setRarity((prev) => [...prev, tag])}
					onRemove={(i) => setRarity((prev) => prev.filter((_, j) => j !== i))}
					placeholder="Add rarity note"
				/>

				<TextField
					label="Particulars/notes"
					placeholder="Additional notes"
					value={particulars}
					onChange={(e) => setParticulars(e.target.value)}
				/>

				<SelectField
					label="Market Reputation"
					options={MARKET_REPUTATION_OPTIONS}
					placeholder="Select"
					onValueChange={setMarketReputation}
				/>
			</div>
		</CollapsibleSection>
	)
}

export { ValueIncreasingFeaturesSection }
