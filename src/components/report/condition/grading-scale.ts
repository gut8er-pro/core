import type { GradingCategory, GradingField } from './types'
import { GRADED_CATEGORIES, gradingKey } from './types'

/** The grades an assessor can pick, before the +/− modifier. */
const SCORE_OPTIONS = ['Non', '1', '2', '3', '4', '5'] as const

/** Shown on a category that has not been graded — never a number. */
const UNGRADED = '–'

/**
 * A grade as a number on the German 1–5 scale, where 1 is best.
 *
 * `+` and `−` are third-of-a-grade steps, the way a school report reads them, so
 * a 2+ sits at 1.67 and a 2− at 2.33. `Non` is "not applicable to this vehicle"
 * rather than a bad score, so it contributes nothing to the mean.
 */
function scoreOf(grade: string): number | null {
	const match = /^([1-5])([+-]?)$/.exec(grade.trim())
	if (!match) return null

	const base = Number(match[1])
	if (match[2] === '+') return base - 1 / 3
	if (match[2] === '-') return base + 1 / 3
	return base
}

/** The nearest grade on the scale, including its +/− third. */
function gradeOf(score: number): string {
	const clamped = Math.min(5, Math.max(1, score))
	const thirds = Math.round(clamped * 3)
	const base = Math.round(thirds / 3)
	const step = thirds - base * 3

	if (base < 1) return '1'
	if (base > 5) return '5'
	if (step === -1) return `${base}+`
	if (step === 1) return `${base}-`
	return String(base)
}

/**
 * The overall grade the categories add up to — the arithmetic mean of every
 * graded category, rounded back onto the scale.
 *
 * `null` while nothing is graded: an overall grade computed from no grades would
 * assert a condition nobody assessed.
 */
function computeOverallGrade(values: Partial<Record<GradingField, string>>): string | null {
	const scores = GRADED_CATEGORIES.map((category: Exclude<GradingCategory, 'paint'>) =>
		scoreOf(values[gradingKey(category)] ?? ''),
	).filter((score): score is number => score !== null)

	if (scores.length === 0) return null

	return gradeOf(scores.reduce((total, score) => total + score, 0) / scores.length)
}

export { computeOverallGrade, gradeOf, SCORE_OPTIONS, scoreOf, UNGRADED }
