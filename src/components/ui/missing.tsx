import { cn } from '@/lib/utils'

/**
 * The amber "required but not filled in yet" affordance, shared by every
 * control that can carry it. Deliberately distinct from the red error state:
 * an empty required field holds no wrong value.
 */
const MISSING_FIELD_CLASS = 'border-warning-border bg-warning/10 focus:border-warning-border'

/** For controls drawn as a group of buttons, which have no border to tint. */
const MISSING_GROUP_CLASS = 'ring-2 ring-warning-border ring-offset-2'

type MissingBadgeProps = {
	/** Required fields still empty. Nothing renders below 1. */
	count: number
	/** Screen-reader text appended to the number, e.g. "fields missing". */
	label?: string
	className?: string
}

/** Amber count of what a section still needs — never the red of a wrong value. */
function MissingBadge({ count, label, className }: MissingBadgeProps) {
	if (count <= 0) return null

	return (
		<span
			data-missing-count={count}
			className={cn(
				'inline-flex min-w-6 items-center justify-center rounded-full bg-warning/15 px-2 py-0.5 text-caption font-semibold text-warning-dark',
				className,
			)}
		>
			{count}
			{label && <span className="sr-only"> {label}</span>}
		</span>
	)
}

export type { MissingBadgeProps }
export { MISSING_FIELD_CLASS, MISSING_GROUP_CLASS, MissingBadge }
