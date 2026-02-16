import { cn } from '@/lib/utils'
import type { PhotoClassificationType } from '@/lib/ai/types'

type ClassificationBadgeProps = {
	classification: PhotoClassificationType
	className?: string
}

const BADGE_CONFIG: Record<PhotoClassificationType, { label: string; color: string }> = {
	damage: { label: 'Damage', color: 'bg-error text-white' },
	vin: { label: 'VIN', color: 'bg-info text-white' },
	plate: { label: 'Plate', color: 'bg-info text-white' },
	document: { label: 'Document', color: 'bg-purple-500 text-white' },
	overview: { label: 'Overview', color: 'bg-primary text-white' },
	tire: { label: 'Tire', color: 'bg-orange-500 text-white' },
	interior: { label: 'Interior', color: 'bg-grey-100 text-white' },
	other: { label: 'Other', color: 'bg-grey-50 text-grey-100' },
}

function ClassificationBadge({ classification, className }: ClassificationBadgeProps) {
	const config = BADGE_CONFIG[classification]

	return (
		<span
			className={cn(
				'inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase leading-tight',
				config.color,
				className,
			)}
		>
			{config.label}
		</span>
	)
}

export { ClassificationBadge }
export type { ClassificationBadgeProps }
