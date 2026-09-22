'use client'

import { GripVertical, Palette, Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { useFileDrop } from '@/hooks/use-file-drop'
import type { Photo } from '@/hooks/use-photos'
import { cn } from '@/lib/utils'
import { MAX_PHOTOS_PER_REPORT } from '@/lib/validations/photos'

const PHOTO_DRAG_TYPE = 'application/x-gut8erpro-photo'

type PhotoGridProps = {
	photos: Photo[]
	onEdit?: (photoId: string) => void
	onDelete?: (photoId: string) => void
	selectedId?: string
	onSelect?: (photoId: string) => void
	onAdd?: () => void
	onFilesDropped?: (files: File[]) => void
	onReorder?: (fromId: string, toId: string) => void
	maxPhotos?: number
	locked?: boolean
	className?: string
}

function PhotoGrid({
	photos,
	onEdit,
	onDelete,
	onSelect,
	onAdd,
	onFilesDropped,
	onReorder,
	maxPhotos = MAX_PHOTOS_PER_REPORT,
	locked = false,
	className,
}: PhotoGridProps) {
	const t = useTranslations('report')
	const [draggingId, setDraggingId] = useState<string | null>(null)
	const [dropTargetId, setDropTargetId] = useState<string | null>(null)
	const isMaxReached = photos.length >= maxPhotos
	const canUpload = !locked && !isMaxReached && !!onFilesDropped
	const canReorder = !locked && !!onReorder && photos.length > 1

	const handleSelect = useCallback(
		(photoId: string) => {
			onSelect?.(photoId)
		},
		[onSelect],
	)

	const { isDragOver, dropHandlers } = useFileDrop({
		onFiles: onFilesDropped ?? (() => {}),
		disabled: !canUpload,
	})

	const handleThumbDragStart = useCallback((event: React.DragEvent, photoId: string) => {
		event.dataTransfer.effectAllowed = 'move'
		event.dataTransfer.setData(PHOTO_DRAG_TYPE, photoId)
		setDraggingId(photoId)
	}, [])

	const handleThumbDragOver = useCallback(
		(event: React.DragEvent, photoId: string) => {
			if (!draggingId || draggingId === photoId) return
			event.preventDefault()
			event.dataTransfer.dropEffect = 'move'
			setDropTargetId(photoId)
		},
		[draggingId],
	)

	const handleThumbDrop = useCallback(
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

	const handleThumbDragEnd = useCallback(() => {
		setDraggingId(null)
		setDropTargetId(null)
	}, [])

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
			{...dropHandlers}
			data-testid="photo-grid"
			className={cn(
				'grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-card bg-white p-6 transition-colors',
				isDragOver && canUpload && 'outline-2 outline-dashed outline-primary bg-primary-light',
				className,
			)}
		>
			{photos.map((photo) => (
				<div
					key={photo.id}
					data-photo-id={photo.id}
					draggable={canReorder}
					onDragStart={canReorder ? (e) => handleThumbDragStart(e, photo.id) : undefined}
					onDragOver={canReorder ? (e) => handleThumbDragOver(e, photo.id) : undefined}
					onDrop={canReorder ? (e) => handleThumbDrop(e, photo.id) : undefined}
					onDragEnd={canReorder ? handleThumbDragEnd : undefined}
					className={cn(
						'group relative cursor-pointer overflow-hidden rounded-xl transition-opacity',
						draggingId === photo.id && 'opacity-40',
						dropTargetId === photo.id && 'outline-2 outline-primary',
					)}
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
						draggable={false}
					/>

					{canReorder && (
						<div
							className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-md bg-black/70 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
							title={t('gallery.reorderPhotoHint')}
						>
							<GripVertical className="h-5 w-5 text-white" />
						</div>
					)}

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
						{onDelete && !locked && (
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

			{onAdd && !locked && (
				<button
					type="button"
					onClick={onAdd}
					disabled={isMaxReached}
					title={isMaxReached ? t('gallery.maxPhotosHint', { limit: maxPhotos }) : undefined}
					className="flex aspect-4/3 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-card text-grey-100 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border-card disabled:hover:text-grey-100"
				>
					<Plus className="h-8 w-8" />
					<span className="text-body-sm font-medium">
						{isDragOver && canUpload ? t('gallery.dropToUpload') : t('gallery.addMorePhotos')}
					</span>
				</button>
			)}
		</div>
	)
}

export type { PhotoGridProps }
export { PHOTO_DRAG_TYPE, PhotoGrid }
