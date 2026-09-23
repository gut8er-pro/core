import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { invoiceGross } from '@/lib/invoice/amount'
import { countByStatus, paymentStatus, sumByStatus } from '@/lib/invoice/payment-status'
import { prisma } from '@/lib/prisma'

const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_DAYS = 30
const WEEK_BUCKETS = 12
const YEAR_BUCKETS = 5

type DatedAmount = { date: Date; amount: number }
type Bucket = { start: Date; end: Date }

function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfWeek(date: Date): Date {
	const start = startOfDay(date)
	start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
	return start
}

function addDays(date: Date, days: number): Date {
	const next = new Date(date)
	next.setDate(next.getDate() + days)
	return next
}

function toDateKey(date: Date): string {
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${date.getFullYear()}-${month}-${day}`
}

function sumBetween(entries: DatedAmount[], start: Date, end: Date): number {
	return entries.reduce(
		(sum, entry) => (entry.date >= start && entry.date < end ? sum + entry.amount : sum),
		0,
	)
}

function buildSeries(buckets: Bucket[], entries: DatedAmount[]) {
	return buckets.map((bucket) => ({
		date: toDateKey(bucket.start),
		value: sumBetween(entries, bucket.start, bucket.end),
	}))
}

function weekBuckets(now: Date): Bucket[] {
	const current = startOfWeek(now)
	return Array.from({ length: WEEK_BUCKETS }, (_, index) => {
		const start = addDays(current, (index - (WEEK_BUCKETS - 1)) * 7)
		return { start, end: addDays(start, 7) }
	})
}

function monthBuckets(now: Date): Bucket[] {
	const year = now.getFullYear()
	return Array.from({ length: 12 }, (_, index) => ({
		start: new Date(year, index, 1),
		end: new Date(year, index + 1, 1),
	}))
}

function yearBuckets(now: Date): Bucket[] {
	const firstYear = now.getFullYear() - (YEAR_BUCKETS - 1)
	return Array.from({ length: YEAR_BUCKETS }, (_, index) => ({
		start: new Date(firstYear + index, 0, 1),
		end: new Date(firstYear + index + 1, 0, 1),
	}))
}

function percentChange(current: number, previous: number): number | null {
	if (previous <= 0) return null
	return Math.round(((current - previous) / previous) * 1000) / 10
}

function clientName(
	info: { company: string | null; firstName: string | null; lastName: string | null } | null,
): string | null {
	if (!info) return null
	const name = [info.firstName, info.lastName].filter(Boolean).join(' ')
	return name || info.company || null
}

async function GET() {
	const { user, error } = await getAuthenticatedUser()
	if (error || !user) return unauthorizedResponse()

	const userId = user.id
	const now = new Date()
	const windowStart = new Date(now.getTime() - WINDOW_DAYS * DAY_MS)
	const previousWindowStart = new Date(now.getTime() - 2 * WINDOW_DAYS * DAY_MS)

	const [invoices, totalReports, reportsInWindow, reportsInPreviousWindow] = await Promise.all([
		prisma.invoice.findMany({
			where: { report: { userId } },
			select: {
				id: true,
				invoiceNumber: true,
				totalGross: true,
				totalNet: true,
				taxRate: true,
				date: true,
				payoutDelay: true,
				paidAt: true,
				lineItems: { select: { amount: true, rate: true, quantity: true } },
				report: {
					select: {
						id: true,
						createdAt: true,
						expertOpinion: { select: { fileNumber: true } },
						claimantInfo: { select: { company: true, firstName: true, lastName: true } },
					},
				},
			},
		}),
		prisma.report.count({ where: { userId } }),
		prisma.report.count({ where: { userId, createdAt: { gte: windowStart } } }),
		prisma.report.count({
			where: { userId, createdAt: { gte: previousWindowStart, lt: windowStart } },
		}),
	])

	const payments = invoices.map((invoice) => ({
		id: invoice.id,
		invoiceNumber: invoice.invoiceNumber,
		reportId: invoice.report.id,
		fileNumber: invoice.report.expertOpinion?.fileNumber ?? null,
		client: clientName(invoice.report.claimantInfo),
		issuedAt: invoice.date ?? invoice.report.createdAt,
		createdAt: invoice.report.createdAt,
		date: invoice.date,
		payoutDelay: invoice.payoutDelay,
		paidAt: invoice.paidAt,
		amount: invoiceGross(invoice),
	}))

	const sums = sumByStatus(payments, now)
	const counts = countByStatus(payments, now)

	// Revenue is what has actually been paid, bucketed on the day it was paid, so the
	// chart and the headline number are the same query.
	const paidEntries: DatedAmount[] = payments
		.filter((payment) => payment.paidAt !== null)
		.map((payment) => ({ date: payment.paidAt as Date, amount: payment.amount }))

	const revenueInWindow = sumBetween(paidEntries, windowStart, now)
	const revenueInPreviousWindow = sumBetween(paidEntries, previousWindowStart, windowStart)
	const avgInWindow = reportsInWindow > 0 ? revenueInWindow / reportsInWindow : 0
	const avgInPreviousWindow =
		reportsInPreviousWindow > 0 ? revenueInPreviousWindow / reportsInPreviousWindow : 0

	const rows = payments
		.map((payment) => ({
			id: payment.id,
			reportId: payment.reportId,
			invoiceNumber: payment.invoiceNumber,
			fileNumber: payment.fileNumber,
			client: payment.client,
			date: toDateKey(payment.issuedAt),
			amount: payment.amount,
			status: paymentStatus(payment, now),
		}))
		.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))

	return NextResponse.json({
		totalRevenue: sums.completed,
		pendingRevenue: sums.pending,
		delayedRevenue: sums.delayed,
		totalReports,
		completedPayments: counts.completed,
		pendingPayments: counts.pending,
		delayedPayments: counts.delayed,
		revenueChange: percentChange(revenueInWindow, revenueInPreviousWindow),
		reportsChange: percentChange(reportsInWindow, reportsInPreviousWindow),
		avgReportValueChange: percentChange(avgInWindow, avgInPreviousWindow),
		revenueSeries: {
			weekly: buildSeries(weekBuckets(now), paidEntries),
			monthly: buildSeries(monthBuckets(now), paidEntries),
			yearly: buildSeries(yearBuckets(now), paidEntries),
		},
		invoices: rows,
	})
}

export { GET }
