'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TireSetData, TireData } from './types'

const TIRE_POSITIONS = [
	{ key: 'VL', label: 'VL' },
	{ key: 'VR', label: 'VR' },
	{ key: 'HL', label: 'HL' },
	{ key: 'HR', label: 'HR' },
] as const

const TIRE_TYPES = [
	{ value: 'summer', label: 'Summer' },
	{ value: 'winter', label: 'Winter/Snow' },
	{ value: 'all-season', label: 'All-Season' },
] as const

const DEFAULT_TIRE: TireData = {
	position: '',
	size: '',
	profileLevel: '',
	manufacturer: '',
	usability: 1,
	tireType: '',
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
	const autoCreated = useRef(false)

	// Auto-create first tire set so fields are immediately visible
	useEffect(() => {
		if (tireSets.length === 0 && !autoCreated.current) {
			autoCreated.current = true
			onSaveTireSet({
				setNumber: 1,
				matchAndAlloy: false,
				tires: TIRE_POSITIONS.map((pos) => ({
					...DEFAULT_TIRE,
					position: pos.key,
				})),
			})
		}
	}, [tireSets.length, onSaveTireSet])

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
		setActiveSetIndex(tireSets.length)
	}, [tireSets.length, onSaveTireSet])

	const activeTireSet = tireSets[activeSetIndex] ?? null

	return (
		<CollapsibleSection title="Tires" info defaultOpen={false} className={className}>
			<div className="flex flex-col gap-6">
				{/* Set selector tabs — black active per Figma */}
				<div className="flex rounded-full bg-[rgba(224,225,229,0.6)] p-1.5">
					{tireSets.map((tireSet, index) => (
						<button
							key={tireSet.id}
							type="button"
							onClick={() => setActiveSetIndex(index)}
							className={cn(
								'flex-1 cursor-pointer rounded-full py-3 text-center text-body-sm font-medium transition-colors',
								activeSetIndex === index
									? 'bg-black text-white'
									: 'bg-transparent text-grey-100 hover:bg-white/50',
							)}
						>
							{index === 0 ? 'First Set of Tires' : 'Second Set of Tires'}
						</button>
					))}
					{tireSets.length < 2 && (
						<button
							type="button"
							onClick={handleAddTireSet}
							className="flex-1 cursor-pointer rounded-full py-3 text-center text-body-sm font-medium text-grey-100 transition-colors hover:bg-white/50"
						>
							{tireSets.length === 0 ? 'First Set of Tires' : 'Second Set of Tires'}
						</button>
					)}
				</div>

				{activeTireSet && (
					<>
						{/* Position tabs: VL / VR / HL / HR — green underline per Figma */}
						<div className="flex items-center gap-1 px-1.5">
							{TIRE_POSITIONS.map((pos) => (
								<button
									key={pos.key}
									type="button"
									onClick={() => setActivePosition(pos.key)}
									className={cn(
										'flex-1 cursor-pointer border-b-2 pb-3 pt-3 text-center text-body-sm font-medium transition-colors',
										activePosition === pos.key
											? 'border-primary text-black'
											: 'border-transparent text-grey-100 hover:text-black',
									)}
								>
									{pos.label}
								</button>
							))}
						</div>

						{/* Tire fields for active position */}
						{(() => {
							const existingTire = activeTireSet.tires.find((t) => t.position === activePosition)
							const tire = existingTire ?? { ...DEFAULT_TIRE, position: activePosition }

							const handleChange = (field: keyof TireData, value: string | number) => {
								const updatedTire = { ...tire, [field]: value }
								const hasTire = activeTireSet.tires.some((t) => t.position === activePosition)
								const updatedTires = hasTire
									? activeTireSet.tires.map((t) =>
											t.position === activePosition ? updatedTire : t,
										)
									: [...activeTireSet.tires, updatedTire]
								onSaveTireSet({ ...activeTireSet, tires: updatedTires })
							}

							return (
								<div className="flex flex-col gap-6">
									{/* Tire size / Profile (mm) / Manufacturer */}
									<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
										<TextField
											label="Tire size"
											placeholder="add size in inches"
											value={tire.size}
											onChange={(e) => handleChange('size', e.target.value)}
											onBlur={(e) => handleChange('size', e.target.value)}
										/>
										<TextField
											label="Profile (mm)"
											placeholder="0mm"
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

									{/* Tires Usability — icon + label left, picker boxes right */}
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<TireIcon className="h-6 w-6 text-black" />
											<span className="text-body-sm text-black">
												Tires Usability
											</span>
										</div>
										<div className="flex items-center gap-3">
											{[1, 2, 3, 4, 5].map((level) => (
												<button
													key={level}
													type="button"
													onClick={() => handleChange('usability', level)}
													className={cn(
														'flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-[15px] transition-colors',
														level <= tire.usability
															? 'border-2 border-primary bg-white'
															: 'border border-[#e3e3e3] bg-white hover:border-grey-100',
													)}
													aria-label={`Set usability to ${level} of 5`}
													aria-pressed={level <= tire.usability}
												>
													<TireWheelIcon
														className="h-[34px] w-[34px]"
														filled={level <= tire.usability}
													/>
												</button>
											))}
											<button
												type="button"
												className="flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-[15px] border border-[#e3e3e3] bg-white text-black transition-colors hover:border-grey-100"
											>
												<Plus className="h-4 w-4" />
											</button>
										</div>
									</div>

									{/* Tire Type */}
									<div className="flex flex-col gap-2">
										<span className="text-body-sm font-medium text-black">Tire Type</span>
										<div className="flex items-center gap-2">
											{TIRE_TYPES.map((tt) => (
												<button
													key={tt.value}
													type="button"
													onClick={() => handleChange('tireType', tt.value)}
													className={cn(
														'cursor-pointer rounded-full border px-4 py-1.5 text-body-sm font-medium transition-colors',
														tire.tireType === tt.value
															? 'border-primary bg-primary text-white'
															: 'border-border bg-white text-grey-100 hover:border-grey-100',
													)}
												>
													{tt.label}
												</button>
											))}
										</div>
									</div>
								</div>
							)
						})()}

						{/* Match and Align — icon + label left, buttons right (no checkbox per Figma) */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<TireIcon className="h-6 w-6 text-black" />
								<span className="text-body-sm text-black">Match and Align</span>
							</div>
							<div className="flex items-center gap-4">
								<button
									type="button"
									className="flex h-[50px] cursor-pointer items-center justify-center rounded-[15px] border-2 border-grey-50 px-4 text-body-md font-medium text-black transition-colors hover:border-grey-100"
								>
									Align Axes
								</button>
								<button
									type="button"
									onClick={() => {
										onSaveTireSet({ ...activeTireSet, matchAndAlloy: !activeTireSet.matchAndAlloy })
									}}
									className="flex h-[50px] cursor-pointer items-center justify-center rounded-[15px] bg-primary px-4 text-body-md font-medium text-white transition-colors hover:bg-primary/90"
								>
									Match The Set
								</button>
							</div>
						</div>
					</>
				)}
			</div>
		</CollapsibleSection>
	)
}

