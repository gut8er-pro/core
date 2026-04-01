'use client'

import { useCallback } from 'react'
import { Plus } from 'lucide-react'
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
				'flex gap-3.5 overflow-x-auto scroll-smooth',
				className,
			)}
			role="listbox"
			aria-label="Photo filmstrip"
		>
			{photos.map((photo) => {
				const isSelected = selectedId === photo.id
				return (
					<button
						key={photo.id}
						type="button"
						role="option"
						aria-selected={isSelected}
						onClick={() => handleSelect(photo.id)}
						className={cn(
							'relative h-[60px] w-[60px] shrink-0 cursor-pointer overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
							isSelected && 'border-2 border-primary',
						)}
					>
						<img
							src={photo.thumbnailUrl ?? photo.url}
							alt={photo.filename}
							className="h-full w-full object-cover"
							loading="lazy"
						/>
					</button>
				)
			})}

			{/* Add photo button */}
			{onAdd && (
				<button
					type="button"
					onClick={onAdd}
					className="flex h-[60px] w-[60px] shrink-0 cursor-pointer items-center justify-center rounded-xl bg-border-card transition-colors hover:bg-grey-50"
					aria-label="Add more photos"
				>
					<Plus className="h-6 w-6 text-grey-100" />
				</button>
			)}
		</div>
	)
}

export { Filmstrip }
export type { FilmstripProps }
