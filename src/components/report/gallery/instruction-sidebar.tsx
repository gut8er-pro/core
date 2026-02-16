import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClassificationResult } from '@/lib/ai/types'

type InstructionSidebarProps = {
	className?: string
	classifications?: Map<string, ClassificationResult>
}

const INSTRUCTIONS = [
	'Good lighting or use of flash',
	'JPG or PNG format',
	'Maximum 20 images',
] as const

type SuggestedCategory = {
	label: string
	description: string
	matchTypes: string[]
}

const SUGGESTED_CATEGORIES: SuggestedCategory[] = [
	{
		label: 'Vehicle Diagonals',
		description: 'Front and rear diagonal photos of the vehicle',
		matchTypes: ['overview'],
	},
	{
		label: 'Damage Overview',
		description: 'Detailed close-ups of all damaged areas',
		matchTypes: ['damage'],
	},
	{
		label: 'Document Shot',
		description: 'Photos of all relevant vehicle documents',
		matchTypes: ['document', 'vin', 'plate'],
	},
]

function InstructionSidebar({ className, classifications }: InstructionSidebarProps) {
	const hasClassifications = classifications && classifications.size > 0

	return (
		<div className={cn('flex flex-col gap-4', className)}>
			{/* Instruction Card */}
			<div className="flex flex-col gap-3 rounded-2xl bg-white p-5">
				<h3 className="text-h3 font-medium text-black">Instruction</h3>
				<ul className="flex flex-col gap-2.5">
					{INSTRUCTIONS.map((text) => (
						<li key={text} className="flex items-start gap-2.5">
							<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
							<span className="text-body text-black">{text}</span>
						</li>
					))}
				</ul>
			</div>

			{/* Suggested Photos Card */}
			<div className="flex flex-col gap-3 rounded-2xl bg-white p-5">
				<h3 className="text-h3 font-medium text-black">Suggested Photos</h3>
				<div className="flex flex-col gap-3">
					{SUGGESTED_CATEGORIES.map((category) => {
						const count = hasClassifications
							? countMatches(classifications, category.matchTypes)
							: 0
						const isFulfilled = count > 0

						return (
							<div
								key={category.label}
								className="flex items-center gap-3 rounded-2xl border-2 border-[#ededed] p-3.5"
							>
								{/* Thumbnail placeholder */}
								<div
									className={cn(
										'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
										isFulfilled ? 'bg-primary-light' : 'bg-grey-25',
									)}
								>
									{isFulfilled && (
										<CheckCircle2 className="h-5 w-5 text-primary" />
									)}
								</div>
								<div className="flex flex-col gap-0.5 min-w-0">
									<span className="text-body-sm font-semibold text-black">
										{category.label}
									</span>
									<span className="text-caption text-grey-100">
										{category.description}
									</span>
									{hasClassifications && count > 0 && (
										<span className="text-caption font-semibold text-primary">
											{count} photo{count !== 1 ? 's' : ''}
										</span>
									)}
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}

function countMatches(
	classifications: Map<string, ClassificationResult>,
	matchTypes: string[],
): number {
	let count = 0
	for (const c of classifications.values()) {
		if (matchTypes.includes(c.type)) count++
	}
	return count
}

export { InstructionSidebar }
export type { InstructionSidebarProps }
