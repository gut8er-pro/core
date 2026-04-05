import { Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ClassificationResult } from '@/lib/ai/types'
import { cn } from '@/lib/utils'

type GenerationSummaryData = {
	totalFieldsFilled: number
	damageMarkersPlaced: number
	photosProcessed: number
	classifications: Record<string, number>
	warnings: string[]
	generatedAt?: string
}

type InstructionSidebarProps = {
	className?: string
	classifications?: Map<string, ClassificationResult>
	generationSummary?: GenerationSummaryData
}

type SuggestedCategory = {
	labelKey: string
	descriptionKey: string
	matchTypes: string[]
	image: string
}

const INSTRUCTION_KEYS = [
	'gallery.goodLighting',
	'gallery.fileFormat',
	'gallery.maxImages',
] as const

const SUGGESTED_CATEGORIES: SuggestedCategory[] = [
	{
		labelKey: 'gallery.vehicleDiagonals',
		descriptionKey: 'gallery.vehicleDiagonalsDesc',
		matchTypes: ['overview'],
		image: '/images/suggested/vehicle-diagonals.webp',
	},
	{
		labelKey: 'gallery.damageOverview',
		descriptionKey: 'gallery.damageOverviewDesc',
		matchTypes: ['damage'],
		image: '/images/suggested/damage-overview.webp',
	},
	{
		labelKey: 'gallery.documentShot',
		descriptionKey: 'gallery.documentShotDesc',
		matchTypes: ['document', 'vin', 'plate'],
		image: '/images/suggested/document-shot.webp',
	},
]

/** Filled green circle with white checkmark — matches Figma "lets-icons:check-fill" */
function GreenCheckIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 17 17" fill="none" className={className} aria-hidden="true">
			<circle cx="8.5" cy="8.5" r="8.5" fill="#019447" />
			<path
				d="M5 8.5L7.5 11L12 6.5"
				stroke="white"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

function InstructionSidebar({
	className,
	classifications,
	generationSummary,
}: InstructionSidebarProps) {
	const t = useTranslations('report')
	const hasClassifications = classifications && classifications.size > 0

	function getCategoryCount(category: SuggestedCategory): number {
		if (hasClassifications) {
			return countMatches(classifications, category.matchTypes)
		}
		if (generationSummary?.classifications) {
			let total = 0
			for (const matchType of category.matchTypes) {
				total += generationSummary.classifications[matchType] ?? 0
			}
			return total
		}
		return 0
	}

	return (
		<div className={cn('flex flex-col', className)}>
			{/* Instruction Card */}
			<div className="mb-6 flex flex-col gap-2.5 rounded-card bg-white p-5">
				<h3 className="text-subsection font-medium leading-6 text-black">
					{t('gallery.instruction')}
				</h3>
				<div className="flex flex-col gap-2.5">
					{INSTRUCTION_KEYS.map((key) => (
						<div key={key} className="flex items-center gap-2.5">
							<GreenCheckIcon className="h-4.5 w-4.5 shrink-0" />
							<span className="text-body tracking-[0.16px] text-black">{t(key)}</span>
						</div>
					))}
				</div>
			</div>

			{/* Suggested Photos Card */}
			<div className="flex flex-col gap-2.5 rounded-card bg-white p-5">
				<h3 className="text-subsection font-medium leading-6 text-black">
					{t('gallery.suggestedPhotos')}
				</h3>
				<div className="flex flex-col gap-2.5">
					{SUGGESTED_CATEGORIES.map((category) => {
						const count = getCategoryCount(category)
						const isFulfilled = count > 0

						return (
							<div
								key={category.labelKey}
								className="flex h-22 items-center gap-2.5 rounded-btn border-2 border-border-card p-3.5"
							>
								{/* Thumbnail — 60px rounded */}
								<div className="relative h-15 w-15 shrink-0 overflow-hidden rounded-btn">
									<img
										src={category.image}
										alt={t(category.labelKey)}
										className="h-full w-full object-cover"
										loading="lazy"
									/>
									{isFulfilled && (
										<div className="absolute inset-0 flex items-center justify-center bg-black/30">
											<GreenCheckIcon className="h-5 w-5" />
										</div>
									)}
								</div>
								<div className="flex min-w-0 flex-1 flex-col gap-1">
									<span className="text-body-sm font-medium tracking-[0.16px] text-black">
										{t(category.labelKey)}
									</span>
									<span className="text-caption tracking-[0.14px] text-black leading-[1.2]">
										{t(category.descriptionKey)}
									</span>
									{count > 0 && (
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

			{/* AI Generation Summary Card */}
			{generationSummary && (
				<div className="flex flex-col gap-3 rounded-card bg-white p-5">
					<div className="flex items-center gap-2">
						<Sparkles className="h-4 w-4 text-primary" />
						<h3 className="text-subsection font-medium text-black">{t('gallery.aiAnalysis')}</h3>
					</div>
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<span className="text-caption text-grey-100">{t('gallery.photosProcessed')}</span>
							<span className="text-body-sm font-semibold text-black">
								{generationSummary.photosProcessed}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-caption text-grey-100">{t('gallery.fieldsAutoFilled')}</span>
							<span className="text-body-sm font-semibold text-primary">
								{generationSummary.totalFieldsFilled}
							</span>
						</div>
						{generationSummary.damageMarkersPlaced > 0 && (
							<div className="flex items-center justify-between">
								<span className="text-caption text-grey-100">{t('gallery.damageMarkers')}</span>
								<span className="text-body-sm font-semibold text-black">
									{generationSummary.damageMarkersPlaced}
								</span>
							</div>
						)}
					</div>
				</div>
			)}
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

export type { InstructionSidebarProps }
export { InstructionSidebar }
