import { useTranslations } from 'next-intl'
import type { PhotoClassificationType } from '@/lib/ai/types'
import { cn } from '@/lib/utils'

type ClassificationBadgeProps = {
	classification: PhotoClassificationType
	className?: string
}

const BADGE_COLORS: Record<PhotoClassificationType, string> = {
	damage: 'bg-error text-white',
	vin: 'bg-info text-white',
	plate: 'bg-info text-white',
	document: 'bg-purple-500 text-white',
	overview: 'bg-primary text-white',
	tire: 'bg-orange-500 text-white',
	interior: 'bg-grey-100 text-white',
	other: 'bg-grey-50 text-grey-100',
}

function ClassificationBadge({ classification, className }: ClassificationBadgeProps) {
	const t = useTranslations('report.gallery.classification')

	return (
		<span
			className={cn(
				'inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase leading-tight',
				BADGE_COLORS[classification],
				className,
			)}
		>
			{t(classification)}
		</span>
	)
}

export type { ClassificationBadgeProps }
export { ClassificationBadge }
