import { describe, expect, it } from 'vitest'
import {
	countByStatus,
	DEFAULT_PAYOUT_DELAY_DAYS,
	dueDate,
	paymentStatus,
	sumByStatus,
} from './payment-status'

const NOW = new Date('2026-09-23T12:00:00.000Z')

function daysBefore(days: number): Date {
	return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000)
}

describe('paymentStatus', () => {
	it('is completed once paidAt is set, whatever the due date', () => {
		expect(
			paymentStatus({ date: daysBefore(400), payoutDelay: 14, paidAt: daysBefore(1) }, NOW),
		).toBe('completed')
	})

	it('is pending while the payout delay has not elapsed', () => {
		expect(paymentStatus({ date: daysBefore(10), payoutDelay: 30, paidAt: null }, NOW)).toBe(
			'pending',
		)
	})

	it('is delayed once the payout delay has elapsed', () => {
		expect(paymentStatus({ date: daysBefore(31), payoutDelay: 30, paidAt: null }, NOW)).toBe(
			'delayed',
		)
	})

	it('is delayed on the exact due day', () => {
		expect(paymentStatus({ date: daysBefore(30), payoutDelay: 30, paidAt: null }, NOW)).toBe(
			'delayed',
		)
	})

	it('is pending on the day before the due day', () => {
		expect(paymentStatus({ date: daysBefore(29), payoutDelay: 30, paidAt: null }, NOW)).toBe(
			'pending',
		)
	})

	it('falls back to the default payout delay when none is set', () => {
		expect(paymentStatus({ date: daysBefore(31), payoutDelay: null, paidAt: null }, NOW)).toBe(
			'delayed',
		)
		expect(paymentStatus({ date: daysBefore(29), payoutDelay: null, paidAt: null }, NOW)).toBe(
			'pending',
		)
	})

	it('stays pending when the invoice has no date to count from', () => {
		expect(paymentStatus({ date: null, payoutDelay: 7, paidAt: null }, NOW)).toBe('pending')
	})

	it('treats a zero payout delay as due immediately', () => {
		expect(paymentStatus({ date: daysBefore(0), payoutDelay: 0, paidAt: null }, NOW)).toBe(
			'delayed',
		)
	})
})

describe('dueDate', () => {
	it('adds the payout delay to the invoice date', () => {
		expect(dueDate({ date: new Date('2026-01-01T00:00:00.000Z'), payoutDelay: 21 })).toEqual(
			new Date('2026-01-22T00:00:00.000Z'),
		)
	})

	it('uses the default delay when none is stored', () => {
		const due = dueDate({ date: new Date('2026-01-01T00:00:00.000Z'), payoutDelay: null })
		expect(due).toEqual(
			new Date(
				new Date('2026-01-01T00:00:00.000Z').getTime() +
					DEFAULT_PAYOUT_DELAY_DAYS * 24 * 60 * 60 * 1000,
			),
		)
	})

	it('is null without an invoice date', () => {
		expect(dueDate({ date: null, payoutDelay: 21 })).toBeNull()
	})
})

describe('sumByStatus and countByStatus', () => {
	const entries = [
		{ date: daysBefore(60), payoutDelay: 30, paidAt: daysBefore(2), amount: 1000 },
		{ date: daysBefore(60), payoutDelay: 30, paidAt: null, amount: 500 },
		{ date: daysBefore(5), payoutDelay: 30, paidAt: null, amount: 250 },
		{ date: null, payoutDelay: null, paidAt: null, amount: 125 },
	]

	it('sums the money into the three buckets', () => {
		expect(sumByStatus(entries, NOW)).toEqual({ completed: 1000, delayed: 500, pending: 375 })
	})

	it('counts the rows into the same buckets', () => {
		expect(countByStatus(entries, NOW)).toEqual({ completed: 1, delayed: 1, pending: 2 })
	})

	it('keeps the sums and counts over the same rows', () => {
		const sums = sumByStatus(entries, NOW)
		const total = sums.completed + sums.pending + sums.delayed
		expect(total).toBe(entries.reduce((sum, entry) => sum + entry.amount, 0))
	})
})
