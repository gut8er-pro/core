import { Edit2, Trash2 } from 'lucide-react'
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
	grid: 'aspect-[4/3] w-full rounded-lg',
	viewer: 'aspect-video w-full rounded-lg',
	thumbnail: 'h-16 w-24 rounded-md',
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
				<div className="absolute inset-0 flex items-center justify-center">
					<span className="select-none text-h2 font-bold text-white/30">Gut8erPRO</span>
				</div>
			)}

			{(onEdit || onDelete) && variant === 'grid' && (
				<div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
					{onEdit && (
						<button
							type="button"
							onClick={onEdit}
							className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-black/60 text-white transition-colors hover:bg-black/80"
							aria-label="Edit photo"
						>
							<Edit2 className="h-4 w-4" />
						</button>
					)}
					{onDelete && (
						<button
							type="button"
							onClick={onDelete}
							className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-black/60 text-white transition-colors hover:bg-black/80"
							aria-label="Delete photo"
						>
							<Trash2 className="h-4 w-4" />
						</button>
					)}
				</div>
			)}
		</div>
	)
}

export { PhotoCard }
export type { PhotoCardProps }
