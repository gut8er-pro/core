'use client'

import { Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import type { Marker } from '@/components/ui/vehicle-diagram'
import { VehicleDiagram } from '@/components/ui/vehicle-diagram'
import { cn } from '@/lib/utils'
import { getPaintColor } from '@/lib/validations/condition'
import type { DamageMarkerData, PaintMarkerData } from './types'

type DamageDiagramSectionProps = {
	damageMarkers: DamageMarkerData[]
	paintMarkers: PaintMarkerData[]
	onAddDamageMarker: (x: number, y: number) => void
	onDeleteDamageMarker: (markerId: string) => void
	onUpdateDamageMarker: (markerId: string, comment: string) => void
	onAddPaintMarker: (x: number, y: number) => void
	onUpdatePaintMarker: (markerId: string, thickness: number) => void
	onDeletePaintMarker: (markerId: string) => void
	className?: string
}

type DiagramTab = 'damages' | 'paint'

function DamageDiagramSection({
	damageMarkers,
	paintMarkers,
	onAddDamageMarker,
	onDeleteDamageMarker,
	onUpdateDamageMarker,
	onAddPaintMarker,
	onUpdatePaintMarker,
	onDeletePaintMarker,
	className,
}: DamageDiagramSectionProps) {
	const [activeTab, setActiveTab] = useState<DiagramTab>('damages')
	const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null)
	const [manualSetup, setManualSetup] = useState(true)

	const damageVehicleMarkers: Marker[] = damageMarkers.map((m) => ({
		id: m.id,
		x: m.x,
		y: m.y,
		comment: m.comment ?? undefined,
		color: '#1F2937',
	}))

	const paintVehicleMarkers: Marker[] = paintMarkers.map((m) => ({
		id: m.id,
		x: m.x,
		y: m.y,
		value: m.thickness,
		color: m.color ?? getPaintColor(m.thickness),
	}))

	const handleDiagramClick = useCallback(
		(x: number, y: number) => {
			if (activeTab === 'damages') {
				onAddDamageMarker(x, y)
			} else {
				onAddPaintMarker(x, y)
			}
		},
		[activeTab, onAddDamageMarker, onAddPaintMarker],
	)

	const handleMarkerClick = useCallback(
		(marker: Marker) => {
			if (activeTab === 'damages') {
				setEditingMarkerId(marker.id)
			}
		},
		[activeTab],
	)

	return (
		<CollapsibleSection
			title="Visual Accident Details"
			info
			defaultOpen={false}
			className={className}
		>
			<div className="flex flex-col gap-4">
				{/* Segmented tab control */}
				<div className="flex rounded-full bg-black/5 p-1.5">
					<button
						type="button"
						onClick={() => setActiveTab('damages')}
						className={cn(
							'flex-1 cursor-pointer rounded-full px-5 py-3 text-center text-body font-medium transition-colors',
							activeTab === 'damages'
								? 'bg-black text-white'
								: 'bg-transparent text-[#919191]',
						)}
					>
						Damage
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('paint')}
						className={cn(
							'flex-1 cursor-pointer rounded-full px-5 py-3 text-center text-body font-medium transition-colors',
							activeTab === 'paint'
								? 'bg-black text-white'
								: 'bg-transparent text-[#919191]',
						)}
					>
						Paint
					</button>
				</div>

				{/* Manual Setup toggle */}
				<ToggleSwitch
					label={activeTab === 'damages' ? 'Damage Manual Setup' : 'Paint Manual Setup'}
					checked={manualSetup}
					onCheckedChange={setManualSetup}
				/>

				{/* Diagram */}
				{activeTab === 'damages' ? (
					<DamagesView
						markers={damageVehicleMarkers}
						damageMarkers={damageMarkers}
						onDiagramClick={handleDiagramClick}
						onMarkerClick={handleMarkerClick}
						onDeleteMarker={onDeleteDamageMarker}
						onUpdateMarker={onUpdateDamageMarker}
						editingMarkerId={editingMarkerId}
						onEditingChange={setEditingMarkerId}
					/>
				) : (
					<PaintView
						markers={paintVehicleMarkers}
						paintMarkers={paintMarkers}
						onDiagramClick={handleDiagramClick}
						onUpdatePaintMarker={onUpdatePaintMarker}
						onDeletePaintMarker={onDeletePaintMarker}
					/>
				)}

				{/* Add Marker button */}
				<div className="flex justify-center">
					<Button
						variant="primary"
						size="lg"
						onClick={() => {
							/* Clicking on the diagram is the main way to add markers */
						}}
					>
						Add Marker
					</Button>
				</div>
			</div>
		</CollapsibleSection>
	)
}

type DamagesViewProps = {
	markers: Marker[]
	damageMarkers: DamageMarkerData[]
	onDiagramClick: (x: number, y: number) => void
	onMarkerClick: (marker: Marker) => void
	onDeleteMarker: (markerId: string) => void
	onUpdateMarker: (markerId: string, comment: string) => void
	editingMarkerId: string | null
	onEditingChange: (id: string | null) => void
}

