'use client'

import { useState } from 'react'
import { Plus, Search, SlidersHorizontal, Info, ChevronDown } from 'lucide-react'
import { useReports, useCreateReport, useDeleteReport } from '@/hooks/use-reports'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { ReportTable, EmptyState, Pagination } from '@/components/dashboard/report-list'
import { cn } from '@/lib/utils'

const CHART_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CHART_VALUES = [45, 55, 70, 60, 85, 50, 65, 80, 75, 90, 40, 35]

type ChartPeriod = 'yearly' | 'monthly' | 'weekly'

function DashboardPage() {
	const [page, setPage] = useState(1)
	const [search, setSearch] = useState('')
	const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('yearly')
	const { data, isLoading, error } = useReports({ page, limit: 10 })
	const createReport = useCreateReport()
	const deleteReport = useDeleteReport()
	const toast = useToast()

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
			<div className="mb-8 overflow-hidden rounded-2xl bg-linear-to-br from-[#0D2818] via-[#14532D] to-[#166534] p-6">
				{/* Top section: revenue + tabs */}
				<div className="mb-8 flex items-start justify-between">
					<div>
						<p className="text-body-sm font-medium text-white/70">Total Revenue</p>
						<p className="mt-1 text-display font-bold text-white">$5.430,50</p>
					</div>
					<div className="flex items-center gap-3">
						<div className="flex rounded-lg bg-white/10 p-0.5">
							{(['yearly', 'monthly', 'weekly'] as const).map((period) => (
								<button
									key={period}
									type="button"
									onClick={() => setChartPeriod(period)}
									className={cn(
										'cursor-pointer rounded-md px-4 py-1.5 text-body-sm font-medium capitalize transition-colors',
										chartPeriod === period
											? 'bg-white text-black'
											: 'text-white/60 hover:text-white',
									)}
								>
									{period.charAt(0).toUpperCase() + period.slice(1)}
								</button>
							))}
						</div>
						<button
							type="button"
							className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-body-sm font-medium text-white"
						>
							2025
							<ChevronDown className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Bar chart */}
				<div className="mb-6 flex items-end gap-1.5" style={{ height: '140px' }}>
					{CHART_VALUES.map((value, i) => (
						<div
							key={CHART_MONTHS[i]}
							className="flex-1 rounded-t-sm bg-white/20 transition-all hover:bg-white/30"
							style={{ height: `${value}%` }}
						/>
					))}
				</div>

				{/* Bottom section: stats + month labels */}
				<div className="flex items-end justify-between">
					<div className="flex items-center gap-8">
						<div>
							<p className="text-caption text-white/50">Completed Payments:</p>
							<p className="text-h3 font-bold text-white">5</p>
						</div>
						<div>
							<p className="text-caption text-white/50">Pending Payments:</p>
							<p className="text-h3 font-bold text-white">10</p>
						</div>
						<div>
							<p className="text-caption text-white/50">Delayed Payments:</p>
							<p className="text-h3 font-bold text-white">4</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						{CHART_MONTHS.map((month) => (
							<span key={month} className="text-caption text-white/50">
								{month}
							</span>
						))}
					</div>
				</div>
			</div>

			{/* Recent Reports Header */}
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<h2 className="text-h3 font-bold text-black">Recent Reports</h2>
					<Info className="h-4 w-4 text-grey-100" />
					{data?.pagination.total != null && (
						<span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-caption font-semibold text-white">
							{data.pagination.total}
						</span>
					)}
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-white text-grey-100 transition-colors hover:bg-grey-25 hover:text-black"
						aria-label="Filter reports"
					>
						<SlidersHorizontal className="h-4 w-4" />
					</button>
					<div className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey-100" />
						<input
							type="text"
							placeholder="Search.."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-10 w-52 rounded-lg border border-border bg-white pl-9 pr-3 text-body-sm text-black outline-none placeholder:text-grey-100 focus:border-primary focus:ring-1 focus:ring-primary"
						/>
					</div>
					<Button
						onClick={handleCreateReport}
						loading={createReport.isPending}
						icon={<Plus className="h-4 w-4" />}
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
