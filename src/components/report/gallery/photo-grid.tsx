'use client'

import { Palette, Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
import type { Photo } from '@/hooks/use-photos'
import { cn } from '@/lib/utils'
import { MAX_PHOTOS_PER_REPORT } from '@/lib/validations/photos'

type PhotoGridProps = {
	photos: Photo[]
	onEdit?: (photoId: string) => void
	onDelete?: (photoId: string) => void
	selectedId?: string
	onSelect?: (photoId: string) => void
	onAdd?: () => void
	maxPhotos?: number
	className?: string
}

function PhotoGrid({
	photos,
	onEdit,
	onDelete,
	onSelect,
	onAdd,
	maxPhotos = MAX_PHOTOS_PER_REPORT,
	className,
}: PhotoGridProps) {
	const t = useTranslations('report')
	const isMaxReached = photos.length >= maxPhotos
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
				<p className="text-body-sm text-grey-100">{t('gallery.noPhotosYet')}</p>
			</div>
		)
	}

	return (
		<div
			className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-card bg-white p-6', className)}
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
								aria-label={t('gallery.annotatePhoto')}
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
								aria-label={t('gallery.deletePhoto')}
							>
								<Trash2 className="h-6 w-6 text-white" />
							</button>
						)}
					</div>
				</div>
			))}

			{onAdd && (
				<button
					type="button"
					onClick={onAdd}
					disabled={isMaxReached}
					title={isMaxReached ? t('gallery.maxPhotosHint', { limit: maxPhotos }) : undefined}
					className="flex aspect-4/3 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-card text-grey-100 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border-card disabled:hover:text-grey-100"
				>
					<Plus className="h-8 w-8" />
					<span className="text-body-sm font-medium">{t('gallery.addMorePhotos')}</span>
				</button>
			)}
		</div>
	)
}

export type { PhotoGridProps }
export { PhotoGrid }
