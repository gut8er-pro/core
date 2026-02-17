import { Palette, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type PhotoCardProps = {
	src: string
	alt?: string
	variant?: 'grid' | 'viewer' | 'thumbnail'
	onEdit?: () => void
	onDelete?: () => void
	selected?: boolean
	watermark?: boolean
	className?: string
}

const variantClasses = {
	grid: 'aspect-[4/3] w-full rounded-xl',
	viewer: 'aspect-video w-full rounded-xl',
	thumbnail: 'h-14 w-14 rounded-lg',
} as const

function PhotoCard({
	src,
	alt = 'Photo',
	variant = 'grid',
	onEdit,
	onDelete,
	selected,
	watermark,
	className,
}: PhotoCardProps) {
	return (
		<div
			className={cn(
				'group relative overflow-hidden bg-grey-25',
				variantClasses[variant],
				selected && 'ring-2 ring-primary ring-offset-2',
				className,
			)}
		>
			<img
				src={src}
				alt={alt}
				className="h-full w-full object-cover"
				loading="lazy"
			/>

			{watermark && (
				<div className="pointer-events-none absolute bottom-4 left-4">
					<span className="text-body-sm font-bold italic text-white/70">Gut8erPRO</span>
				</div>
			)}

			{/* Floating action buttons - bottom right, stacked vertically */}
			{(onEdit || onDelete) && variant === 'grid' && (
				<div className="absolute bottom-3 right-3 flex flex-col gap-2">
					{onEdit && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation()
								onEdit()
							}}
							className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-black/90 backdrop-blur-sm transition-colors hover:bg-black"
							aria-label="Annotate photo"
						>
							<Palette className="h-4 w-4 text-white" />
						</button>
					)}
					{onDelete && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation()
								onDelete()
							}}
							className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-black/90 backdrop-blur-sm transition-colors hover:bg-black"
							aria-label="Delete photo"
						>
							<Trash2 className="h-4 w-4 text-white" />
						</button>
					)}
				</div>
			)}
		</div>
	)
}

export { PhotoCard }
export type { PhotoCardProps }
