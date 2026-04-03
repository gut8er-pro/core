import { getPaintColor } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'

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
	function handleClick(e: React.MouseEvent<HTMLDivElement>) {
		if (!editable || !onAddMarker) return
		const rect = e.currentTarget.getBoundingClientRect()
		const x = ((e.clientX - rect.left) / rect.width) * 100
		const y = ((e.clientY - rect.top) / rect.height) * 100
		onAddMarker(x, y)
	}

	return (
		<div className={cn('flex flex-col gap-4', className)}>
			{mode === 'paint' && <PaintLegend />}

			<div className="relative rounded-lg border border-border bg-white p-4">
				<div
					className={cn('relative mx-auto', editable && 'cursor-crosshair')}
					style={{ maxWidth: 320 }}
					onClick={handleClick}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault()
						}
					}}
					role={editable ? 'button' : 'img'}
					tabIndex={editable ? 0 : undefined}
					aria-label={mode === 'damages' ? 'Vehicle damage diagram' : 'Vehicle paint diagram'}
				>
					{/* Car silhouette — portrait orientation, front facing up */}
					<img
						src="/images/car-silhouette.png"
						alt=""
						className="h-auto w-full select-none"
						draggable={false}
					/>

					{/* Markers overlay */}
					{markers.map((marker) => {
						const fill =
							mode === 'paint' && marker.value != null
								? getPaintColor(marker.value)
								: marker.color || '#1F2937'

						return (
							<button
								key={marker.id}
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									onMarkerClick?.(marker)
								}}
								className={cn(
									'absolute flex items-center justify-center rounded-full -translate-x-1/2 -translate-y-1/2',
									onMarkerClick && 'cursor-pointer hover:scale-110 transition-transform',
								)}
								style={{
									left: `${marker.x}%`,
									top: `${marker.y}%`,
									width: 22,
									height: 22,
									backgroundColor: fill,
									opacity: 0.9,
								}}
								aria-label={
									mode === 'damages'
										? `Damage marker: ${marker.comment || 'No comment'}`
										: `Paint: ${marker.value || 0}µm`
								}
							>
								{mode === 'paint' && marker.value != null && (
									<span className="text-[8px] font-bold leading-none text-white">
										{marker.value}
									</span>
								)}
							</button>
						)
					})}
				</div>
			</div>
		</div>
	)
}

function PaintLegend() {
	const legend = [
		{ label: '<70µm', color: '#49DCF2' },
		{ label: '≥70µm', color: '#52D57B' },
		{ label: '>160µm', color: '#F4CA14' },
		{ label: '>300µm', color: '#F47514' },
		{ label: '>700µm', color: '#F41414' },
	]

	return (
		<div className="flex flex-wrap gap-2" aria-label="Paint thickness legend">
			{legend.map((item) => (
				<div key={item.label} className="flex items-center gap-1">
					<div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
					<span className="text-caption text-grey-100">{item.label}</span>
				</div>
			))}
		</div>
	)
}

export type { Marker, VehicleDiagramProps }
export { PaintLegend, VehicleDiagram }
