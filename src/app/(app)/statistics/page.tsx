'use client'

import { useState } from 'react'
import { ChevronDown, Download, Info, Search, SlidersHorizontal } from 'lucide-react'
import { useStats } from '@/hooks/use-stats'
import { cn } from '@/lib/utils'

type ChartView = 'weekly' | 'monthly' | 'yearly'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const Y_LABELS = [10000, 5000, 2000, 1000, 0]

// Mock invoice history — replace with real API when invoice list endpoint exists
const MOCK_INVOICES = [
	{ id: 'OT-0214-01', client: 'Marko Jovanović', date: 'Wed, 14.02.2026', amount: 268, status: 'Completed' as const },
	{ id: 'HS-0214-02', client: 'Ana Petrović', date: 'Wed, 14.02.2026', amount: 268, status: 'Pending' as const },
	{ id: 'KG-0214-02', client: 'Stefan Nikolić', date: 'Wed, 14.02.2026', amount: -268, status: 'Rejected' as const },
	{ id: 'BE-0214-03', client: 'Milica Stojanović', date: 'Wed, 14.02.2026', amount: 268, status: 'Completed' as const },
	{ id: 'OT-0214-04', client: 'Janko Popović', date: 'Wed, 14.02.2026', amount: 268, status: 'Completed' as const },
	{ id: 'OT-0214-05', client: 'Vera Stefanov', date: 'Wed, 14.02.2026', amount: 268, status: 'Completed' as const },
	{ id: 'HS-0214-06', client: 'Vladislav Marić', date: 'Wed, 14.02.2026', amount: 268, status: 'Completed' as const },
	{ id: 'KG-0214-07', client: 'Petar Petrović', date: 'Wed, 14.02.2026', amount: 268, status: 'Completed' as const },
	{ id: 'GH-0214-08', client: 'Pavle Rokvić', date: 'Wed, 14.02.2026', amount: 268, status: 'Completed' as const },
]

