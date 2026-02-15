'use client'

import { formatDistanceToNow } from 'date-fns'
import {
	BarChart3,
	FileText,
	CheckCircle2,
	TrendingUp,
	CalendarDays,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useStatistics } from '@/hooks/use-statistics'
import type { MonthlyDataPoint } from '@/hooks/use-statistics'
import type { Report } from '@/hooks/use-reports'

const STATUS_BADGE_MAP: Record<
	Report['status'],
	{ label: string; variant: 'primary' | 'success' | 'warning' | 'info' }
> = {
	DRAFT: { label: 'Draft', variant: 'primary' },
	COMPLETED: { label: 'Completed', variant: 'success' },
	SENT: { label: 'Sent', variant: 'info' },
	LOCKED: { label: 'Locked', variant: 'warning' },
}

function StatisticsPage() {
	const { data, isLoading, error } = useStatistics()

	if (error) {
		return (
			<div className="flex flex-col gap-8">
				<PageHeader />
				<div className="rounded-lg border border-error bg-error-light px-6 py-4 text-body-sm text-error">
					Failed to load statistics. Please try again.
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-8">
			<PageHeader />

			{/* Summary Cards */}
			{isLoading ? (
				<SummaryCardsSkeleton />
			) : data ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<StatCard
						icon={FileText}
						label="Total Reports"
						value={String(data.totalReports)}
						description="All time"
					/>
					<StatCard
						icon={CheckCircle2}
						label="Completed Reports"
						value={String(data.completedReports)}
						description={
							data.totalReports > 0
								? `${Math.round((data.completedReports / data.totalReports) * 100)}% of total`
								: 'No reports yet'
						}
					/>
					<StatCard
						icon={TrendingUp}
						label="Avg. Completion"
						value={`${data.avgCompletion}%`}
						description="Across all reports"
					/>
					<StatCard
						icon={CalendarDays}
						label="This Month"
						value={String(data.reportsThisMonth)}
						description="Reports created"
					/>
				</div>
			) : null}

			{/* Monthly Chart */}
			{isLoading ? (
				<ChartSkeleton />
			) : data ? (
				<MonthlyChart monthlyData={data.monthlyData} />
			) : null}

			{/* Recent Activity */}
			{isLoading ? (
				<RecentActivitySkeleton />
			) : data ? (
				<RecentActivity reports={data.recentReports} />
			) : null}
		</div>
	)
}

function PageHeader() {
	return (
		<div>
			<h1 className="text-h2 font-bold text-black">Statistics</h1>
			<p className="mt-1 text-body-sm text-grey-100">
				Overview of your report activity and performance.
			</p>
		</div>
	)
}

function StatCard({
	icon: Icon,
	label,
	value,
	description,
}: {
	icon: typeof BarChart3
	label: string
	value: string
	description: string
}) {
	return (
		<Card padding="lg">
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2 text-grey-100">
					<Icon className="h-4 w-4" />
					<span className="text-caption font-medium">{label}</span>
				</div>
				<p className="text-h2 font-bold text-black">{value}</p>
				<p className="text-caption text-grey-75">{description}</p>
			</div>
		</Card>
	)
}

function MonthlyChart({ monthlyData }: { monthlyData: MonthlyDataPoint[] }) {
	const maxCount = Math.max(...monthlyData.map((d) => d.count), 1)
	const chartHeight = 200

	return (
		<Card padding="lg">
			<div className="mb-6 flex items-center gap-2">
				<BarChart3 className="h-5 w-5 text-grey-100" />
				<h2 className="text-h4 font-semibold text-black">
					Monthly Reports
				</h2>
			</div>

			<div className="flex items-end gap-3" style={{ height: chartHeight }}>
				{monthlyData.map((point) => {
					const barHeight =
						maxCount > 0
							? Math.max((point.count / maxCount) * (chartHeight - 40), 4)
							: 4
					return (
						<div
							key={`${point.year}-${point.monthShort}`}
							className="flex flex-1 flex-col items-center gap-2"
						>
							{/* Value label */}
							<span className="text-caption font-medium text-grey-100">
								{point.count}
							</span>
							{/* Bar */}
							<div
								className="w-full rounded-t-md bg-primary transition-all hover:bg-primary-hover"
								style={{ height: barHeight }}
								title={`${point.month} ${point.year}: ${point.count} report${point.count === 1 ? '' : 's'}`}
							/>
							{/* Month label */}
							<span className="text-caption text-grey-100">
								{point.monthShort}
							</span>
						</div>
					)
				})}
			</div>
		</Card>
	)
}

