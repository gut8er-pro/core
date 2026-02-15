'use client'

import { useState, useCallback } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TireSetData, TireData } from './types'

const TIRE_POSITIONS = [
	{ key: 'VL', label: 'Front Left (VL)' },
	{ key: 'VR', label: 'Front Right (VR)' },
	{ key: 'HL', label: 'Rear Left (HL)' },
	{ key: 'HR', label: 'Rear Right (HR)' },
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

	return (
		<CollapsibleSection title="Tires" defaultOpen={false} className={className}>
			<div className="flex flex-col gap-6">
				{tireSets.length === 0 && (
					<p className="text-body-sm text-grey-100">
						No tire sets added yet. Click below to add a tire set.
					</p>
				)}

				{tireSets.map((tireSet) => (
					<TireSetCard
						key={tireSet.id}
						tireSet={tireSet}
						onSave={onSaveTireSet}
						onDelete={() => onDeleteTireSet(tireSet.id)}
					/>
				))}

				{tireSets.length < 4 && (
					<Button
						type="button"
						variant="secondary"
						size="md"
						icon={<Plus className="h-4 w-4" />}
						onClick={handleAddTireSet}
					>
						Add Tire Set
					</Button>
				)}
			</div>
		</CollapsibleSection>
	)
}

type TireSetCardProps = {
	tireSet: TireSetData & { id: string }
	onSave: (tireSet: TireSetData & { id?: string }) => void
	onDelete: () => void
}

function TireSetCard({ tireSet, onSave, onDelete }: TireSetCardProps) {
	const handleTireChange = useCallback(
		(position: string, field: keyof TireData, value: string | number) => {
			const updatedTires = tireSet.tires.map((tire) => {
				if (tire.position === position) {
					return { ...tire, [field]: value }
				}
				return tire
			})
			onSave({ ...tireSet, tires: updatedTires })
		},
		[tireSet, onSave],
	)

	const handleMatchAndAlloyChange = useCallback(
		(checked: boolean) => {
			onSave({ ...tireSet, matchAndAlloy: checked })
		},
		[tireSet, onSave],
	)

	return (
		<div className="rounded-lg border border-border bg-white p-4">
			{/* Header */}
			<div className="mb-4 flex items-center justify-between">
				<h4 className="text-body font-semibold text-black">
					Tire Set {tireSet.setNumber}
				</h4>
				<div className="flex items-center gap-2">
					<label className="flex items-center gap-1 cursor-pointer">
						<Checkbox
							checked={tireSet.matchAndAlloy}
							onCheckedChange={(checked) =>
								handleMatchAndAlloyChange(checked === true)
							}
						/>
						<span className="text-caption text-grey-100">Match & Alloy</span>
					</label>
					<button
						type="button"
						onClick={onDelete}
						className="cursor-pointer text-grey-100 transition-colors hover:text-error"
						aria-label={`Delete tire set ${tireSet.setNumber}`}
					>
						<Trash2 className="h-4 w-4" />
					</button>
				</div>
			</div>

			{/* 2x2 tire grid */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{TIRE_POSITIONS.map((pos) => {
					const tire = tireSet.tires.find((t) => t.position === pos.key)
					if (!tire) return null
					return (
						<TireCard
							key={pos.key}
							position={pos}
							tire={tire}
							onChange={handleTireChange}
						/>
					)
				})}
			</div>
		</div>
	)
}

type TireCardProps = {
	position: { key: string; label: string }
	tire: TireData
	onChange: (position: string, field: keyof TireData, value: string | number) => void
}

function TireCard({ position, tire, onChange }: TireCardProps) {
	return (
		<div className="rounded-md border border-border bg-grey-25 p-2">
			<h5 className="mb-2 text-caption font-semibold text-black">{position.label}</h5>
			<div className="flex flex-col gap-1">
				<TextField
					label="Size"
					placeholder="e.g. 225/45R17"
					value={tire.size}
					onChange={(e) => onChange(position.key, 'size', e.target.value)}
					onBlur={(e) => onChange(position.key, 'size', e.target.value)}
				/>

				<TextField
					label="Profile Level"
					placeholder="e.g. 5mm"
					value={tire.profileLevel}
					onChange={(e) => onChange(position.key, 'profileLevel', e.target.value)}
					onBlur={(e) => onChange(position.key, 'profileLevel', e.target.value)}
				/>

				<TextField
					label="Manufacturer"
					placeholder="e.g. Continental"
					value={tire.manufacturer}
					onChange={(e) => onChange(position.key, 'manufacturer', e.target.value)}
					onBlur={(e) => onChange(position.key, 'manufacturer', e.target.value)}
				/>

				{/* Usability rating (1-3 circles) */}
				<div className="flex flex-col gap-1">
					<span className="text-caption font-medium text-grey-100">Usability</span>
					<UsabilityRating
						value={tire.usability}
						onChange={(val) => onChange(position.key, 'usability', val)}
					/>
				</div>
			</div>
		</div>
	)
}

type UsabilityRatingProps = {
	value: number
	onChange: (value: number) => void
}

function UsabilityRating({ value, onChange }: UsabilityRatingProps) {
	return (
		<div className="flex items-center gap-1" role="group" aria-label="Usability rating">
			{[1, 2, 3].map((level) => (
				<button
					key={level}
					type="button"
					onClick={() => onChange(level)}
					className={cn(
						'h-5 w-5 cursor-pointer rounded-full border-2 transition-colors',
						level <= value
							? 'border-primary bg-primary'
							: 'border-grey-50 bg-white hover:border-grey-100',
					)}
					aria-label={`Set usability to ${level} of 3`}
					aria-pressed={level <= value}
				/>
			))}
			<span className="ml-1 text-caption text-grey-100">{value}/3</span>
		</div>
	)
}

export { TireSection, UsabilityRating }
export type { TireSectionProps }
