'use client'

import { useCallback } from 'react'
import { Palette, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Photo } from '@/hooks/use-photos'

type PhotoGridProps = {
	photos: Photo[]
	onEdit?: (photoId: string) => void
	onDelete?: (photoId: string) => void
	selectedId?: string
	onSelect?: (photoId: string) => void
	className?: string
}

function PhotoGrid({
	photos,
	onEdit,
	onDelete,
	onSelect,
	className,
}: PhotoGridProps) {
	const handleSelect = useCallback(
		(photoId: string) => {
			onSelect?.(photoId)
		},
		[onSelect],
	)

	if (photos.length === 0) {
		return (
			<div
				className={cn(
					'flex flex-col items-center justify-center rounded-card bg-white py-12 text-center',
					className,
				)}
			>
				<p className="text-body-sm text-grey-100">
					No photos uploaded yet
				</p>
			</div>
		)
	}

	return (
		<div
			className={cn(
				'grid grid-cols-2 gap-4 rounded-card bg-white p-6',
				className,
			)}
		>
			{photos.map((photo) => (
				<div
					key={photo.id}
					className="group relative cursor-pointer overflow-hidden rounded-xl"
					role="button"
					tabIndex={0}
					onClick={() => handleSelect(photo.id)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault()
							handleSelect(photo.id)
						}
					}}
				>
					<img
						src={photo.annotatedUrl ?? photo.previewUrl ?? photo.url}
						alt={photo.filename}
						className="aspect-4/3 w-full object-cover"
						loading="lazy"
					/>

					{/* Floating action buttons — bottom right */}
					<div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
						{onEdit && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									onEdit(photo.id)
								}}
								className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-md bg-black/90 backdrop-blur-sm transition-colors hover:bg-black"
								aria-label="Annotate photo"
							>
								<Palette className="h-6 w-6 text-white" />
							</button>
						)}
						{onDelete && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									onDelete(photo.id)
								}}
								className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-md bg-black/90 backdrop-blur-sm transition-colors hover:bg-black"
								aria-label="Delete photo"
							>
								<Trash2 className="h-6 w-6 text-white" />
							</button>
						)}
					</div>
				</div>
			))}
		</div>
	)
}

export { PhotoGrid }
export type { PhotoGridProps }
