import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Report } from '@/hooks/use-reports'

type MonthlyDataPoint = {
	month: string
	monthShort: string
	count: number
	year: number
}

type StatisticsData = {
	totalReports: number
	completedReports: number
	avgCompletion: number
	reportsThisMonth: number
	monthlyData: MonthlyDataPoint[]
	recentReports: Report[]
}

type ReportListResponse = {
	reports: Report[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
	}
}

async function fetchAllReports(): Promise<ReportListResponse> {
	const response = await fetch('/api/reports?limit=100')
	if (!response.ok) {
		throw new Error('Failed to fetch reports')
	}
	return response.json()
}

function computeStatistics(reports: Report[]): StatisticsData {
	const totalReports = reports.length
	const completedReports = reports.filter(
		(r) => r.status === 'COMPLETED' || r.status === 'SENT' || r.status === 'LOCKED',
	).length

	const avgCompletion =
		totalReports > 0
			? Math.round(
					reports.reduce((sum, r) => sum + r.completionPercentage, 0) /
						totalReports,
				)
			: 0

	const now = new Date()
	const currentMonth = now.getMonth()
	const currentYear = now.getFullYear()

	const reportsThisMonth = reports.filter((r) => {
		const date = new Date(r.createdAt)
		return date.getMonth() === currentMonth && date.getFullYear() === currentYear
	}).length

	// Build last 6 months of data
	const monthlyData: MonthlyDataPoint[] = []
	const monthNames = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December',
	]
	const monthShortNames = [
		'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
		'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
	]

	for (let i = 5; i >= 0; i--) {
		const date = new Date(currentYear, currentMonth - i, 1)
		const month = date.getMonth()
		const year = date.getFullYear()

		const count = reports.filter((r) => {
			const reportDate = new Date(r.createdAt)
			return reportDate.getMonth() === month && reportDate.getFullYear() === year
		}).length

		monthlyData.push({
			month: monthNames[month] ?? '',
			monthShort: monthShortNames[month] ?? '',
			count,
			year,
		})
	}

	// Recent reports: last 10, sorted by createdAt descending
	const recentReports = [...reports]
		.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		)
		.slice(0, 10)

	return {
		totalReports,
		completedReports,
		avgCompletion,
		reportsThisMonth,
		monthlyData,
		recentReports,
	}
}

function useStatistics() {
	const query = useQuery({
		queryKey: ['reports', { limit: 100 }],
		queryFn: fetchAllReports,
	})

	const statistics = useMemo<StatisticsData | undefined>(() => {
		if (!query.data) return undefined
		return computeStatistics(query.data.reports)
	}, [query.data])

	return {
		data: statistics,
		isLoading: query.isLoading,
		error: query.error,
	}
}

export { useStatistics, computeStatistics }
export type { StatisticsData, MonthlyDataPoint }
