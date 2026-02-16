'use client'

import { useState } from 'react'
import {
	TrendingUp,
	TrendingDown,
	Search,
	SlidersHorizontal,
	Download,
	ChevronDown,
	Info,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useStatistics } from '@/hooks/use-statistics'
import type { MonthlyDataPoint } from '@/hooks/use-statistics'
import { cn } from '@/lib/utils'

type TimePeriod = 'last_6_months' | 'last_year' | 'all_time'
type ChartView = 'weekly' | 'monthly' | 'yearly'

const INVOICE_STATUS_MAP = {
	Completed: { variant: 'success' as const },
	Pending: { variant: 'warning' as const },
	Rejected: { variant: 'error' as const },
}

// Mock invoice data matching the Figma design
const MOCK_INVOICES = [
	{ id: 'OT-0214-01', client: 'Marko Jovanovic', date: 'Wed, 14.02.2026', amount: 268, status: 'Completed' as const },
	{ id: 'HS-0214-02', client: 'Ana Petrovic', date: 'Wed, 14.02.2026', amount: 268, status: 'Pending' as const },
	{ id: 'KG-0214-02', client: 'Stefan Nikolic', date: 'Wed, 14.02.2026', amount: -268, status: 'Rejected' as const },
	{ id: 'BE-0214-03', client: 'Milica Stojanovic', date: 'Wed, 14.02.2026', amount: 268, status: 'Completed' as const },
	{ id: 'OT-0214-04', client: 'Janko Popovic', date: 'Wed, 14.02.2026', amount: 268, status: 'Completed' as const },
	{ id: 'OT-0214-05', client: 'Vera Stefanov', date: 'Wed, 14.02.2026', amount: 268, status: 'Completed' as const },
	{ id: 'HS-0214-06', client: 'Vladislav Maric', date: 'Wed, 14.02.2026', amount: 268, status: 'Completed' as const },
	{ id: 'KG-0214-07', client: 'Petar Petrovic', date: 'Wed, 14.02.2026', amount: 268, status: 'Completed' as const },
	{ id: 'GH-0214-08', client: 'Pavle Rokvic', date: 'Wed, 14.02.2026', amount: 268, status: 'Completed' as const },
]

