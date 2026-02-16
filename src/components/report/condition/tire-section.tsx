'use client'

import { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TireSetData, TireData } from './types'

const TIRE_POSITIONS = [
	{ key: 'VL', label: 'VL' },
	{ key: 'VR', label: 'VR' },
	{ key: 'HL', label: 'HL' },
	{ key: 'HR', label: 'HR' },
] as const

const DEFAULT_TIRE: TireData = {
	position: '',
	size: '',
	profileLevel: '',
	manufacturer: '',
	usability: 1,
}

type TireSectionProps = {
	tireSets: (TireSetData & { id: string })[]
	onSaveTireSet: (tireSet: TireSetData & { id?: string }) => void
	onDeleteTireSet: (tireSetId: string) => void
	className?: string
}

function TireSection({
	tireSets,
	onSaveTireSet,
	onDeleteTireSet,
	className,
}: TireSectionProps) {
	const [activeSetIndex, setActiveSetIndex] = useState(0)
	const [activePosition, setActivePosition] = useState<string>('VL')

	const handleAddTireSet = useCallback(() => {
		const nextSetNumber = tireSets.length + 1
		onSaveTireSet({
			setNumber: nextSetNumber,
			matchAndAlloy: false,
			tires: TIRE_POSITIONS.map((pos) => ({
				...DEFAULT_TIRE,
				position: pos.key,
			})),
		})
	}, [tireSets.length, onSaveTireSet])

	const activeTireSet = tireSets[activeSetIndex] ?? null

	return (
		<CollapsibleSection title="Tires" info defaultOpen={false} className={className}>
			<div className="flex flex-col gap-6">
				{/* Set selector tabs */}
				<div className="flex rounded-full border border-border bg-white p-1">
					{tireSets.map((tireSet, index) => (
						<button
							key={tireSet.id}
							type="button"
							onClick={() => setActiveSetIndex(index)}
							className={cn(
								'flex-1 cursor-pointer rounded-full py-2.5 text-center text-body-sm font-medium transition-colors',
								activeSetIndex === index
									? 'bg-primary text-white'
									: 'bg-transparent text-grey-100 hover:bg-grey-25',
							)}
						>
							{index === 0 ? 'First Set of Tires' : 'Second Set of Tires'}
						</button>
					))}
					{tireSets.length < 2 && (
						<button
							type="button"
							onClick={handleAddTireSet}
							className="flex-1 cursor-pointer rounded-full py-2.5 text-center text-body-sm font-medium text-grey-100 transition-colors hover:bg-grey-25"
						>
							{tireSets.length === 0 ? 'First Set of Tires' : 'Second Set of Tires'}
						</button>
					)}
				</div>

				{tireSets.length === 0 && (
					<div className="flex justify-center">
						<Button
							type="button"
							variant="secondary"
							size="md"
							icon={<Plus className="h-4 w-4" />}
							onClick={handleAddTireSet}
						>
							Add Tire Set
						</Button>
					</div>
				)}

				{activeTireSet && (
					<>
						{/* Position tabs: VL / VR / HL / HR */}
						<div className="flex items-center gap-1">
							{TIRE_POSITIONS.map((pos) => (
								<button
									key={pos.key}
									type="button"
									onClick={() => setActivePosition(pos.key)}
									className={cn(
										'flex-1 cursor-pointer border-b-2 pb-2 text-center text-body-sm font-medium transition-colors',
										activePosition === pos.key
											? 'border-black text-black'
											: 'border-transparent text-grey-100 hover:text-black',
									)}
								>
									{pos.label}
								</button>
							))}
						</div>

						{/* Tire fields for active position */}
						{(() => {
							const tire = activeTireSet.tires.find((t) => t.position === activePosition)
							if (!tire) return null

							const handleChange = (field: keyof TireData, value: string | number) => {
								const updatedTires = activeTireSet.tires.map((t) => {
									if (t.position === activePosition) {
										return { ...t, [field]: value }
									}
									return t
								})
								onSaveTireSet({ ...activeTireSet, tires: updatedTires })
							}

							return (
								<div className="flex flex-col gap-4">
									{/* Tire size / Profile level / Manufacturer */}
									<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
										<TextField
											label="Tire size"
											placeholder="Add input here"
											value={tire.size}
											onChange={(e) => handleChange('size', e.target.value)}
											onBlur={(e) => handleChange('size', e.target.value)}
										/>
										<TextField
											label="Profile level"
											placeholder="7mm"
											value={tire.profileLevel}
											onChange={(e) => handleChange('profileLevel', e.target.value)}
											onBlur={(e) => handleChange('profileLevel', e.target.value)}
										/>
										<TextField
											label="Manufacturer"
											placeholder="Add manufacturer"
											value={tire.manufacturer}
											onChange={(e) => handleChange('manufacturer', e.target.value)}
											onBlur={(e) => handleChange('manufacturer', e.target.value)}
										/>
									</div>

									{/* Tire Usability */}
									<div className="flex flex-col gap-2">
										<span className="text-body-sm font-medium text-black">Tire Usability</span>
										<UsabilityRating
											value={tire.usability}
											onChange={(val) => handleChange('usability', val)}
										/>
									</div>
								</div>
							)
						})()}

						{/* Match and Alloy + action buttons */}
						<div className="flex items-center justify-between">
							<label className="flex items-center gap-2 cursor-pointer">
								<Checkbox
									checked={activeTireSet.matchAndAlloy}
									onCheckedChange={(checked) => {
										onSaveTireSet({ ...activeTireSet, matchAndAlloy: checked === true })
									}}
								/>
								<span className="text-body-sm text-black">Match and Alloy</span>
							</label>
							<div className="flex items-center gap-2">
								<Button type="button" variant="outline" size="sm">
									Align Area
								</Button>
								<Button type="button" variant="primary" size="sm">
									Match Tire Set
								</Button>
							</div>
						</div>
					</>
				)}
			</div>
		</CollapsibleSection>
	)
}

type UsabilityRatingProps = {
	value: number
	onChange: (value: number) => void
}

function UsabilityRating({ value, onChange }: UsabilityRatingProps) {
	return (
		<div className="flex items-center gap-2" role="group" aria-label="Usability rating">
			{[1, 2, 3, 4, 5].map((level) => (
				<button
					key={level}
					type="button"
					onClick={() => onChange(level)}
					className={cn(
						'h-6 w-6 cursor-pointer rounded-full border-2 transition-colors',
						level <= value
							? 'border-primary bg-primary'
							: 'border-grey-50 bg-white hover:border-grey-100',
					)}
					aria-label={`Set usability to ${level} of 5`}
					aria-pressed={level <= value}
				/>
			))}
		</div>
	)
}

export { TireSection, UsabilityRating }
export type { TireSectionProps }
