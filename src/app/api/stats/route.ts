import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
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

function invoiceStatus(
	reportStatus: string,
	reportCreatedAt: Date,
	delayedBefore: Date,
): 'completed' | 'pending' | 'delayed' {
	if (reportStatus === 'SENT' || reportStatus === 'LOCKED') return 'completed'
	if (reportStatus === 'DRAFT' && reportCreatedAt < delayedBefore) return 'delayed'
	return 'pending'
}

async function GET() {
	const { user, error } = await getAuthenticatedUser()
	if (error || !user) return unauthorizedResponse()

	const userId = user.id
	const now = new Date()
	const windowStart = new Date(now.getTime() - WINDOW_DAYS * DAY_MS)
	const previousWindowStart = new Date(now.getTime() - 2 * WINDOW_DAYS * DAY_MS)

	const [
		invoices,
		totalReports,
		completed,
		pending,
		delayed,
		reportsInWindow,
		reportsInPreviousWindow,
	] = await Promise.all([
		prisma.invoice.findMany({
			where: { report: { userId } },
			select: {
				id: true,
				invoiceNumber: true,
				totalGross: true,
				date: true,
				report: {
					select: {
						status: true,
						createdAt: true,
						claimantInfo: { select: { company: true, firstName: true, lastName: true } },
					},
				},
			},
		}),
		prisma.report.count({ where: { userId } }),
		prisma.report.count({ where: { userId, status: { in: ['SENT', 'LOCKED'] } } }),
		prisma.report.count({ where: { userId, status: 'COMPLETED' } }),
		prisma.report.count({
			where: {
				userId,
				status: 'DRAFT',
				createdAt: { lt: windowStart },
				invoice: { isNot: null },
			},
		}),
		prisma.report.count({ where: { userId, createdAt: { gte: windowStart } } }),
		prisma.report.count({
			where: { userId, createdAt: { gte: previousWindowStart, lt: windowStart } },
		}),
	])

	const entries: DatedAmount[] = invoices.map((invoice) => ({
		date: invoice.date ?? invoice.report.createdAt,
		amount: invoice.totalGross,
	}))

	const totalRevenue = entries.reduce((sum, entry) => sum + entry.amount, 0)
	const revenueInWindow = sumBetween(entries, windowStart, now)
	const revenueInPreviousWindow = sumBetween(entries, previousWindowStart, windowStart)
	const avgInWindow = reportsInWindow > 0 ? revenueInWindow / reportsInWindow : 0
	const avgInPreviousWindow =
		reportsInPreviousWindow > 0 ? revenueInPreviousWindow / reportsInPreviousWindow : 0

	const rows = invoices
		.map((invoice) => ({
			id: invoice.id,
			invoiceNumber: invoice.invoiceNumber,
			client: clientName(invoice.report.claimantInfo),
			date: toDateKey(invoice.date ?? invoice.report.createdAt),
			amount: invoice.totalGross,
			status: invoiceStatus(invoice.report.status, invoice.report.createdAt, windowStart),
		}))
		.sort((a, b) => b.date.localeCompare(a.date))

	return NextResponse.json({
		totalRevenue,
		totalReports,
		completedPayments: completed,
		pendingPayments: pending,
		delayedPayments: delayed,
		revenueChange: percentChange(revenueInWindow, revenueInPreviousWindow),
		reportsChange: percentChange(reportsInWindow, reportsInPreviousWindow),
		avgReportValueChange: percentChange(avgInWindow, avgInPreviousWindow),
		revenueSeries: {
			weekly: buildSeries(weekBuckets(now), entries),
			monthly: buildSeries(monthBuckets(now), entries),
			yearly: buildSeries(yearBuckets(now), entries),
		},
		invoices: rows,
	})
}

export { GET }