function StatisticsPage() {
	const { data, isLoading, error } = useStatistics()
	const [timePeriod, setTimePeriod] = useState<TimePeriod>('last_6_months')
	const [chartView, setChartView] = useState<ChartView>('yearly')
	const [searchQuery, setSearchQuery] = useState('')

	if (error) {
		return (
			<div className="flex flex-col gap-8">
				<PageHeader timePeriod={timePeriod} onTimePeriodChange={setTimePeriod} />
				<div className="rounded-lg border border-error bg-error-light px-6 py-4 text-body-sm text-error">
					Failed to load statistics. Please try again.
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader timePeriod={timePeriod} onTimePeriodChange={setTimePeriod} />

			{/* Summary Cards */}
			{isLoading ? (
				<SummaryCardsSkeleton />
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<SummaryCard
						label="Total Revenue"
						value="EUR 11,280"
						change={12.5}
						positive
					/>
					<SummaryCard
						label="Total Reports"
						value={String(data?.totalReports ?? 42)}
						change={8.2}
						positive
					/>
					<SummaryCard
						label="Avg. Report Value"
						value="EUR 268"
						change={-3.1}
						positive={false}
					/>
					<SummaryCard
						label="Completion Rate"
						value={`${data?.avgCompletion ?? 68}%`}
						change={5.4}
						positive
					/>
				</div>
			)}

			{/* Revenue Overview Chart */}
			{isLoading ? (
				<ChartSkeleton />
			) : (
				<RevenueChart
					monthlyData={data?.monthlyData ?? []}
					chartView={chartView}
					onChartViewChange={setChartView}
				/>
			)}

			{/* Invoice History */}
			{isLoading ? (
				<InvoiceTableSkeleton />
			) : (
				<InvoiceHistory
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
				/>
			)}
		</div>
	)
}

function PageHeader({
	timePeriod,
	onTimePeriodChange,
}: {
	timePeriod: TimePeriod
	onTimePeriodChange: (period: TimePeriod) => void
}) {
	const periodLabels: Record<TimePeriod, string> = {
		last_6_months: 'Last 6 months',
		last_year: 'Last year',
		all_time: 'All time',
	}

	return (
		<div className="flex items-start justify-between">
			<div>
				<h1 className="text-h1 font-bold text-black">Financial Analytics</h1>
				<p className="mt-1 text-body-sm text-grey-100">
					Tell us a bit about yourself.
				</p>
			</div>
			<div className="relative">
				<select
					value={timePeriod}
					onChange={(e) => onTimePeriodChange(e.target.value as TimePeriod)}
					className="appearance-none rounded-lg border border-border bg-white py-2 pr-8 pl-4 text-body-sm font-medium text-black"
				>
					{Object.entries(periodLabels).map(([key, label]) => (
						<option key={key} value={key}>{label}</option>
					))}
				</select>
				<ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-grey-100" />
			</div>
		</div>
	)
}

function SummaryCard({
	label,
	value,
	change,
	positive,
}: {
	label: string
	value: string
	change: number
	positive: boolean
}) {
	return (
		<Card padding="lg">
			<div className="flex flex-col gap-2">
				<p className="text-body-sm text-grey-100">{label}</p>
				<p className="text-h2 font-bold text-black">{value}</p>
				<div className="flex items-center gap-1">
					{positive ? (
						<TrendingUp className="h-3.5 w-3.5 text-primary" />
					) : (
						<TrendingDown className="h-3.5 w-3.5 text-error" />
					)}
					<span
						className={cn(
							'text-caption font-medium',
							positive ? 'text-primary' : 'text-error',
						)}
					>
						{positive ? '+' : ''}{change}%
					</span>
				</div>
			</div>
		</Card>
	)
}

function RevenueChart({
	monthlyData,
	chartView,
	onChartViewChange,
}: {
	monthlyData: MonthlyDataPoint[]
	chartView: ChartView
	onChartViewChange: (view: ChartView) => void
}) {
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	// Mock revenue data points for the area chart
	const revenueData = [2200, 2800, 2500, 2400, 2300, 2100, 2000, 1800, 1900, 1600, 1800, 1700]
	const maxRevenue = 10000
	const chartHeight = 240
	const chartWidth = 800

	// Generate SVG path for area chart
	const points = revenueData.map((value, index) => {
		const x = (index / (revenueData.length - 1)) * chartWidth
		const y = chartHeight - (value / maxRevenue) * chartHeight
		return { x, y, value }
	})

	const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
	const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`

	const yLabels = [0, 1000, 2000, 5000, 10000]

	return (
		<Card padding="lg">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h2 className="text-h4 font-semibold text-black">Revenue Overview</h2>
					<p className="mt-0.5 text-caption text-grey-100">
						Revenue overview for past weeks, months and year
					</p>
				</div>
				<div className="flex items-center rounded-lg border border-border">
					{(['weekly', 'monthly', 'yearly'] as const).map((view) => (
						<button
							key={view}
							type="button"
							onClick={() => onChartViewChange(view)}
							className={cn(
								'cursor-pointer px-4 py-1.5 text-body-sm font-medium capitalize transition-colors',
								chartView === view
									? 'rounded-lg bg-black text-white'
									: 'text-grey-100 hover:text-black',
							)}
						>
							{view.charAt(0).toUpperCase() + view.slice(1)}
						</button>
					))}
				</div>
			</div>

			{/* SVG Area Chart */}
			<div className="relative">
				{/* Y-axis labels */}
				<div className="absolute top-0 left-0 flex h-full flex-col-reverse justify-between pb-8">
					{yLabels.map((label) => (
						<span key={label} className="text-caption text-grey-100">
							{label >= 1000 ? `${label / 1000}k` : label}
						</span>
					))}
				</div>

				<div className="ml-12">
					<svg
						viewBox={`0 0 ${chartWidth} ${chartHeight}`}
						className="h-60 w-full"
						preserveAspectRatio="none"
					>
						{/* Grid lines */}
						{yLabels.map((label) => {
							const y = chartHeight - (label / maxRevenue) * chartHeight
							return (
								<line
									key={label}
									x1="0"
									y1={y}
									x2={chartWidth}
									y2={y}
									stroke="#E5E7EB"
									strokeWidth="1"
									strokeDasharray="4 4"
								/>
							)
						})}
						{/* Area fill */}
						<defs>
							<linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#16A34A" stopOpacity="0.3" />
								<stop offset="100%" stopColor="#16A34A" stopOpacity="0.05" />
							</linearGradient>
						</defs>
						<path d={areaPath} fill="url(#areaGradient)" />
						{/* Line */}
						<path d={linePath} fill="none" stroke="#16A34A" strokeWidth="2" />
						{/* Data point highlight (October) */}
						{points[9] && (
							<circle cx={points[9].x} cy={points[9].y} r="5" fill="#16A34A" stroke="white" strokeWidth="2" />
						)}
					</svg>

					{/* X-axis labels */}
					<div className="mt-2 flex justify-between">
						{months.map((month) => (
							<span key={month} className="text-caption text-grey-100">
								{month}
							</span>
						))}
					</div>
				</div>
			</div>
		</Card>
	)
}

function InvoiceHistory({
	searchQuery,
	onSearchChange,
}: {
	searchQuery: string
	onSearchChange: (query: string) => void
}) {
	const filteredInvoices = MOCK_INVOICES.filter(
		(invoice) =>
			invoice.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
			invoice.id.toLowerCase().includes(searchQuery.toLowerCase()),
	)

	return (
		<div>
			{/* Header */}
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<h2 className="text-h4 font-semibold text-black">Invoice History</h2>
					<Info className="h-4 w-4 text-grey-100" />
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-white text-grey-100 hover:bg-grey-25"
					>
						<SlidersHorizontal className="h-4 w-4" />
					</button>
					<div className="relative">
						<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-grey-100" />
						<input
							type="text"
							placeholder="Search..."
							value={searchQuery}
							onChange={(e) => onSearchChange(e.target.value)}
							className="h-10 w-48 rounded-lg border border-border bg-white pr-4 pl-10 text-body-sm text-black placeholder:text-placeholder focus:border-border-focus focus:outline-none"
						/>
					</div>
					<Button
						icon={<Download className="h-4 w-4" />}
						iconPosition="right"
					>
						Download Report
					</Button>
				</div>
			</div>

			{/* Table */}
			<div className="overflow-hidden rounded-xl border border-border bg-white">
				<table className="w-full">
					<thead>
						<tr className="border-b border-border bg-grey-25">
							<th className="px-4 py-3 text-left text-caption font-medium text-grey-100">
								<div className="flex items-center gap-1">
									Clients <ChevronDown className="h-3 w-3" />
								</div>
							</th>
							<th className="px-4 py-3 text-left text-caption font-medium text-grey-100">
								<div className="flex items-center gap-1">
									Invoice ID <ChevronDown className="h-3 w-3" />
								</div>
							</th>
							<th className="px-4 py-3 text-left text-caption font-medium text-grey-100">
								<div className="flex items-center gap-1">
									Date Created <ChevronDown className="h-3 w-3" />
								</div>
							</th>
							<th className="px-4 py-3 text-left text-caption font-medium text-grey-100">
								<div className="flex items-center gap-1">
									Amount <ChevronDown className="h-3 w-3" />
								</div>
							</th>
							<th className="px-4 py-3 text-left text-caption font-medium text-grey-100">
								<div className="flex items-center gap-1">
									Status <ChevronDown className="h-3 w-3" />
								</div>
							</th>
							<th className="w-12 px-4 py-3" />
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{filteredInvoices.map((invoice) => {
							const statusConfig = INVOICE_STATUS_MAP[invoice.status]
							return (
								<tr key={invoice.id} className="transition-colors hover:bg-grey-25">
									<td className="px-4 py-3">
										<div className="flex items-center gap-3">
											<div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-grey-25">
												<span className="text-caption font-medium text-grey-100">
													{invoice.client.split(' ').map((n) => n[0]).join('')}
												</span>
											</div>
											<span className="text-body-sm font-medium text-black">{invoice.client}</span>
										</div>
									</td>
									<td className="px-4 py-3 text-body-sm text-grey-100">{invoice.id}</td>
									<td className="px-4 py-3 text-body-sm text-grey-100">{invoice.date}</td>
									<td className={cn(
										'px-4 py-3 text-body-sm font-medium',
										invoice.amount < 0 ? 'text-error' : 'text-black',
									)}>
										{invoice.amount < 0 ? '-' : ''}EUR {Math.abs(invoice.amount)}
									</td>
									<td className="px-4 py-3">
										<Badge variant={statusConfig.variant}>
											{invoice.status}
										</Badge>
									</td>
									<td className="px-4 py-3 text-right">
										<button type="button" className="cursor-pointer text-grey-100 hover:text-black">
											<Download className="h-4 w-4" />
										</button>
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>
		</div>
	)
}

function SummaryCardsSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{Array.from({ length: 4 }).map((_, i) => (
				<Card key={i} padding="lg">
					<div className="flex flex-col gap-3">
						<Skeleton variant="text" className="h-4 w-24" />
						<Skeleton variant="text" className="h-8 w-32" />
						<Skeleton variant="text" className="h-3 w-16" />
					</div>
				</Card>
			))}
		</div>
	)
}

function ChartSkeleton() {
	return (
		<Card padding="lg">
			<div className="mb-6 flex items-center justify-between">
				<Skeleton variant="text" className="h-6 w-40" />
				<Skeleton variant="text" className="h-8 w-48" />
			</div>
			<Skeleton variant="rect" className="h-60 w-full" />
		</Card>
	)
}

function InvoiceTableSkeleton() {
	return (
		<div>
			<div className="mb-4 flex items-center justify-between">
				<Skeleton variant="text" className="h-6 w-32" />
				<Skeleton variant="text" className="h-10 w-64" />
			</div>
			<div className="overflow-hidden rounded-xl border border-border bg-white">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3">
						<Skeleton variant="circle" className="h-8 w-8" />
						<Skeleton variant="text" className="h-4 w-28" />
						<Skeleton variant="text" className="h-4 w-24" />
						<Skeleton variant="text" className="h-4 w-32" />
						<Skeleton variant="text" className="h-4 w-16" />
						<Skeleton variant="text" className="h-4 w-20" />
					</div>
				))}
			</div>
		</div>
	)
}

export default StatisticsPage
