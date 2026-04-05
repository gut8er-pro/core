'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type CompletionBadgeProps = {
	percentage: number
	label?: string
	className?: string
}

function CompletionBadge({ percentage, label, className }: CompletionBadgeProps) {
	const t = useTranslations('common')
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 text-body-sm font-medium text-grey-100',
				className,
			)}
		>
			{percentage}% {label || t('complete')}
		</span>
	)
}

export type { CompletionBadgeProps }
export { CompletionBadge }
