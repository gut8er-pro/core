'use client'

import { useState, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
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
	return (
		<div className="flex flex-col gap-4">
			<VehicleDiagram
				mode="damages"
				markers={markers}
				editable
				onAddMarker={onDiagramClick}
				onMarkerClick={onMarkerClick}
			/>

			{/* Inline comment input for selected marker */}
			{editingMarkerId && (() => {
				const marker = damageMarkers.find((m) => m.id === editingMarkerId)
				if (!marker) return null
				return (
					<div className="mx-auto w-full max-w-sm rounded-md border border-border bg-white px-4 py-3 shadow-sm">
						<input
							type="text"
							className="w-full border-none bg-transparent text-body-sm text-black placeholder:text-placeholder outline-none focus:ring-0"
							placeholder="Comment"
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
					</div>
				)
			})()}

			{/* Marker list (hidden, accessible for screen readers) */}
			{damageMarkers.length > 0 && (
				<div className="sr-only">
					{damageMarkers.map((marker, index) => (
						<div key={marker.id}>
							Marker {index + 1}: {marker.comment || 'No comment'}
							<button
								type="button"
								onClick={() => onDeleteMarker(marker.id)}
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

type PaintViewProps = {
	markers: Marker[]
	paintMarkers: PaintMarkerData[]
	onDiagramClick: (x: number, y: number) => void
	onUpdatePaintMarker: (markerId: string, thickness: number) => void
	onDeletePaintMarker: (markerId: string) => void
}

function PaintView({
	markers,
	onDiagramClick,
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

			<VehicleDiagram
				mode="paint"
				markers={markers}
				editable
				onAddMarker={onDiagramClick}
			/>
		</div>
	)
}

export { DamageDiagramSection }
export type { DamageDiagramSectionProps }
