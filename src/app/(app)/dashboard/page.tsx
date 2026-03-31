'use client'

import { useState } from 'react'
import { Plus, Search, ListFilter, Info, ChevronDown } from 'lucide-react'
import { useReports, useCreateReport, useDeleteReport } from '@/hooks/use-reports'
import { useStats } from '@/hooks/use-stats'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { ReportTable, EmptyState, Pagination } from '@/components/dashboard/report-list'
import { cn } from '@/lib/utils'

const CHART_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type ChartPeriod = 'yearly' | 'monthly' | 'weekly'

function formatRevenue(amount: number): string {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 2,
	}).format(amount)
}

function DashboardPage() {
	const [page, setPage] = useState(1)
	const [search, setSearch] = useState('')
	const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('yearly')
	const { data, isLoading, error } = useReports({ page, limit: 10 })
	const { data: stats } = useStats()
	const createReport = useCreateReport()
	const deleteReport = useDeleteReport()
	const toast = useToast()

	const chartValues = stats?.monthlyRevenue ?? Array(12).fill(0)
	const maxChartValue = Math.max(...chartValues, 1)
	const currentYear = new Date().getFullYear()

	function handleCreateReport() {
		createReport.mutate('Untitled Report', {
			onSuccess: () => {
				toast.success('Report created successfully')
			},
			onError: () => {
				toast.error('Failed to create report. Please try again.')
			},
		})
	}

	function handleDeleteReport(id: string) {
		deleteReport.mutate(id, {
			onSuccess: () => {
				toast.success('Report deleted successfully')
			},
			onError: () => {
				toast.error('Failed to delete report. Please try again.')
			},
		})
	}

	const filteredReports = data?.reports.filter((report) => {
		if (!search) return true
		const q = search.toLowerCase()
		return (
			report.title.toLowerCase().includes(q) ||
			(report.claimantName?.toLowerCase().includes(q) ?? false) ||
			(report.plateNumber?.toLowerCase().includes(q) ?? false) ||
			(report.vehicleMake?.toLowerCase().includes(q) ?? false) ||
			(report.vehicleModel?.toLowerCase().includes(q) ?? false)
		)
	})

	return (
		<div>
			<h1 className="mb-6 text-h1 font-bold text-black">Dashboard</h1>

			{/* Revenue Chart Card */}
			<div className="mb-8 overflow-hidden rounded-[20px] bg-linear-to-br from-[#0D2818] via-[#14532D] to-[#166534] p-6">
				{/* Top section: revenue + tabs */}
				<div className="mb-6 flex items-start justify-between border-b border-white/40 pb-3">
					<div>
						<p className="text-[23px] font-medium text-white/50">Total Revenue</p>
						<p className="mt-3 text-[44px] font-medium capitalize leading-none tracking-[-0.44px] text-white">
							{stats ? formatRevenue(stats.totalRevenue) : '€0,00'}
						</p>
					</div>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1 rounded-none">
							{(['yearly', 'monthly', 'weekly'] as const).map((period) => (
								<button
									key={period}
									type="button"
									onClick={() => setChartPeriod(period)}
									className={cn(
										'cursor-pointer rounded-[12px] px-3 py-2 text-[14px] font-medium capitalize transition-colors',
										chartPeriod === period
											? 'bg-white text-black shadow-sm'
											: 'text-white/30 hover:text-white',
									)}
								>
									{period.charAt(0).toUpperCase() + period.slice(1)}
								</button>
							))}
						</div>
						<button
							type="button"
							className="flex cursor-pointer items-center gap-2 rounded-[8px] border border-white px-3.5 py-2.5 text-[14px] text-[#f6f6f6]"
						>
							{currentYear}
							<ChevronDown className="h-5 w-5" />
						</button>
					</div>
				</div>

				{/* Bar chart */}
				<div className="mb-4 flex items-end gap-1.5" style={{ height: '199px' }}>
					{chartValues.map((value, i) => {
						const heightPct = maxChartValue > 0 ? (value / maxChartValue) * 100 : 2
						return (
							<div
								key={CHART_MONTHS[i]}
								className="relative flex-1"
								style={{ height: `${Math.max(heightPct, 2)}%` }}
							>
								<div
									className={cn(
										'h-full w-full rounded-t-sm transition-all',
										'bg-white/20 hover:bg-white/30',
									)}
								/>
							</div>
						)
					})}
				</div>

				{/* Bottom section: stats + month labels */}
				<div className="flex items-end justify-between">
					<div className="flex items-center gap-8">
						<div>
							<p className="text-[14px] tracking-[0.14px] text-white/50">Completed Payments:</p>
							<p className="text-[24px] font-medium tracking-[0.24px] text-white">
								{stats?.completedPayments ?? 0}
							</p>
						</div>
						<div>
							<p className="text-[14px] tracking-[0.14px] text-white/50">Pending Payments:</p>
							<p className="text-[24px] font-medium tracking-[0.24px] text-white">
								{stats?.pendingPayments ?? 0}
							</p>
						</div>
						<div>
							<p className="text-[14px] tracking-[0.14px] text-white/50">Delayed Payments:</p>
							<p className="text-[24px] font-medium tracking-[0.24px] text-white">
								{stats?.delayedPayments ?? 0}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-4 px-4">
						{CHART_MONTHS.map((month) => (
							<span key={month} className="text-[14px] text-white/50">
								{month}
							</span>
						))}
					</div>
				</div>
			</div>

			{/* Recent Reports Header */}
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<h2 className="text-[22px] font-medium text-black">Recent Reports</h2>
					<Info className="h-4 w-4 text-grey-100" />
					{data?.pagination.total != null && (
						<span className="flex h-6 min-w-6 items-center justify-center rounded-[8px] bg-primary/10 px-2 text-[14px] font-medium text-primary">
							{data.pagination.total}
						</span>
					)}
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[12px] border border-border bg-white text-grey-100 opacity-80 transition-colors hover:bg-grey-25 hover:text-black"
						aria-label="Filter reports"
					>
						<ListFilter className="h-5 w-5" />
					</button>
					<div className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey-100" />
						<input
							type="text"
							placeholder="Search..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-11 w-[320px] rounded-[12px] border border-border bg-white pl-9 pr-3 text-[14px] text-black outline-none placeholder:text-grey-100 focus:border-primary focus:ring-1 focus:ring-primary"
						/>
					</div>
					<Button
						onClick={handleCreateReport}
						loading={createReport.isPending}
						size="lg"
						icon={<Plus className="h-3.5 w-3.5" />}
						iconPosition="right"
					>
						New Report
					</Button>
				</div>
			</div>

			{/* Report Table */}
			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-grey-25 border-t-primary" />
				</div>
			) : error ? (
				<div className="rounded-lg border border-error bg-error-light px-6 py-4 text-body-sm text-error">
					Failed to load reports. Please try again.
				</div>
			) : filteredReports && filteredReports.length > 0 ? (
				<>
					<ReportTable
						reports={filteredReports}
						onDelete={handleDeleteReport}
						isDeleting={deleteReport.isPending}
					/>
					{data?.pagination && (
						<Pagination
							page={data.pagination.page}
							totalPages={data.pagination.totalPages}
							onPageChange={setPage}
						/>
					)}
				</>
			) : (
				<EmptyState />
			)}
		</div>
	)
}

export default DashboardPage
