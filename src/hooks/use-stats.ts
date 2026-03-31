import { useQuery } from '@tanstack/react-query'

type StatsData = {
	totalRevenue: number
	completedPayments: number
	pendingPayments: number
	delayedPayments: number
	monthlyRevenue: number[]
}

async function fetchStats(): Promise<StatsData> {
	const res = await fetch('/api/stats')
	if (!res.ok) throw new Error('Failed to fetch stats')
	return res.json()
}

function useStats() {
	return useQuery<StatsData>({
		queryKey: ['stats'],
		queryFn: fetchStats,
		staleTime: 60_000,
	})
}

export { useStats }
export type { StatsData }
