import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { prisma } from '@/lib/prisma'

async function GET() {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const userId = user?.id

	// Total revenue from invoices
	const revenueResult = await prisma.invoice.aggregate({
		_sum: { totalGross: true },
		where: { report: { userId } },
	})
	const totalRevenue = revenueResult._sum.totalGross ?? 0

	const [completed, pending, delayed] = await Promise.all([
		prisma.report.count({ where: { userId, status: { in: ['SENT', 'LOCKED'] } } }),
		prisma.report.count({ where: { userId, status: 'COMPLETED' } }),
		prisma.report.count({
			where: {
				userId,
				status: 'DRAFT',
				createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
				invoice: { isNot: null },
			},
		}),
	])

	// Monthly invoice totals for current year
	const currentYear = new Date().getFullYear()
	const invoicesThisYear = await prisma.invoice.findMany({
		where: {
			report: {
				userId,
				createdAt: {
					gte: new Date(`${currentYear}-01-01`),
					lt: new Date(`${currentYear + 1}-01-01`),
				},
			},
		},
		select: {
			totalGross: true,
			report: { select: { createdAt: true } },
		},
	})

	const monthly = Array.from({ length: 12 }, () => 0)
	for (const inv of invoicesThisYear) {
		const month = new Date(inv.report.createdAt).getMonth()
		monthly[month] = (monthly[month] ?? 0) + inv.totalGross
	}

	return NextResponse.json({
		totalRevenue,
		completedPayments: completed,
		pendingPayments: pending,
		delayedPayments: delayed,
		monthlyRevenue: monthly,
	})
}

export { GET }