/**
 * Tire icon (ph:tire-bold style) matching Figma design.
 */
function TireIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 256 256"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<path d="M128,20A108,108,0,1,0,236,128,108.12,108.12,0,0,0,128,20Zm0,192a84,84,0,1,1,84-84A84.09,84.09,0,0,1,128,212Zm0-144a60,60,0,1,0,60,60A60.07,60.07,0,0,0,128,68Zm0,96a36,36,0,1,1,36-36A36.04,36.04,0,0,1,128,164Zm12-36a12,12,0,1,1-12-12A12,12,0,0,1,140,128Z" />
		</svg>
	)
}

/**
 * Tire/wheel combo icon for usability picker boxes.
 */
function TireWheelIcon({ className, filled }: { className?: string; filled?: boolean }) {
	return (
		<svg
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			{/* Outer tire */}
			<circle
				cx="16"
				cy="16"
				r="14"
				stroke={filled ? '#019447' : '#919191'}
				strokeWidth="2.5"
				fill="none"
			/>
			{/* Inner wheel rim */}
			<circle
				cx="16"
				cy="16"
				r="9"
				stroke={filled ? '#019447' : '#919191'}
				strokeWidth="1.5"
				fill="none"
			/>
			{/* Hub */}
			<circle
				cx="16"
				cy="16"
				r="3.5"
				fill={filled ? '#019447' : '#d1d5db'}
			/>
			{/* Spokes */}
			<line x1="16" y1="7" x2="16" y2="2" stroke={filled ? '#019447' : '#919191'} strokeWidth="2" strokeLinecap="round" />
			<line x1="16" y1="30" x2="16" y2="25" stroke={filled ? '#019447' : '#919191'} strokeWidth="2" strokeLinecap="round" />
			<line x1="2" y1="16" x2="7" y2="16" stroke={filled ? '#019447' : '#919191'} strokeWidth="2" strokeLinecap="round" />
			<line x1="25" y1="16" x2="30" y2="16" stroke={filled ? '#019447' : '#919191'} strokeWidth="2" strokeLinecap="round" />
			{/* Diagonal spokes */}
			<line x1="6.1" y1="6.1" x2="9.6" y2="9.6" stroke={filled ? '#019447' : '#919191'} strokeWidth="1.5" strokeLinecap="round" />
			<line x1="22.4" y1="22.4" x2="25.9" y2="25.9" stroke={filled ? '#019447' : '#919191'} strokeWidth="1.5" strokeLinecap="round" />
			<line x1="25.9" y1="6.1" x2="22.4" y2="9.6" stroke={filled ? '#019447' : '#919191'} strokeWidth="1.5" strokeLinecap="round" />
			<line x1="9.6" y1="22.4" x2="6.1" y2="25.9" stroke={filled ? '#019447' : '#919191'} strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	)
}

export { TireSection }
export type { TireSectionProps }
