'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Trash2, X } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { Button } from '@/components/ui/button'
import { VehicleDiagram } from '@/components/ui/vehicle-diagram'
import type { Marker } from '@/components/ui/vehicle-diagram'
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
		<CollapsibleSection title="Visual Accident Details" info defaultOpen={false} className={className}>
			<div className="flex flex-col gap-6">
				{/* Manual Setup toggle */}
				<ToggleSwitch
					label={activeTab === 'damages' ? 'Damage Manual Setup' : 'Paint Manual Setup'}
					checked={manualSetup}
					onCheckedChange={setManualSetup}
				/>

				{/* Segmented tab control */}
				<div className="flex rounded-full border border-border bg-white p-1">
					<button
						type="button"
						onClick={() => setActiveTab('damages')}
						className={cn(
							'flex-1 cursor-pointer rounded-full py-2.5 text-center text-body-sm font-medium transition-colors',
							activeTab === 'damages'
								? 'bg-black text-white'
								: 'bg-transparent text-grey-100 hover:bg-grey-25',
						)}
					>
						Damages
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('paint')}
						className={cn(
							'flex-1 cursor-pointer rounded-full py-2.5 text-center text-body-sm font-medium transition-colors',
							activeTab === 'paint'
								? 'bg-black text-white'
								: 'bg-transparent text-grey-100 hover:bg-grey-25',
						)}
					>
						Paint
					</button>
				</div>

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
				{editingMarkerId && (() => {
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
								onClick={() => onMarkerClick({ id: marker.id, x: marker.x, y: marker.y, comment: marker.comment ?? undefined, color: '#1F2937' })}
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
	const topStyle = isTopHalf
		? `${marker.y + 8}%`
		: undefined
	const bottomStyle = !isTopHalf
		? `${100 - marker.y + 8}%`
		: undefined

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

const PAINT_POSITIONS = [
	{ label: 'Hood', x: 50, y: 15, position: 'hood' },
	{ label: 'Roof', x: 50, y: 50, position: 'roof' },
	{ label: 'Trunk', x: 50, y: 85, position: 'trunk' },
	{ label: 'Left Fender', x: 10, y: 30, position: 'left-fender' },
	{ label: 'Right Fender', x: 90, y: 30, position: 'right-fender' },
	{ label: 'Left Door', x: 10, y: 60, position: 'left-door' },
	{ label: 'Right Door', x: 90, y: 60, position: 'right-door' },
] as const

function PaintView({
	markers,
	paintMarkers,
	onDiagramClick,
	onUpdatePaintMarker,
	onDeletePaintMarker,
}: PaintViewProps) {
	return (
		<div className="flex flex-col gap-4">
			{/* Paint thickness legend */}
			<div className="flex flex-wrap items-center gap-4">
				<span className="text-body-sm font-medium text-black">Standard View</span>
				{[
					{ label: '<70', color: '#3B82F6' },
					{ label: '>=70', color: '#22C55E' },
					{ label: '>160', color: '#EAB308' },
					{ label: '>300', color: '#F97316' },
					{ label: '>700', color: '#EF4444' },
				].map((item) => (
					<div key={item.label} className="flex items-center gap-1">
						<div
							className="h-3 w-6 rounded-full"
							style={{ backgroundColor: item.color }}
						/>
						<span className="text-caption text-grey-100">{item.label}</span>
					</div>
				))}
			</div>

			{/* Diagram with positioned paint inputs */}
			<div className="relative">
				<VehicleDiagram
					mode="paint"
					markers={markers}
					editable
					onAddMarker={onDiagramClick}
				/>

				{/* Paint measurement inputs positioned around diagram */}
				{PAINT_POSITIONS.map((pos) => {
					const existing = paintMarkers.find((m) => m.position === pos.position)
					return (
						<PaintMeasurementInput
							key={pos.position}
							label={pos.label}
							position={pos}
							marker={existing ?? null}
							onSubmit={(thickness) => {
								if (existing) {
									onUpdatePaintMarker(existing.id, thickness)
								} else {
									onDiagramClick(pos.x, pos.y)
								}
							}}
							onDelete={existing ? () => onDeletePaintMarker(existing.id) : undefined}
						/>
					)
				})}
			</div>

			{/* Paint marker list */}
			{paintMarkers.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{paintMarkers.map((marker) => (
						<div
							key={marker.id}
							className="flex items-center gap-2 rounded-full border px-3 py-1.5"
							style={{ borderColor: marker.color ?? getPaintColor(marker.thickness) }}
						>
							<div
								className="h-2.5 w-2.5 rounded-full"
								style={{ backgroundColor: marker.color ?? getPaintColor(marker.thickness) }}
							/>
							<span className="text-caption font-medium text-black">{marker.thickness}µm</span>
							{marker.position && (
								<span className="text-caption text-grey-100">{marker.position}</span>
							)}
							<button
								type="button"
								onClick={() => onDeletePaintMarker(marker.id)}
								className="cursor-pointer text-grey-100 hover:text-error"
								aria-label="Remove measurement"
							>
								<X className="h-3 w-3" />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

type PaintMeasurementInputProps = {
	label: string
	position: { x: number; y: number; position: string }
	marker: PaintMarkerData | null
	onSubmit: (thickness: number) => void
	onDelete?: () => void
}

function PaintMeasurementInput({ label, position, marker, onSubmit, onDelete }: PaintMeasurementInputProps) {
	const [editing, setEditing] = useState(false)
	const thickness = marker?.thickness ?? 0
	const color = marker ? (marker.color ?? getPaintColor(marker.thickness)) : '#D1D5DB'

	// Position: left side items anchor right, right side items anchor left
	const isLeft = position.x < 30
	const isRight = position.x > 70

	return (
		<div
			className="absolute z-10 flex items-center gap-1"
			style={{
				left: isLeft ? '0%' : isRight ? undefined : `${position.x}%`,
				right: isRight ? '0%' : undefined,
				top: `${position.y}%`,
				transform: isLeft || isRight ? 'translateY(-50%)' : 'translate(-50%, -50%)',
			}}
		>
			{editing ? (
				<input
					type="number"
					className="w-16 rounded border px-1.5 py-0.5 text-center text-caption outline-none focus:border-border-focus"
					style={{ borderColor: color }}
					placeholder="µm"
					defaultValue={thickness || ''}
					autoFocus
					onBlur={(e) => {
						const val = parseInt(e.target.value, 10)
						if (!isNaN(val) && val > 0) onSubmit(val)
						setEditing(false)
					}}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							const val = parseInt(e.currentTarget.value, 10)
							if (!isNaN(val) && val > 0) onSubmit(val)
							setEditing(false)
						}
						if (e.key === 'Escape') setEditing(false)
					}}
				/>
			) : (
				<button
					type="button"
					onClick={() => setEditing(true)}
					className={cn(
						'cursor-pointer rounded border-2 px-2 py-0.5 text-caption font-medium transition-colors hover:opacity-80',
						marker ? 'text-white' : 'bg-white text-grey-100',
					)}
					style={{
						borderColor: color,
						backgroundColor: marker ? color : undefined,
					}}
					title={`${label}: ${marker ? `${thickness}µm` : 'Click to add'}`}
				>
					{marker ? `${thickness}` : label}
				</button>
			)}
		</div>
	)
}

export { DamageDiagramSection }
export type { DamageDiagramSectionProps }
