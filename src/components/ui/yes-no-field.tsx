import { cn } from '@/lib/utils'
import { Label } from './label'
import { MISSING_GROUP_CLASS } from './missing'

type YesNoFieldProps = {
	label: string
	/** `null` while the question is unanswered — the state a new report starts in. */
	value: boolean | null
	onChange: (value: boolean) => void
	yesLabel: string
	noLabel: string
	className?: string
	/** Required but nothing chosen yet. */
	isMissing?: boolean
	/** Screen-reader text for the missing state. */
	missingLabel?: string
}

/**
 * A yes/no finding, the way a Gutachten records one — *Airbags ausgelöst: ja /
 * nein*. Distinct from a checkbox because the answer has three states: yes, no,
 * and not yet answered. A checkbox has two, and offers no gesture that says "no"
 * rather than "untouched".
 */
function YesNoField({
	label,
	value,
	onChange,
	yesLabel,
	noLabel,
	className,
	isMissing,
	missingLabel,
}: YesNoFieldProps) {
	const options: { answer: boolean; text: string }[] = [
		{ answer: true, text: yesLabel },
		{ answer: false, text: noLabel },
	]

	return (
		<div className={cn('flex flex-col gap-1', className)}>
			<Label>{label}</Label>
			<div
				className={cn(
					'flex items-center gap-2',
					isMissing && cn('rounded-full', MISSING_GROUP_CLASS),
				)}
				role="radiogroup"
				aria-label={label}
				data-missing={isMissing ? 'true' : undefined}
			>
				{isMissing && missingLabel && <span className="sr-only">{missingLabel}</span>}
				{options.map((option) => {
					const isSelected = value === option.answer
					return (
						<button
							key={option.text}
							type="button"
							role="radio"
							aria-checked={isSelected}
							onClick={() => onChange(option.answer)}
							className={cn(
								'inline-flex cursor-pointer items-center rounded-full border px-5 py-2 text-body-sm font-medium transition-colors',
								isSelected
									? 'border-primary bg-primary-light text-primary'
									: 'border-border bg-white text-grey-100 hover:bg-grey-25',
							)}
						>
							{option.text}
						</button>
					)
				})}
			</div>
		</div>
	)
}

export type { YesNoFieldProps }
export { YesNoField }
