import { useQuery } from '@tanstack/react-query'

type ChartPeriod = 'weekly' | 'monthly' | 'yearly'

type RevenuePoint = {
	date: string
	value: number
}

type RevenueSeries = Record<ChartPeriod, RevenuePoint[]>

type InvoiceStatus = 'completed' | 'pending' | 'delayed'

type InvoiceRow = {
	id: string
	invoiceNumber: string | null
	client: string | null
	date: string
	amount: number
	status: InvoiceStatus
}

type RevenueStats = {
	totalRevenue: number
	totalReports: number
	completedPayments: number
	pendingPayments: number
	delayedPayments: number
	revenueChange: number | null
	reportsChange: number | null
	avgReportValueChange: number | null
	revenueSeries: RevenueSeries
	invoices: InvoiceRow[]
}

async function fetchRevenueStats(): Promise<RevenueStats> {
	const response = await fetch('/api/stats')
	if (!response.ok) throw new Error('Failed to fetch stats')
	return response.json()
}

function useRevenueStats() {
	return useQuery<RevenueStats>({
		queryKey: ['stats'],
		queryFn: fetchRevenueStats,
		staleTime: 60_000,
	})
}

export type { ChartPeriod, InvoiceRow, InvoiceStatus, RevenuePoint, RevenueSeries, RevenueStats }
export { useRevenueStats }
