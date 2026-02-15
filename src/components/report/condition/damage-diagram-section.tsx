'use client'

import { useState, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
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

const PAINT_POSITIONS = [
	{ key: 'hood', label: 'Hood' },
	{ key: 'roof', label: 'Roof' },
	{ key: 'trunk', label: 'Trunk' },
	{ key: 'front_left', label: 'Front Left' },
	{ key: 'front_right', label: 'Front Right' },
	{ key: 'rear_left', label: 'Rear Left' },
	{ key: 'rear_right', label: 'Rear Right' },
] as const

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
		<CollapsibleSection title="Visual Accident Details" defaultOpen={false} className={className}>
			<div className="flex flex-col gap-6">
				{/* Sub-tabs */}
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={() => setActiveTab('damages')}
						className={cn(
							'inline-flex cursor-pointer items-center rounded-full px-4 py-2 text-body-sm font-medium transition-colors',
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
							'inline-flex cursor-pointer items-center rounded-full px-4 py-2 text-body-sm font-medium transition-colors',
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
	return (
		<div className="flex flex-col gap-4">
			<p className="text-caption text-grey-100">
				Click on the diagram to place a damage marker. Click a marker to edit its comment.
			</p>

			<VehicleDiagram
				mode="damages"
				markers={markers}
				editable
				onAddMarker={onDiagramClick}
				onMarkerClick={onMarkerClick}
			/>

			{/* Marker list */}
			{damageMarkers.length > 0 && (
				<div className="flex flex-col gap-2">
					<h4 className="text-body-sm font-semibold text-black">
						Damage Markers ({damageMarkers.length})
					</h4>
					<div className="flex flex-col gap-1">
						{damageMarkers.map((marker, index) => (
							<div
								key={marker.id}
								className="flex items-center gap-2 rounded-md border border-border bg-white px-4 py-3"
							>
								<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-white text-caption font-medium">
									{index + 1}
								</div>

								{editingMarkerId === marker.id ? (
									<input
										type="text"
										className="flex-1 border-none bg-transparent text-body-sm text-black outline-none focus:ring-0"
										placeholder="Add a comment..."
										defaultValue={marker.comment ?? ''}
										autoFocus
										onBlur={(e) => {
											onUpdateMarker(marker.id, e.target.value)
											onEditingChange(null)
										}}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												onUpdateMarker(marker.id, e.currentTarget.value)
												onEditingChange(null)
											}
										}}
									/>
								) : (
									<span
										className="flex-1 cursor-pointer text-body-sm text-black"
										onClick={() => onEditingChange(marker.id)}
									>
										{marker.comment || 'No comment — click to edit'}
									</span>
								)}

								<span className="shrink-0 text-caption text-grey-100">
									({marker.x.toFixed(0)}, {marker.y.toFixed(0)})
								</span>

								<button
									type="button"
									onClick={() => onDeleteMarker(marker.id)}
									className="shrink-0 cursor-pointer text-grey-100 transition-colors hover:text-error"
									aria-label={`Delete marker ${index + 1}`}
								>
									<Trash2 className="h-4 w-4" />
								</button>
							</div>
						))}
					</div>
				</div>
			)}
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

function PaintView({
	markers,
	paintMarkers,
	onDiagramClick,
	onUpdatePaintMarker,
	onDeletePaintMarker,
}: PaintViewProps) {
	return (
		<div className="flex flex-col gap-4">
			<p className="text-caption text-grey-100">
				Click on the diagram to add a paint measurement point. Enter thickness values in micrometers.
			</p>

			<VehicleDiagram
				mode="paint"
				markers={markers}
				editable
				onAddMarker={onDiagramClick}
			/>

			{/* Paint marker inputs */}
			{paintMarkers.length > 0 && (
				<div className="flex flex-col gap-2">
					<h4 className="text-body-sm font-semibold text-black">
						Paint Measurements ({paintMarkers.length})
					</h4>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
						{paintMarkers.map((marker, index) => {
							const color = marker.color ?? getPaintColor(marker.thickness)
							return (
								<div
									key={marker.id}
									className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2"
								>
									<div
										className="h-4 w-4 shrink-0 rounded-full"
										style={{ backgroundColor: color }}
									/>
									<span className="shrink-0 text-caption text-grey-100">
										#{index + 1}
										{marker.position ? ` (${marker.position})` : ''}
									</span>
									<input
										type="number"
										className="w-20 border-none bg-transparent text-right text-body-sm text-black outline-none focus:ring-0"
										defaultValue={marker.thickness}
										min={0}
										onBlur={(e) => {
											const val = parseFloat(e.target.value)
											if (!isNaN(val) && val !== marker.thickness) {
												onUpdatePaintMarker(marker.id, val)
											}
										}}
									/>
									<span className="text-caption text-grey-100">um</span>
									<button
										type="button"
										onClick={() => onDeletePaintMarker(marker.id)}
										className="ml-auto shrink-0 cursor-pointer text-grey-100 transition-colors hover:text-error"
										aria-label={`Delete paint marker ${index + 1}`}
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								</div>
							)
						})}
					</div>
				</div>
			)}

			{/* Position-based quick inputs */}
			<div className="flex flex-col gap-2">
				<h4 className="text-body-sm font-semibold text-black">
					Quick Measurements by Position
				</h4>
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
					{PAINT_POSITIONS.map((pos) => {
						const existing = paintMarkers.find((m) => m.position === pos.key)
						const color = existing ? getPaintColor(existing.thickness) : '#D1D5DB'
						return (
							<div
								key={pos.key}
								className="flex items-center gap-1 rounded-md border border-border bg-white px-3 py-2"
							>
								<div
									className="h-3 w-3 shrink-0 rounded-full"
									style={{ backgroundColor: color }}
								/>
								<span className="flex-1 text-caption font-medium text-black">
									{pos.label}
								</span>
								<span className="text-caption text-grey-100">
									{existing ? `${existing.thickness} um` : '--'}
								</span>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}

export { DamageDiagramSection }
export type { DamageDiagramSectionProps }
