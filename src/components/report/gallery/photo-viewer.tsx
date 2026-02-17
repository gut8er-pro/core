'use client'

import { ImageOff, Palette, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Photo } from '@/hooks/use-photos'

type PhotoViewerProps = {
	photo: Photo | null
	onEdit?: () => void
	onDelete?: () => void
	onAnnotate?: () => void
	className?: string
}

function PhotoViewer({
	photo,
	onDelete,
	onAnnotate,
	className,
}: PhotoViewerProps) {
	if (!photo) {
		return (
			<div
				className={cn(
					'flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-grey-50 bg-grey-25 py-16 text-center',
					className,
				)}
			>
				<ImageOff className="h-10 w-10 text-grey-100" />
				<p className="text-body text-grey-100">
					Select a photo to view
				</p>
			</div>
		)
	}

	return (
		<div className={cn('relative overflow-hidden rounded-2xl', className)}>
			{/* Photo - clickable to open annotation */}
			<img
				src={photo.annotatedUrl ?? photo.previewUrl ?? photo.url}
				alt={photo.filename}
				className="aspect-video w-full cursor-pointer rounded-2xl object-cover"
				loading="lazy"
				onClick={onAnnotate}
			/>

			{/* Watermark */}
			<div className="pointer-events-none absolute bottom-4 left-4">
				<span className="text-body-sm font-bold italic text-white/70">Gut8erPRO</span>
			</div>

			{/* Floating action buttons - bottom right, stacked vertically, dark bg */}
			<div className="absolute bottom-4 right-4 flex flex-col gap-2">
				{onAnnotate && (
					<button
						type="button"
						onClick={onAnnotate}
						className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg bg-black/90 backdrop-blur-sm transition-colors hover:bg-black"
						aria-label="Annotate photo"
					>
						<Palette className="h-6 w-6 text-white" />
					</button>
				)}
				{onDelete && (
					<button
						type="button"
						onClick={onDelete}
						className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg bg-black/90 backdrop-blur-sm transition-colors hover:bg-black"
						aria-label="Delete photo"
					>
						<Trash2 className="h-6 w-6 text-white" />
					</button>
				)}
			</div>
		</div>
	)
}

export { PhotoViewer }
export type { PhotoViewerProps }
