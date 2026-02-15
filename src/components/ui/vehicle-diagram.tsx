import { cn } from '@/lib/utils'
import { getPaintColor } from '@/lib/design-tokens'

type Marker = {
	id: string
	x: number
	y: number
	comment?: string
	value?: number
	color?: string
}

type VehicleDiagramProps = {
	mode?: 'damages' | 'paint'
	markers?: Marker[]
	onAddMarker?: (x: number, y: number) => void
	onMarkerClick?: (marker: Marker) => void
	editable?: boolean
	className?: string
}

function VehicleDiagram({
	mode = 'damages',
	markers = [],
	onAddMarker,
	onMarkerClick,
	editable = false,
	className,
}: VehicleDiagramProps) {
	function handleDiagramClick(e: React.MouseEvent<SVGSVGElement>) {
		if (!editable || !onAddMarker) return
		const svg = e.currentTarget
		const rect = svg.getBoundingClientRect()
		const x = ((e.clientX - rect.left) / rect.width) * 100
		const y = ((e.clientY - rect.top) / rect.height) * 100
		onAddMarker(x, y)
	}

	return (
		<div className={cn('flex flex-col gap-4', className)}>
			{mode === 'paint' && <PaintLegend />}

			<div className="relative rounded-lg border border-border bg-white p-4">
				<svg
					viewBox="0 0 400 200"
					className={cn(
						'h-auto w-full',
						editable && 'cursor-crosshair',
					)}
					onClick={handleDiagramClick}
					aria-label={mode === 'damages' ? 'Vehicle damage diagram' : 'Vehicle paint diagram'}
					role="img"
				>
					{/* Simplified top-down car outline */}
					<rect
						x="100"
						y="20"
						width="200"
						height="160"
						rx="40"
						fill="none"
						stroke="#D1D5DB"
						strokeWidth="2"
					/>
					{/* Windshield */}
					<line x1="140" y1="60" x2="260" y2="60" stroke="#D1D5DB" strokeWidth="1.5" />
					{/* Rear window */}
					<line x1="140" y1="140" x2="260" y2="140" stroke="#D1D5DB" strokeWidth="1.5" />
					{/* Center line */}
					<line
						x1="200"
						y1="20"
						x2="200"
						y2="180"
						stroke="#D1D5DB"
						strokeWidth="0.5"
						strokeDasharray="4 4"
					/>
					{/* Wheels */}
					<rect x="85" y="45" width="15" height="30" rx="3" fill="#E5E7EB" stroke="#D1D5DB" />
					<rect x="300" y="45" width="15" height="30" rx="3" fill="#E5E7EB" stroke="#D1D5DB" />
					<rect x="85" y="125" width="15" height="30" rx="3" fill="#E5E7EB" stroke="#D1D5DB" />
					<rect x="300" y="125" width="15" height="30" rx="3" fill="#E5E7EB" stroke="#D1D5DB" />

					{/* Markers */}
					{markers.map((marker) => {
						const cx = (marker.x / 100) * 400
						const cy = (marker.y / 100) * 200
						const fill =
							mode === 'paint' && marker.value != null
								? getPaintColor(marker.value)
								: marker.color || '#1F2937'

						return (
							<g
								key={marker.id}
								onClick={(e) => {
									e.stopPropagation()
									onMarkerClick?.(marker)
								}}
								className={cn(onMarkerClick && 'cursor-pointer')}
								role="button"
								tabIndex={0}
								aria-label={
									mode === 'damages'
										? `Damage marker: ${marker.comment || 'No comment'}`
										: `Paint: ${marker.value || 0}µm`
								}
							>
								<circle cx={cx} cy={cy} r="8" fill={fill} opacity="0.9" />
								{mode === 'paint' && marker.value != null && (
									<text
										x={cx}
										y={cy + 1}
										textAnchor="middle"
										dominantBaseline="middle"
										fill="white"
										fontSize="6"
										fontWeight="bold"
									>
										{marker.value}
									</text>
								)}
							</g>
						)
					})}
				</svg>
			</div>
		</div>
	)
}

function PaintLegend() {
	const legend = [
		{ label: '<70µm', color: '#3B82F6' },
		{ label: '≥70µm', color: '#16A34A' },
		{ label: '>160µm', color: '#EAB308' },
		{ label: '>300µm', color: '#F97316' },
		{ label: '>700µm', color: '#EF4444' },
	]

	return (
		<div className="flex flex-wrap gap-2" aria-label="Paint thickness legend">
			{legend.map((item) => (
				<div key={item.label} className="flex items-center gap-1">
					<div
						className="h-3 w-3 rounded-full"
						style={{ backgroundColor: item.color }}
					/>
					<span className="text-caption text-grey-100">{item.label}</span>
				</div>
			))}
		</div>
	)
}

export { VehicleDiagram, PaintLegend }
export type { VehicleDiagramProps, Marker }