function StatisticsPage() {
	const { data: stats, isLoading } = useStats()
	const [chartView, setChartView] = useState<ChartView>('yearly')
	const [searchQuery, setSearchQuery] = useState('')

	const totalRevenue = stats?.totalRevenue ?? 0
	const totalReports = (stats?.completedPayments ?? 0) + (stats?.pendingPayments ?? 0) + (stats?.delayedPayments ?? 0)
	const avgReportValue = totalReports > 0 ? totalRevenue / totalReports : 0
	const monthlyRevenue = stats?.monthlyRevenue ?? Array(12).fill(0)

	const filteredInvoices = MOCK_INVOICES.filter(
		(inv) =>
			inv.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
			inv.id.toLowerCase().includes(searchQuery.toLowerCase()),
	)

	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-page-title font-medium leading-none text-black">Financial Analytics</h1>
					<p className="mt-2 text-input tracking-[0.18px] text-black/70">
						Overview of your revenue and report activity
					</p>
				</div>
				<button
					type="button"
					className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-black opacity-80 hover:bg-grey-25"
				>
					Last 6 months
					<ChevronDown className="h-3.5 w-3.5 text-grey-100" />
				</button>
			</div>

			{/* Summary cards */}
			<div className="grid grid-cols-4 gap-6">
				<StatCard
					label="Total Revenue"
					value={isLoading ? '—' : formatCurrency(totalRevenue)}
					change={12.5}
					positive
				/>
				<StatCard
					label="Total Reports"
					value={isLoading ? '—' : String(totalReports)}
					change={8.2}
					positive
				/>
				<StatCard
					label="Avg. Report Value"
					value={isLoading ? '—' : formatCurrency(avgReportValue)}
					change={-3.1}
					positive={false}
				/>
				<StatCard
					label="Completion Rate"
					value={isLoading ? '—' : `${stats?.completedPayments && totalReports ? Math.round((stats.completedPayments / totalReports) * 100) : 0}%`}
					change={5.4}
					positive
				/>
			</div>

			{/* Revenue chart */}
			<div className="rounded-card border border-border-card bg-white p-5">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-h3 font-medium leading-[30px] text-black">Revenue Overview</h2>
						<p className="text-body leading-6 text-black/60">
							Revenue overview for past weeks, months and year
						</p>
					</div>
					<div className="flex items-center gap-2">
						{(['weekly', 'monthly', 'yearly'] as const).map((view) => (
							<button
								key={view}
								type="button"
								onClick={() => setChartView(view)}
								className={cn(
									'cursor-pointer rounded-lg px-3 py-2 text-body capitalize transition-colors',
									chartView === view
										? 'border border-primary bg-white font-medium text-black'
										: 'text-black/30 hover:text-black/60',
								)}
							>
								{view.charAt(0).toUpperCase() + view.slice(1)}
							</button>
						))}
					</div>
				</div>

				<div className="flex gap-6" style={{ height: '282px' }}>
					{/* Y-axis */}
					<div className="flex w-9 flex-col items-end justify-between py-3 text-body-sm font-medium text-black">
						{Y_LABELS.map((v) => (
							<span key={v}>{v >= 1000 ? `${v / 1000}k` : v}</span>
						))}
					</div>

					{/* Chart area */}
					<div className="relative flex-1">
						<AreaChart data={monthlyRevenue} maxValue={10000} />
					</div>
				</div>

				{/* X-axis */}
				<div className="mt-3 flex justify-between pl-[60px] pr-[30px] text-body text-black">
					{MONTHS.map((m) => (
						<span key={m}>{m}</span>
					))}
				</div>
			</div>

			{/* Invoice History */}
			<div>
				<div className="mb-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<h2 className="text-subsection font-medium text-black">Invoice History</h2>
						<Info className="h-4 w-4 text-grey-100" />
					</div>
					<div className="flex items-center gap-3">
						<button
							type="button"
							className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-white text-grey-100 opacity-80 hover:bg-grey-25"
						>
							<SlidersHorizontal className="h-5 w-5" />
						</button>
						<div className="relative">
							<Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-100" />
							<input
								type="text"
								placeholder="Search..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="h-11 w-[320px] rounded-lg border border-border bg-white pl-10 pr-3 text-body-sm text-black opacity-80 outline-none placeholder:text-grey-100 focus:border-primary"
							/>
						</div>
						<button
							type="button"
							className="flex h-11 cursor-pointer items-center gap-2.5 rounded-xl bg-primary px-6 text-body font-medium text-white hover:bg-primary-hover"
						>
							Download Report
							<Download className="h-4 w-4" />
						</button>
					</div>
				</div>

				<div className="overflow-hidden rounded-xl border-2 border-border-card bg-white">
					<table className="w-full">
						<thead>
							<tr className="border-b border-border-card bg-surface-secondary">
								<th className="px-6 py-3 text-left text-caption font-medium text-grey-100">Clients</th>
								<th className="px-6 py-3 text-left text-caption font-medium text-grey-100">Invoice ID</th>
								<th className="px-6 py-3 text-left text-caption font-medium text-grey-100">Date Created</th>
								<th className="px-6 py-3 text-left text-caption font-medium text-grey-100">Amount</th>
								<th className="px-6 py-3 text-left text-caption font-medium text-grey-100">Status</th>
								<th className="w-14 px-3 py-3" />
							</tr>
						</thead>
						<tbody>
							{filteredInvoices.map((inv) => (
								<tr key={inv.id} className="border-b border-border-card last:border-0 hover:bg-grey-25">
									<td className="px-6 py-3">
										<div className="flex items-center gap-3">
											<div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-grey-25 text-caption font-medium text-grey-100">
												{inv.client.split(' ').map((n) => n[0]).join('')}
											</div>
											<span className="text-body-sm font-medium text-black">{inv.client}</span>
										</div>
									</td>
									<td className="px-6 py-3 text-body-sm text-grey-100">{inv.id}</td>
									<td className="px-6 py-3 text-body-sm text-grey-100">{inv.date}</td>
									<td className={cn('px-6 py-3 text-body-sm font-medium', inv.amount < 0 ? 'text-negative' : 'text-black')}>
										{inv.amount < 0 ? `-€${Math.abs(inv.amount)}` : `€${inv.amount}`}
									</td>
									<td className="px-6 py-3">
										<InvoiceStatusBadge status={inv.status} />
									</td>
									<td className="px-3 py-3 text-center">
										<button type="button" className="cursor-pointer text-grey-100 hover:text-black">
											<Download className="h-4 w-4" />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}

function StatCard({
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
		<div className="flex items-center rounded-card border border-border bg-white p-6">
			<div className="flex flex-col gap-10">
				<p className="text-body font-medium text-text-secondary">{label}</p>
				<div className="flex flex-col gap-1.5">
					<p className="text-page-title font-medium leading-none text-black">{value}</p>
					<p className={cn('text-body-sm font-medium', positive ? 'text-primary' : 'text-error')}>
						{positive ? '↑' : '↓'} {positive ? '+' : ''}{change}%
					</p>
				</div>
			</div>
		</div>
	)
}

function AreaChart({ data, maxValue }: { data: number[]; maxValue: number }) {
	const chartHeight = 258
	const chartWidth = 1000

	const points = data.map((value, index) => ({
		x: (index / (data.length - 1)) * chartWidth,
		y: chartHeight - Math.max((value / maxValue) * chartHeight, 0),
	}))

	const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
	const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`

	// Grid lines at Y_LABELS positions
	const gridLines = [10000, 5000, 2000, 1000, 0].map((v) => ({
		v,
		y: chartHeight - (v / maxValue) * chartHeight,
	}))

	return (
		<svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-full w-full" preserveAspectRatio="none">
			<defs>
				<linearGradient id="statsAreaGradient" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#019447" stopOpacity="0.25" />
					<stop offset="100%" stopColor="#019447" stopOpacity="0.03" />
				</linearGradient>
			</defs>
			{/* Grid lines */}
			{gridLines.map(({ v, y }) => (
				<line key={v} x1="0" y1={y} x2={chartWidth} y2={y} stroke="#e5e7eb" strokeWidth="1" />
			))}
			{/* Area */}
			<path d={areaPath} fill="url(#statsAreaGradient)" />
			{/* Line */}
			<path d={linePath} fill="none" stroke="#019447" strokeWidth="2.5" />
		</svg>
	)
}

function InvoiceStatusBadge({ status }: { status: 'Completed' | 'Pending' | 'Rejected' }) {
	if (status === 'Completed') {
		return (
			<span className="inline-flex items-center justify-center rounded-md border border-[0.5px] border-primary bg-primary/10 px-1.5 py-1 text-caption text-success-dark">
				Completed
			</span>
		)
	}
	if (status === 'Pending') {
		return (
			<span className="inline-flex items-center justify-center rounded-md border border-warning-border bg-warning/10 px-1.5 py-1 text-caption text-warning-dark">
				Pending
			</span>
		)
	}
	return (
		<span className="inline-flex items-center justify-center rounded-md border border-[0.5px] border-danger bg-error/10 px-1.5 py-1 text-caption text-danger">
			Rejected
		</span>
	)
}

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount)
}

export default StatisticsPage
