'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useMissingProps, useSectionBadge } from '@/components/report/missing-info'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { MISSING_GROUP_CLASS } from '@/components/ui/missing'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { SECTION } from '@/lib/completeness'
import { cn } from '@/lib/utils'
import type { GradingField, OldtimerDetailsData } from './types'
import { GRADING_CATEGORIES, gradingKey } from './types'

const SCORE_OPTIONS = ['Non', '1', '2', '3', '4', '5'] as const

/** Shown on a category that has not been graded — never a number. */
const UNGRADED = '–'

type VehicleGradingSectionProps = {
	values: OldtimerDetailsData
	onChange: <K extends keyof OldtimerDetailsData>(field: K, value: OldtimerDetailsData[K]) => void
	className?: string
}

/**
 * The Oldtimer grading table.
 *
 * Every category starts ungraded. A pre-filled 5 would ship an OT report
 * asserting a perfect grade no assessor ever entered, and would look complete to
 * the manifest while saying nothing.
 */
function VehicleGradingSection({ values, onChange, className }: VehicleGradingSectionProps) {
	const t = useTranslations('report.condition')
	const missing = useMissingProps()
	const badge = useSectionBadge(SECTION.vehicleGrading)

	const categories = GRADING_CATEGORIES.map((key) => ({
		key,
		field: gradingKey(key),
		label: t(`vehicleGrading.${key}` as `vehicleGrading.${typeof key}`),
	}))

	const [activeTab, setActiveTab] = useState<'grading' | 'paint'>('grading')
	const [editingCategory, setEditingCategory] = useState<string | null>(null)

	function selectScore(field: GradingField, value: string, modifier?: string) {
		onChange(field, value === 'Non' ? 'Non' : `${value}${modifier ?? ''}`)
		setEditingCategory(null)
	}

	const overall = values.gradingOverall
	const overallMissing = missing('gradingOverall')

	return (
		<CollapsibleSection title={t('vehicleGrading.title')} info className={className} {...badge}>
			<div className="flex flex-col gap-6">
				{/* Grading / Paint toggle */}
				<div className="flex rounded-full bg-grey-25 p-1">
					<button
						type="button"
						onClick={() => setActiveTab('grading')}
						className={cn(
							'flex-1 rounded-full px-6 py-2.5 text-body-sm font-medium transition-colors',
							activeTab === 'grading' ? 'bg-black text-white' : 'text-grey-100 hover:text-black',
						)}
					>
						{t('vehicleGrading.grading')}
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('paint')}
						className={cn(
							'flex-1 rounded-full px-6 py-2.5 text-body-sm font-medium transition-colors',
							activeTab === 'paint' ? 'bg-black text-white' : 'text-grey-100 hover:text-black',
						)}
					>
						{t('vehicleGrading.paint')}
					</button>
				</div>

				{activeTab === 'grading' && (
					<>
						{/* Overall Condition */}
						<div className="flex items-center justify-between">
							<span className="text-body font-medium text-black">
								{t('vehicleGrading.overallCondition')}
							</span>
							{overallMissing.isMissing && (
								<span className="sr-only">{overallMissing.missingLabel}</span>
							)}
							<button
								type="button"
								onClick={() => setEditingCategory('overall')}
								aria-label={t('vehicleGrading.overallConditionTitle')}
								className={cn(
									'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-body-sm font-semibold',
									overall ? 'bg-primary text-white' : 'bg-grey-25 text-grey-100',
									overallMissing.isMissing && MISSING_GROUP_CLASS,
								)}
							>
								{overall || UNGRADED}
							</button>
						</div>

						{/* Score popup for overall */}
						{editingCategory === 'overall' && (
							<ScorePopup
								title={t('vehicleGrading.overallConditionTitle')}
								hint={t('vehicleGrading.scorePopupHint')}
								onSelect={(value) => selectScore('gradingOverall', value)}
							/>
						)}

						{/* Category grid */}
						<div className="grid grid-cols-2 gap-y-4 gap-x-8">
							{categories.map((category) => {
								const score = values[category.field]
								const categoryMissing = missing(category.field)
								return (
									<div key={category.key} className="flex items-center justify-between">
										<span className="text-body-sm text-black">{category.label}</span>
										{categoryMissing.isMissing && (
											<span className="sr-only">{categoryMissing.missingLabel}</span>
										)}
										<button
											type="button"
											onClick={() => setEditingCategory(category.key)}
											aria-label={category.label}
											className={cn(
												'flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full px-2 text-body-sm font-semibold',
												score ? 'bg-primary/10 text-primary' : 'bg-grey-25 text-grey-100',
												categoryMissing.isMissing && MISSING_GROUP_CLASS,
											)}
										>
											{score || UNGRADED}
										</button>
									</div>
								)
							})}
						</div>

						{/* Score popup for categories */}
						{editingCategory !== null && editingCategory !== 'overall' && (
							<ScorePopup
								title={categories.find((c) => c.key === editingCategory)?.label ?? ''}
								hint={t('vehicleGrading.scorePopupHint')}
								onSelect={(value, modifier) => {
									const category = categories.find((c) => c.key === editingCategory)
									if (category) selectScore(category.field, value, modifier)
								}}
								showModifiers
							/>
						)}

						{/* Auto-calculate toggle */}
						<div className="flex items-center justify-between">
							<span className="text-body-sm text-black">
								{t('vehicleGrading.autoCalculateGrade')}
							</span>
							<ToggleSwitch
								label=""
								checked={values.autoCalculateGrade}
								onCheckedChange={(checked) => onChange('autoCalculateGrade', checked)}
							/>
						</div>
					</>
				)}

				{activeTab === 'paint' && (
					<p className="text-body-sm text-grey-100">{t('vehicleGrading.paintGradingNote')}</p>
				)}
			</div>
		</CollapsibleSection>
	)
}

