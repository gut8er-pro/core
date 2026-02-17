'use client'

import { useCallback } from 'react'
import { Plus } from 'lucide-react'
import { PhotoCard } from '@/components/ui/photo-card'
import { cn } from '@/lib/utils'
import type { Photo } from '@/hooks/use-photos'

type FilmstripProps = {
	photos: Photo[]
	selectedId?: string
	onSelect?: (photoId: string) => void
	onAdd?: () => void
	className?: string
}

function Filmstrip({
	photos,
	selectedId,
	onSelect,
	onAdd,
	className,
}: FilmstripProps) {
	const handleSelect = useCallback(
		(photoId: string) => {
			onSelect?.(photoId)
		},
		[onSelect],
	)

	if (photos.length === 0) {
		return null
	}

	return (
		<div
			className={cn(
				'flex gap-2 overflow-x-auto scroll-smooth pb-2',
				className,
			)}
			role="listbox"
			aria-label="Photo filmstrip"
		>
			{photos.map((photo) => (
				<button
					key={photo.id}
					type="button"
					role="option"
					aria-selected={selectedId === photo.id}
					onClick={() => handleSelect(photo.id)}
					className="relative shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
				>
					<PhotoCard
						src={photo.thumbnailUrl ?? photo.url}
						alt={photo.filename}
						variant="thumbnail"
						selected={selectedId === photo.id}
					/>
				</button>
			))}

			{/* Add photo button */}
			{onAdd && (
				<button
					type="button"
					onClick={onAdd}
					className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-grey-50 bg-grey-25 transition-colors hover:border-primary hover:bg-primary/5"
					aria-label="Add more photos"
				>
					<Plus className="h-5 w-5 text-grey-100" />
				</button>
			)}
		</div>
	)
}

export { Filmstrip }
export type { FilmstripProps }
