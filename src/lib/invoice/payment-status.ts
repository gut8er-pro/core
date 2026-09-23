type PaymentStatus = 'pending' | 'completed' | 'delayed'

type PaymentSource = {
	date: Date | null
	payoutDelay: number | null
	paidAt: Date | null
}

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_PAYOUT_DELAY_DAYS = 30

function dueDate(source: Pick<PaymentSource, 'date' | 'payoutDelay'>): Date | null {
	if (!source.date) return null
	const days = source.payoutDelay ?? DEFAULT_PAYOUT_DELAY_DAYS
	return new Date(source.date.getTime() + days * DAY_MS)
}

function paymentStatus(source: PaymentSource, now: Date): PaymentStatus {
	if (source.paidAt) return 'completed'
	const due = dueDate(source)
	if (due && due.getTime() <= now.getTime()) return 'delayed'
	return 'pending'
}

function sumByStatus<T extends PaymentSource>(
	entries: Array<T & { amount: number }>,
	now: Date,
): Record<PaymentStatus, number> {
	const totals: Record<PaymentStatus, number> = { pending: 0, completed: 0, delayed: 0 }
	for (const entry of entries) {
		totals[paymentStatus(entry, now)] += entry.amount
	}
	return totals
}

function countByStatus<T extends PaymentSource>(
	entries: T[],
	now: Date,
): Record<PaymentStatus, number> {
	const counts: Record<PaymentStatus, number> = { pending: 0, completed: 0, delayed: 0 }
	for (const entry of entries) {
		counts[paymentStatus(entry, now)] += 1
	}
	return counts
}

export type { PaymentSource, PaymentStatus }
export { countByStatus, DEFAULT_PAYOUT_DELAY_DAYS, dueDate, paymentStatus, sumByStatus }
