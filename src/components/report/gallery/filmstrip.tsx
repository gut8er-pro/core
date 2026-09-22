'use client'

import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import type { Photo } from '@/hooks/use-photos'
import { cn } from '@/lib/utils'
import { MAX_PHOTOS_PER_REPORT } from '@/lib/validations/photos'
import { PHOTO_DRAG_TYPE } from './photo-grid'

type FilmstripProps = {
	photos: Photo[]
	selectedId?: string
	onSelect?: (photoId: string) => void
	onAdd?: () => void
	onReorder?: (fromId: string, toId: string) => void
	maxPhotos?: number
	locked?: boolean
	className?: string
}

function Filmstrip({
	photos,
	selectedId,
	onSelect,
	onAdd,
	onReorder,
	maxPhotos = MAX_PHOTOS_PER_REPORT,
	locked = false,
	className,
}: FilmstripProps) {
	const t = useTranslations('report')
	const [draggingId, setDraggingId] = useState<string | null>(null)
	const [dropTargetId, setDropTargetId] = useState<string | null>(null)
	const isMaxReached = photos.length >= maxPhotos
	const canReorder = !locked && !!onReorder && photos.length > 1

	const handleSelect = useCallback(
		(photoId: string) => {
			onSelect?.(photoId)
		},
		[onSelect],
	)

	const handleDragStart = useCallback((event: React.DragEvent, photoId: string) => {
		event.dataTransfer.effectAllowed = 'move'
		event.dataTransfer.setData(PHOTO_DRAG_TYPE, photoId)
		setDraggingId(photoId)
	}, [])

	const handleDragOver = useCallback(
		(event: React.DragEvent, photoId: string) => {
			if (!draggingId || draggingId === photoId) return
			event.preventDefault()
			event.dataTransfer.dropEffect = 'move'
			setDropTargetId(photoId)
		},
		[draggingId],
	)

	const handleDrop = useCallback(
		(event: React.DragEvent, photoId: string) => {
			const fromId = event.dataTransfer.getData(PHOTO_DRAG_TYPE)
			if (!fromId || fromId === photoId) return
			event.preventDefault()
			event.stopPropagation()
			onReorder?.(fromId, photoId)
			setDraggingId(null)
			setDropTargetId(null)
		},
		[onReorder],
	)

	const handleDragEnd = useCallback(() => {
		setDraggingId(null)
		setDropTargetId(null)
	}, [])

	if (photos.length === 0) {
		return null
	}

	return (
		<div
			className={cn('flex gap-3.5 overflow-x-auto scroll-smooth', className)}
			role="listbox"
			aria-label={t('gallery.photoFilmstrip')}
		>
			{photos.map((photo) => {
				const isSelected = selectedId === photo.id
				return (
					<button
						key={photo.id}
						type="button"
						role="option"
						data-photo-id={photo.id}
						aria-selected={isSelected}
						draggable={canReorder}
						title={canReorder ? t('gallery.reorderPhotoHint') : undefined}
						onDragStart={canReorder ? (e) => handleDragStart(e, photo.id) : undefined}
						onDragOver={canReorder ? (e) => handleDragOver(e, photo.id) : undefined}
						onDrop={canReorder ? (e) => handleDrop(e, photo.id) : undefined}
						onDragEnd={canReorder ? handleDragEnd : undefined}
						onClick={() => handleSelect(photo.id)}
						className={cn(
							'relative h-[60px] w-[60px] shrink-0 cursor-pointer overflow-hidden rounded-xl transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
							isSelected && 'border-2 border-primary',
							draggingId === photo.id && 'opacity-40',
							dropTargetId === photo.id && 'ring-2 ring-primary',
						)}
					>
						<img
							src={photo.thumbnailUrl ?? photo.url}
							alt={photo.filename}
							className="h-full w-full object-cover"
							loading="lazy"
							draggable={false}
						/>
					</button>
				)
			})}

			{/* Add photo button */}
			{onAdd && !locked && (
				<button
					type="button"
					onClick={onAdd}
					disabled={isMaxReached}
					title={isMaxReached ? t('gallery.maxPhotosHint', { limit: maxPhotos }) : undefined}
					className="flex h-[60px] w-[60px] shrink-0 cursor-pointer items-center justify-center rounded-xl bg-border-card transition-colors hover:bg-grey-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-border-card"
					aria-label={t('gallery.addMorePhotos')}
				>
					<Plus className="h-6 w-6 text-grey-100" />
				</button>
			)}
		</div>
	)
}

export type { FilmstripProps }
export { Filmstrip }
