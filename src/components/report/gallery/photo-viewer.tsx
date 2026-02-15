'use client'

import { Edit2, Pencil, Trash2, ImageOff, Sparkles } from 'lucide-react'
import { PhotoCard } from '@/components/ui/photo-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
	onEdit,
	onDelete,
	onAnnotate,
	className,
}: PhotoViewerProps) {
	if (!photo) {
		return (
			<div
				className={cn(
					'flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-grey-50 bg-grey-25 py-16 text-center',
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
		<div className={cn('flex flex-col gap-4', className)}>
			{/* Large photo display */}
			<PhotoCard
				src={photo.previewUrl ?? photo.url}
				alt={photo.filename}
				variant="viewer"
				watermark
			/>

			{/* Photo info */}
			<div className="flex items-center gap-2">
				<p className="truncate text-body-sm font-semibold text-black">
					{photo.filename}
				</p>
				{photo.type && (
					<Badge variant="outline">{photo.type}</Badge>
				)}
			</div>

			{/* Action bar */}
			<div className="flex items-center gap-2">
				{onEdit && (
					<Button
						variant="outline"
						size="sm"
						icon={<Edit2 className="h-4 w-4" />}
						onClick={onEdit}
					>
						Edit
					</Button>
				)}
				{onAnnotate && (
					<Button
						variant="outline"
						size="sm"
						icon={<Pencil className="h-4 w-4" />}
						onClick={onAnnotate}
					>
						Annotate
					</Button>
				)}
				{onDelete && (
					<Button
						variant="danger"
						size="sm"
						icon={<Trash2 className="h-4 w-4" />}
						onClick={onDelete}
					>
						Delete
					</Button>
				)}
			</div>

			{/* AI description */}
			{photo.aiDescription && (
				<div className="flex flex-col gap-1 rounded-lg border border-border bg-grey-25 p-4">
					<div className="flex items-center gap-1">
						<Sparkles className="h-4 w-4 text-primary" />
						<span className="text-caption font-semibold text-grey-100">
							AI Description
						</span>
					</div>
					<p className="text-body-sm text-black">
						{photo.aiDescription}
					</p>
				</div>
			)}
		</div>
	)
}

export { PhotoViewer }
export type { PhotoViewerProps }
