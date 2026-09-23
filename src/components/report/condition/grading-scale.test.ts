import { describe, expect, it } from 'vitest'
import { computeOverallGrade, gradeOf, scoreOf } from './grading-scale'

describe('scoreOf', () => {
	it('reads a plain grade as its own number', () => {
		expect(scoreOf('1')).toBe(1)
		expect(scoreOf('5')).toBe(5)
	})

	it('reads a modifier as a third of a grade', () => {
		expect(scoreOf('2+')).toBeCloseTo(5 / 3)
		expect(scoreOf('2-')).toBeCloseTo(7 / 3)
	})

	it('scores nothing for an ungraded or not-applicable category', () => {
		expect(scoreOf('')).toBeNull()
		expect(scoreOf('Non')).toBeNull()
		expect(scoreOf('6')).toBeNull()
	})
})

describe('gradeOf', () => {
	it('rounds a whole mean onto the scale', () => {
		expect(gradeOf(2)).toBe('2')
		expect(gradeOf(3.05)).toBe('3')
	})

	it('rounds a mean a third away onto the modifier', () => {
		expect(gradeOf(5 / 3)).toBe('2+')
		expect(gradeOf(7 / 3)).toBe('2-')
	})

	it('never leaves the 1–5 scale', () => {
		expect(gradeOf(0.2)).toBe('1')
		expect(gradeOf(9)).toBe('5')
	})
})

describe('computeOverallGrade', () => {
	it('averages every graded category', () => {
		expect(
			computeOverallGrade({
				gradingBodywork: '2',
				gradingTires: '2',
				gradingInterior: '2',
			}),
		).toBe('2')
	})

	it('lands on a modifier when the categories disagree', () => {
		expect(computeOverallGrade({ gradingBodywork: '2', gradingTires: '3' })).toBe('3+')
	})

	it('ignores the paint category — it is graded on the paint layer', () => {
		const withoutPaint = computeOverallGrade({ gradingBodywork: '1', gradingTires: '1' })
		const withPaint = computeOverallGrade({
			gradingBodywork: '1',
			gradingTires: '1',
			gradingPaint: '5',
		})

		expect(withPaint).toBe(withoutPaint)
	})

	it('ignores a category marked as not applicable', () => {
		expect(computeOverallGrade({ gradingBodywork: '3', gradingTires: 'Non' })).toBe('3')
	})

	it('computes nothing while nothing is graded', () => {
		expect(computeOverallGrade({})).toBeNull()
		expect(computeOverallGrade({ gradingBodywork: 'Non' })).toBeNull()
	})
})