function ScorePopup({
	title,
	hint,
	onSelect,
	showModifiers = false,
}: {
	title: string
	hint: string
	onSelect: (value: string, modifier?: string) => void
	showModifiers?: boolean
}) {
	return (
		<div className="rounded-xl border border-border bg-white p-4 shadow-dropdown">
			<p className="mb-1 text-body-sm font-medium text-black">{title}</p>
			<p className="mb-3 text-caption text-grey-100">{hint}</p>
			{showModifiers && (
				<div className="mb-1 flex gap-1 pl-14">
					{['', '+', '+', '+', '+'].map((_m, i) =>
						i === 0 ? (
							<div key="spacer" className="w-10" />
						) : (
							<button
								key={`plus-${i}`}
								type="button"
								onClick={() => onSelect(String(i + 1), '+')}
								className="flex w-10 cursor-pointer items-center justify-center text-caption text-grey-100 hover:text-black"
							>
								+
							</button>
						),
					)}
				</div>
			)}
			<div className="flex gap-1">
				{SCORE_OPTIONS.map((value) => (
					<button
						key={value}
						type="button"
						onClick={() => onSelect(value)}
						className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border text-body-sm font-medium text-black transition-colors hover:bg-grey-25"
					>
						{value}
					</button>
				))}
			</div>
			{showModifiers && (
				<div className="mt-1 flex gap-1 pl-14">
					{['', '-', '-', '-', '-'].map((_m, i) =>
						i === 0 ? (
							<div key="spacer2" className="w-10" />
						) : (
							<button
								key={`minus-${i}`}
								type="button"
								onClick={() => onSelect(String(i + 1), '-')}
								className="flex w-10 cursor-pointer items-center justify-center text-caption text-grey-100 hover:text-black"
							>
								-
							</button>
						),
					)}
				</div>
			)}
		</div>
	)
}

export { VehicleGradingSection }
