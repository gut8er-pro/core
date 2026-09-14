import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MISSING_GROUP_CLASS } from './missing'

type IconOption = {
	value: string
	icon: LucideIcon
	label?: string
}

type IconSelectorProps = {
	options: IconOption[]
	selected: string
	onChange: (value: string) => void
	className?: string
	/** Keep each option's label for screen readers only, leaving a bare icon row. */
	hideLabels?: boolean
	/** Required but nothing chosen yet. */
	isMissing?: boolean
	/** Screen-reader text for the missing state. */
	missingLabel?: string
}

function IconSelector({
	options,
	selected,
	onChange,
	className,
	hideLabels,
	isMissing,
	missingLabel,
}: IconSelectorProps) {
	return (
		<div
			className={cn(
				'flex items-center gap-2 flex-wrap',
				isMissing && cn('rounded-lg', MISSING_GROUP_CLASS),
				className,
			)}
			role="radiogroup"
			data-missing={isMissing ? 'true' : undefined}
		>
			{isMissing && missingLabel && <span className="sr-only">{missingLabel}</span>}
			{options.map((option) => {
				const Icon = option.icon
				const isSelected = option.value === selected
				return (
					<button
						key={option.value}
						type="button"
						role="radio"
						aria-checked={isSelected}
						aria-label={option.label || option.value}
						onClick={() => onChange(option.value)}
						className={cn(
							'flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 transition-colors',
							isSelected
								? 'border-primary bg-primary-light text-primary'
								: 'border-border bg-white text-grey-100 hover:border-grey-50 hover:bg-grey-25',
						)}
					>
						<Icon className="h-6 w-6" />
						{option.label && !hideLabels && (
							<span className="text-caption font-medium">{option.label}</span>
						)}
					</button>
				)
			})}
		</div>
	)
}

export type { IconOption, IconSelectorProps }
export { IconSelector }
