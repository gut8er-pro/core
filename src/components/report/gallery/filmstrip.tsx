'use client'

import { useCallback } from 'react'
import { PhotoCard } from '@/components/ui/photo-card'
import { cn } from '@/lib/utils'
import type { Photo } from '@/hooks/use-photos'

type FilmstripProps = {
	photos: Photo[]
	selectedId?: string
	onSelect?: (photoId: string) => void
	className?: string
}

function Filmstrip({
	photos,
	selectedId,
	onSelect,
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
					className="relative shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
				>
					<PhotoCard
						src={photo.thumbnailUrl ?? photo.url}
						alt={photo.filename}
						variant="thumbnail"
						selected={selectedId === photo.id}
					/>
					<span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-sm bg-black/60 text-[10px] font-semibold text-white">
						{photo.order}
					</span>
				</button>
			))}
		</div>
	)
}

export { Filmstrip }
export type { FilmstripProps }
