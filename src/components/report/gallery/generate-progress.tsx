import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GenerationStatus } from '@/hooks/use-generate-report'

type GenerateProgressProps = {
	status: GenerationStatus
	onCancel: () => void
	className?: string
}

const STEP_LABELS: Record<string, string> = {
	classify: 'Classifying photos',
	process: 'Analyzing photos',
	lookup: 'Looking up vehicle data',
	autofill: 'Auto-filling report',
}

function GenerateProgress({ status, onCancel, className }: GenerateProgressProps) {
	if (!status.isGenerating) return null

	const stepLabel = STEP_LABELS[status.step] || status.step
	const progress = status.total > 0 ? Math.round((status.current / status.total) * 100) : 0

	return (
		<div className={cn('rounded-lg border border-primary/20 bg-primary/5 p-4', className)}>
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-3 min-w-0">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
						<Sparkles className="h-4 w-4 animate-pulse text-primary" />
					</div>
					<div className="flex flex-col gap-0.5 min-w-0">
						<span className="text-body-sm font-semibold text-black">{stepLabel}</span>
						<span className="truncate text-caption text-grey-100">{status.message}</span>
					</div>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={onCancel}
					aria-label="Cancel generation"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{/* Progress bar */}
			<div className="mt-3 h-1.5 overflow-hidden rounded-full bg-grey-25">
				<div
					className="h-full rounded-full bg-primary transition-all duration-300"
					style={{ width: `${progress}%` }}
				/>
			</div>

			{status.total > 0 && (
				<div className="mt-1.5 text-right text-caption text-grey-100">
					{status.current}/{status.total}
				</div>
			)}
		</div>
	)
}

export { GenerateProgress }
export type { GenerateProgressProps }
