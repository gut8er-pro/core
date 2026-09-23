import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type ChartPeriod = 'weekly' | 'monthly' | 'yearly'

type RevenuePoint = {
	date: string
	value: number
}

type RevenueSeries = Record<ChartPeriod, RevenuePoint[]>

type InvoiceStatus = 'completed' | 'pending' | 'delayed'

type InvoiceRow = {
	id: string
	reportId: string
	invoiceNumber: string | null
	fileNumber: string | null
	client: string | null
	date: string
	amount: number
	status: InvoiceStatus
}

type RevenueStats = {
	totalRevenue: number
	pendingRevenue: number
	delayedRevenue: number
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

async function setInvoicePaid({ id, paid }: { id: string; paid: boolean }): Promise<void> {
	const response = await fetch(`/api/invoices/${id}/payment`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ paid }),
	})
	if (!response.ok) throw new Error('Failed to update payment status')
}

function useRevenueStats() {
	return useQuery<RevenueStats>({
		queryKey: ['stats'],
		queryFn: fetchRevenueStats,
		staleTime: 60_000,
	})
}

function useSetInvoicePaid() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: setInvoicePaid,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['stats'] })
		},
	})
}

export type { ChartPeriod, InvoiceRow, InvoiceStatus, RevenuePoint, RevenueSeries, RevenueStats }
export { useRevenueStats, useSetInvoicePaid }
