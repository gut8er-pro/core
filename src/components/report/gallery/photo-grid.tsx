'use client'

import { useCallback } from 'react'
import { PhotoCard } from '@/components/ui/photo-card'
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
	selectedId,
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
					'flex flex-col items-center justify-center rounded-lg border border-dashed border-grey-50 py-12 text-center',
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
				'grid grid-cols-1 gap-4 md:grid-cols-2',
				className,
			)}
		>
			{photos.map((photo) => (
				<div
					key={photo.id}
					role="button"
					tabIndex={0}
					onClick={() => handleSelect(photo.id)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault()
							handleSelect(photo.id)
						}
					}}
					className="cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
				>
					<PhotoCard
						src={photo.thumbnailUrl ?? photo.url}
						alt={photo.filename}
						variant="grid"
						selected={selectedId === photo.id}
						onEdit={onEdit ? () => onEdit(photo.id) : undefined}
						onDelete={onDelete ? () => onDelete(photo.id) : undefined}
					/>
				</div>
			))}
		</div>
	)
}

export { PhotoGrid }
export type { PhotoGridProps }
