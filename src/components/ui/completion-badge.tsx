import { cn } from '@/lib/utils'

type CompletionBadgeProps = {
	percentage: number
	label?: string
	className?: string
}

function CompletionBadge({ percentage, label, className }: CompletionBadgeProps) {
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 text-body-sm font-medium text-grey-100',
				className,
			)}
		>
			{percentage}% {label || 'Complete'}
		</span>
	)
}

export { CompletionBadge }
export type { CompletionBadgeProps }