function RecentActivity({ reports }: { reports: Report[] }) {
	if (reports.length === 0) {
		return (
			<Card padding="lg">
				<div className="mb-6 flex items-center gap-2">
					<FileText className="h-5 w-5 text-grey-100" />
					<h2 className="text-h4 font-semibold text-black">
						Recent Activity
					</h2>
				</div>
				<div className="flex flex-col items-center justify-center py-12">
					<BarChart3 className="h-12 w-12 text-grey-50" />
					<p className="mt-4 text-body-md font-medium text-grey-100">
						No reports yet
					</p>
					<p className="mt-1 text-body-sm text-grey-75">
						Activity will appear here once you create reports.
					</p>
				</div>
			</Card>
		)
	}

	return (
		<Card padding="lg">
			<div className="mb-6 flex items-center gap-2">
				<FileText className="h-5 w-5 text-grey-100" />
				<h2 className="text-h4 font-semibold text-black">
					Recent Activity
				</h2>
			</div>
			<div className="flex flex-col gap-3">
				{reports.map((report) => {
					const statusConfig = STATUS_BADGE_MAP[report.status]
					const createdAt = formatDistanceToNow(
						new Date(report.createdAt),
						{ addSuffix: true },
					)

					return (
						<div
							key={report.id}
							className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-grey-25"
						>
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
								<FileText className="h-5 w-5 text-primary" />
							</div>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<p className="truncate text-body-sm font-medium text-black">
										{report.title}
									</p>
									<Badge variant={statusConfig.variant}>
										{statusConfig.label}
									</Badge>
								</div>
								<p className="text-caption text-grey-100">
									Created {createdAt}
								</p>
							</div>
							<div className="hidden shrink-0 items-center gap-3 sm:flex">
								<div className="flex w-32 items-center gap-2">
									<Progress value={report.completionPercentage} />
									<span className="text-caption font-medium text-grey-100">
										{report.completionPercentage}%
									</span>
								</div>
							</div>
						</div>
					)
				})}
			</div>
		</Card>
	)
}

function SummaryCardsSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{Array.from({ length: 4 }).map((_, i) => (
				<Card key={i} padding="lg">
					<div className="flex flex-col gap-3">
						<Skeleton variant="text" className="h-4 w-24" />
						<Skeleton variant="text" className="h-8 w-16" />
						<Skeleton variant="text" className="h-3 w-20" />
					</div>
				</Card>
			))}
		</div>
	)
}

function ChartSkeleton() {
	return (
		<Card padding="lg">
			<Skeleton variant="text" className="mb-6 h-6 w-40" />
			<div className="flex items-end gap-3" style={{ height: 200 }}>
				{[80, 120, 60, 140, 100, 50].map((height, i) => (
					<div
						key={i}
						className="flex flex-1 flex-col items-center gap-2"
					>
						<div
							className="w-full animate-pulse rounded-t-md bg-grey-25"
							style={{ height }}
						/>
						<Skeleton variant="text" className="h-3 w-8" />
					</div>
				))}
			</div>
		</Card>
	)
}

function RecentActivitySkeleton() {
	return (
		<Card padding="lg">
			<Skeleton variant="text" className="mb-6 h-6 w-36" />
			<div className="flex flex-col gap-3">
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center gap-4 rounded-lg border border-border p-4"
					>
						<Skeleton variant="circle" className="h-10 w-10" />
						<div className="flex-1">
							<Skeleton variant="text" className="mb-2 h-4 w-48" />
							<Skeleton variant="text" className="h-3 w-24" />
						</div>
						<Skeleton variant="text" className="h-2 w-32" />
					</div>
				))}
			</div>
		</Card>
	)
}

export default StatisticsPage