function DamagesView({
	markers,
	damageMarkers,
	onDiagramClick,
	onMarkerClick,
	onDeleteMarker,
	onUpdateMarker,
	editingMarkerId,
	onEditingChange,
}: DamagesViewProps) {
	const diagramRef = useRef<HTMLDivElement>(null)

	return (
		<div className="flex flex-col gap-4">
			<div ref={diagramRef} className="relative">
				<VehicleDiagram
					mode="damages"
					markers={markers}
					editable
					onAddMarker={onDiagramClick}
					onMarkerClick={onMarkerClick}
				/>

				{/* Floating comment popover near active marker */}
				{editingMarkerId &&
					(() => {
						const marker = damageMarkers.find((m) => m.id === editingMarkerId)
						if (!marker) return null
						return (
							<MarkerPopover
								marker={marker}
								onUpdate={(comment) => {
									onUpdateMarker(marker.id, comment)
									onEditingChange(null)
								}}
								onDelete={() => {
									onDeleteMarker(marker.id)
									onEditingChange(null)
								}}
								onClose={() => onEditingChange(null)}
							/>
						)
					})()}
			</div>

			{/* Damage marker list */}
			{damageMarkers.length > 0 && (
				<div className="flex flex-col gap-2">
					{damageMarkers.map((marker, index) => (
						<div
							key={marker.id}
							className={cn(
								'flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-colors',
								editingMarkerId === marker.id
									? 'border-primary bg-primary-light'
									: 'border-border bg-white hover:bg-grey-25',
							)}
						>
							<div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-caption font-bold text-white">
								{index + 1}
							</div>
							<span className="flex-1 text-body-sm text-black">
								{marker.comment || 'No comment'}
							</span>
							<button
								type="button"
								onClick={() =>
									onMarkerClick({
										id: marker.id,
										x: marker.x,
										y: marker.y,
										comment: marker.comment ?? undefined,
										color: '#1F2937',
									})
								}
								className="cursor-pointer text-caption text-primary hover:underline"
							>
								Edit
							</button>
							<button
								type="button"
								onClick={() => onDeleteMarker(marker.id)}
								className="cursor-pointer text-grey-100 hover:text-error"
								aria-label={`Delete marker ${index + 1}`}
							>
								<Trash2 className="h-4 w-4" />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

type MarkerPopoverProps = {
	marker: DamageMarkerData
	onUpdate: (comment: string) => void
	onDelete: () => void
	onClose: () => void
}

function MarkerPopover({ marker, onUpdate, onDelete, onClose }: MarkerPopoverProps) {
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		inputRef.current?.focus()
	}, [])

	// Position the popover near the marker's coordinates
	const left = `${Math.min(Math.max(marker.x, 15), 85)}%`
	const isTopHalf = marker.y < 50
	const topStyle = isTopHalf ? `${marker.y + 8}%` : undefined
	const bottomStyle = !isTopHalf ? `${100 - marker.y + 8}%` : undefined

	return (
		<div
			className="absolute z-10 w-64 -translate-x-1/2 rounded-lg border border-border bg-white p-3 shadow-lg"
			style={{ left, top: topStyle, bottom: bottomStyle }}
		>
			<div className="mb-2 flex items-center justify-between">
				<span className="text-caption font-medium text-grey-100">Damage comment</span>
				<button
					type="button"
					onClick={onClose}
					className="cursor-pointer text-grey-100 hover:text-black"
				>
					<X className="h-3.5 w-3.5" />
				</button>
			</div>
			<input
				ref={inputRef}
				type="text"
				className="mb-2 w-full rounded-md border border-border bg-white px-3 py-2 text-body-sm text-black placeholder:text-placeholder outline-none focus:border-border-focus"
				placeholder="Add comment..."
				defaultValue={marker.comment ?? ''}
				onKeyDown={(e) => {
					if (e.key === 'Enter') onUpdate(e.currentTarget.value)
					if (e.key === 'Escape') onClose()
				}}
			/>
			<div className="flex items-center justify-between">
				<button
					type="button"
					onClick={onDelete}
					className="cursor-pointer text-caption text-error hover:underline"
				>
					Delete marker
				</button>
				<button
					type="button"
					onClick={() => onUpdate(inputRef.current?.value ?? '')}
					className="cursor-pointer rounded-md bg-primary px-3 py-1 text-caption font-medium text-white hover:bg-primary-hover"
				>
					Save
				</button>
			</div>
		</div>
	)
}

type PaintViewProps = {
	markers: Marker[]
	paintMarkers: PaintMarkerData[]
	onDiagramClick: (x: number, y: number) => void
	onUpdatePaintMarker: (markerId: string, thickness: number) => void
	onDeletePaintMarker: (markerId: string) => void
}

// Paint call-out positions — mapped to portrait car (front at top)
// Positions as % of the diagram container
// Left column ~29%, Center ~46%, Right ~63% (from Figma absolute positions)
// Vertical positions mapped from Figma y offsets relative to car area
const PAINT_POSITIONS = [
	{ position: 'hood', side: 'center' as const, top: 8 },
	{ position: 'front-left-fender', side: 'left' as const, top: 25 },
	{ position: 'front-right-fender', side: 'right' as const, top: 25 },
	{ position: 'left-front-door', side: 'left' as const, top: 39 },
	{ position: 'right-front-door', side: 'right' as const, top: 39 },
	{ position: 'roof', side: 'center' as const, top: 43 },
	{ position: 'left-rear-door', side: 'left' as const, top: 53 },
	{ position: 'right-rear-door', side: 'right' as const, top: 53 },
	{ position: 'left-rear-fender', side: 'left' as const, top: 66 },
	{ position: 'right-rear-fender', side: 'right' as const, top: 66 },
	{ position: 'trunk', side: 'center' as const, top: 74 },
] as const

// Figma legend colors
const PAINT_LEGEND = [
	{ label: '<70', color: '#49DCF2' },
	{ label: '>=70', color: '#52D57B' },
	{ label: '>160', color: '#F4CA14' },
	{ label: '>300', color: '#F47514' },
	{ label: '>700', color: '#F41414' },
]

function PaintView({ paintMarkers, onDiagramClick, onUpdatePaintMarker }: PaintViewProps) {
	return (
		<div className="flex flex-col gap-4">
			{/* Paint thickness legend — matches Figma exactly */}
			<div className="flex flex-wrap items-center gap-6 py-2.5">
				<span className="text-body font-medium text-black">Standard View</span>
				{PAINT_LEGEND.map((item) => (
					<div key={item.label} className="flex items-center gap-1">
						<div
							className="h-2 w-10 rounded-full"
							style={{ backgroundColor: item.color }}
						/>
						<span className="text-body-sm text-black">{item.label}</span>
					</div>
				))}
			</div>

			{/* Diagram with floating call-out inputs */}
			<div className="relative flex items-center justify-center py-4">
				{/* Car image — centered, constrained width */}
				<img
					src="/images/car-silhouette.png"
					alt="Vehicle outline"
					className="h-auto w-full max-w-72 select-none"
					draggable={false}
				/>

				{/* Floating call-out inputs positioned around the car */}
				{PAINT_POSITIONS.map((pos) => {
					const existing = paintMarkers.find((m) => m.position === pos.position)
					return (
						<PaintCallout
							key={pos.position}
							position={pos.position}
							side={pos.side}
							top={pos.top}
							value={existing?.thickness ?? null}
							onSubmit={(val) => {
								if (existing) {
									onUpdatePaintMarker(existing.id, val)
								} else {
									const approxX =
										pos.side === 'left' ? 20 : pos.side === 'right' ? 80 : 50
									onDiagramClick(approxX, pos.top)
								}
							}}
						/>
					)
				})}
			</div>
		</div>
	)
}

type PaintCalloutProps = {
	position: string
	side: 'left' | 'right' | 'center'
	top: number
	value: number | null
	onSubmit: (thickness: number) => void
}

function PaintCallout({ position, side, top, value, onSubmit }: PaintCalloutProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const color = value != null ? getPaintColor(value) : null

	return (
		<div
			className="absolute z-10 -translate-y-1/2"
			style={{
				top: `${top}%`,
				...(side === 'left'
					? { right: '68%' }
					: side === 'right'
						? { left: '68%' }
						: { left: '50%', transform: 'translate(-50%, -50%)' }),
			}}
		>
			<div
				className={cn(
					'rounded-xl bg-white px-2.5 py-1.5 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.1)]',
					value != null ? 'border-2' : 'border border-border-card',
				)}
				style={value != null ? { borderColor: color ?? undefined } : undefined}
			>
				<input
					ref={inputRef}
					type="text"
					inputMode="numeric"
					className={cn(
						'w-12 border-b border-black bg-transparent py-1 text-body outline-none',
						value != null
							? 'font-normal text-black'
							: 'text-black/30 placeholder:text-black/30',
					)}
					placeholder="μm"
					defaultValue={value != null ? `${value}μm` : ''}
					key={`${position}-${value}`}
					onFocus={(e) => {
						const raw = e.target.value.replace('μm', '')
						e.target.value = raw
						e.target.select()
					}}
					onBlur={(e) => {
						const val = parseInt(e.target.value.replace('μm', ''), 10)
						if (!Number.isNaN(val) && val > 0) {
							onSubmit(val)
							e.target.value = `${val}μm`
						} else if (value != null) {
							e.target.value = `${value}μm`
						} else {
							e.target.value = ''
						}
					}}
					onKeyDown={(e) => {
						if (e.key === 'Enter') e.currentTarget.blur()
						if (e.key === 'Escape') {
							e.currentTarget.value =
								value != null ? `${value}μm` : ''
							e.currentTarget.blur()
						}
					}}
				/>
			</div>
		</div>
	)
}

export type { DamageDiagramSectionProps }
export { DamageDiagramSection }
