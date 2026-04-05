'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { cn } from '@/lib/utils'

const GRADING_CATEGORY_KEYS = [
	'bodywork',
	'tires',
	'paint',
	'interior',
	'chrome',
	'engineBay',
	'seals',
	'engine',
	'glass',
	'trunk',
] as const

const SCORE_OPTIONS = ['Non', '1', '2', '3', '4', '5'] as const
const _MODIFIERS = ['+', '', '-'] as const

type GradeScore = {
	value: string
	modifier: string
}

type VehicleGradingSectionProps = {
	className?: string
}

function VehicleGradingSection({ className }: VehicleGradingSectionProps) {
	const t = useTranslations('report.condition')

	const GRADING_CATEGORIES = GRADING_CATEGORY_KEYS.map((key) => ({
		key,
		label: t(`vehicleGrading.${key}` as `vehicleGrading.${typeof key}`),
	}))

	const [activeTab, setActiveTab] = useState<'grading' | 'paint'>('grading')
	const [autoCalculate, setAutoCalculate] = useState(true)
	const [overallScore, setOverallScore] = useState<string>('5')
	const [scores, setScores] = useState<Record<string, GradeScore>>(() => {
		const initial: Record<string, GradeScore> = {}
		for (const key of GRADING_CATEGORY_KEYS) {
			initial[key] = { value: '5', modifier: '' }
		}
		return initial
	})
	const [editingCategory, setEditingCategory] = useState<string | null>(null)

	function formatScore(score: GradeScore): string {
		if (score.value === 'Non') return 'Non'
		return `${score.value}${score.modifier}`
	}

	function handleScoreChange(key: string, value: string, modifier: string) {
		setScores((prev) => ({ ...prev, [key]: { value, modifier } }))
		setEditingCategory(null)
	}

	return (
		<CollapsibleSection title={t('vehicleGrading.title')} info className={className}>
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
							<button
								type="button"
								onClick={() => setEditingCategory('overall')}
								className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-body-sm font-semibold text-white"
							>
								{overallScore}
							</button>
						</div>

						{/* Score popup for overall */}
						{editingCategory === 'overall' && (
							<ScorePopup
								title={t('vehicleGrading.overallConditionTitle')}
								hint={t('vehicleGrading.scorePopupHint')}
								onSelect={(value) => {
									setOverallScore(value)
									setEditingCategory(null)
								}}
							/>
						)}

						{/* Category grid */}
						<div className="grid grid-cols-2 gap-y-4 gap-x-8">
							{GRADING_CATEGORIES.map((cat) => (
								<div key={cat.key} className="flex items-center justify-between">
									<span className="text-body-sm text-black">{cat.label}</span>
									<button
										type="button"
										onClick={() => setEditingCategory(cat.key)}
										className="flex h-8 min-w-8 items-center justify-center rounded-full bg-primary/10 px-2 text-body-sm font-semibold text-primary"
									>
										{formatScore(scores[cat.key]!)}
									</button>
								</div>
							))}
						</div>

						{/* Score popup for categories */}
						{editingCategory && editingCategory !== 'overall' && (
							<ScorePopup
								title={GRADING_CATEGORIES.find((c) => c.key === editingCategory)?.label ?? ''}
								hint={t('vehicleGrading.scorePopupHint')}
								onSelect={(value, modifier) => {
									handleScoreChange(editingCategory, value, modifier ?? '')
								}}
								showModifiers
							/>
						)}

						{/* Auto-calculate toggle */}
						<div className="flex items-center justify-between">
							<span className="text-body-sm text-black">
								{t('vehicleGrading.autoCalculateGrade')}
							</span>
							<ToggleSwitch label="" checked={autoCalculate} onCheckedChange={setAutoCalculate} />
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
							<div
								key={`plus-${i}`}
								className="flex w-10 items-center justify-center text-caption text-grey-100"
							>
								+
							</div>
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
						className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-body-sm font-medium text-black transition-colors hover:bg-grey-25"
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
								className="flex w-10 items-center justify-center text-caption text-grey-100 hover:text-black"
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
