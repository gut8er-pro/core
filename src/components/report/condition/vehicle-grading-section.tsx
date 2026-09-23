'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { useMissingProps, useSectionBadge } from '@/components/report/missing-info'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { MISSING_GROUP_CLASS } from '@/components/ui/missing'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { SECTION } from '@/lib/completeness'
import { cn } from '@/lib/utils'
import { computeOverallGrade, SCORE_OPTIONS, UNGRADED } from './grading-scale'
import type { GradingField, OldtimerDetailsData } from './types'
import { GRADED_CATEGORIES, gradingKey } from './types'

type VehicleGradingSectionProps = {
	values: OldtimerDetailsData
	onChange: <K extends keyof OldtimerDetailsData>(field: K, value: OldtimerDetailsData[K]) => void
	disabled?: boolean
	className?: string
}

/**
 * The Oldtimer grading table.
 *
 * Every category starts ungraded. A pre-filled 5 would ship an OT report
 * asserting a perfect grade no assessor ever entered, and would look complete to
 * the manifest while saying nothing.
 */
function VehicleGradingSection({
	values,
	onChange,
	disabled,
	className,
}: VehicleGradingSectionProps) {
	const t = useTranslations('report.condition')
	const missing = useMissingProps()
	const badge = useSectionBadge(SECTION.vehicleGrading)

	const categories = GRADED_CATEGORIES.map((key) => ({
		key,
		field: gradingKey(key),
		label: t(`vehicleGrading.${key}` as `vehicleGrading.${typeof key}`),
	}))

	const [editingCategory, setEditingCategory] = useState<string | null>(null)

	const autoCalculate = values.autoCalculateGrade
	const computedOverall = computeOverallGrade(values)
	const overall = autoCalculate ? (computedOverall ?? '') : values.gradingOverall
	const overallMissing = missing('gradingOverall')

	// Auto-calculation is a promise about the stored grade, not a display trick:
	// the PDF and the completeness gate read the column, so the column is what
	// has to follow the categories.
	useEffect(() => {
		if (!autoCalculate || disabled) return
		if (!computedOverall || computedOverall === values.gradingOverall) return
		onChange('gradingOverall', computedOverall)
	}, [autoCalculate, disabled, computedOverall, values.gradingOverall, onChange])

	function selectScore(field: GradingField, value: string, modifier?: string) {
		onChange(field, value === 'Non' ? 'Non' : `${value}${modifier ?? ''}`)
		setEditingCategory(null)
	}

	const editing = categories.find((category) => category.key === editingCategory)

	return (
		<CollapsibleSection
			title={t('vehicleGrading.title')}
			info
			defaultOpen
			className={className}
			{...badge}
		>
			<div className="flex flex-col gap-6">
				<div className="grid grid-cols-2 gap-y-4 gap-x-8">
					{categories.map((category) => {
						const score = values[category.field]
						const categoryMissing = missing(category.field)
						return (
							<div key={category.key} className="flex flex-col gap-2">
								<div className="flex items-center justify-between">
									<span className="text-body-sm text-black">{category.label}</span>
									{categoryMissing.isMissing && (
										<span className="sr-only">{categoryMissing.missingLabel}</span>
									)}
									<button
										type="button"
										disabled={disabled}
										onClick={() => setEditingCategory(category.key)}
										aria-label={category.label}
										className={cn(
											'flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full px-2 text-body-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50',
											score ? 'bg-primary/10 text-primary' : 'bg-grey-25 text-grey-100',
											categoryMissing.isMissing && MISSING_GROUP_CLASS,
										)}
									>
										{score || UNGRADED}
									</button>
								</div>

								{editing?.key === category.key && (
									<ScorePopup
										title={category.label}
										hint={t('vehicleGrading.scorePopupHint')}
										onDismiss={() => setEditingCategory(null)}
										onSelect={(value, modifier) => selectScore(category.field, value, modifier)}
										showModifiers
									/>
								)}
							</div>
						)
					})}
				</div>

				<div className="flex flex-col gap-3 rounded-xl bg-surface-secondary p-5">
					<div className="flex items-center justify-between">
						<span className="text-subsection font-semibold text-black">
							{t('vehicleGrading.overallCondition')}
						</span>
						{overallMissing.isMissing && (
							<span className="sr-only">{overallMissing.missingLabel}</span>
						)}
						<button
							type="button"
							disabled={disabled || autoCalculate}
							onClick={() => setEditingCategory('overall')}
							aria-label={t('vehicleGrading.overallConditionTitle')}
							className={cn(
								'flex h-14 w-14 cursor-pointer items-center justify-center rounded-full text-h2 font-bold disabled:cursor-not-allowed',
								overall ? 'bg-primary text-white' : 'bg-grey-25 text-grey-100',
								overallMissing.isMissing && MISSING_GROUP_CLASS,
							)}
						>
							{overall || UNGRADED}
						</button>
					</div>

					{editingCategory === 'overall' && !autoCalculate && (
						<ScorePopup
							title={t('vehicleGrading.overallConditionTitle')}
							hint={t('vehicleGrading.scorePopupHint')}
							onDismiss={() => setEditingCategory(null)}
							onSelect={(value, modifier) => selectScore('gradingOverall', value, modifier)}
							showModifiers
						/>
					)}

					<ToggleSwitch
						label={t('vehicleGrading.autoCalculateGrade')}
						disabled={disabled}
						checked={autoCalculate}
						onCheckedChange={(checked) => onChange('autoCalculateGrade', checked)}
					/>
				</div>
			</div>
		</CollapsibleSection>
	)
}

function ScorePopup({
	title,
	hint,
	onSelect,
	onDismiss,
	showModifiers = false,
}: {
	title: string
	hint: string
	onSelect: (value: string, modifier?: string) => void
	onDismiss: () => void
	showModifiers?: boolean
}) {
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		function handlePointerDown(event: MouseEvent) {
			if (!ref.current?.contains(event.target as Node)) onDismiss()
		}
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') onDismiss()
		}

		document.addEventListener('mousedown', handlePointerDown)
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('mousedown', handlePointerDown)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [onDismiss])

	return (
		<div
			ref={ref}
			role="dialog"
			aria-label={title}
			className="rounded-xl border border-border bg-white p-4 shadow-dropdown"
		>
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
