'use client'

import {
	BarChart3,
	Car,
	ChevronDown,
	FileText,
	Info,
	ListFilter,
	Plus,
	Search,
	Shield,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { EmptyState, Pagination, ReportTable } from '@/components/dashboard/report-list'
import { Button } from '@/components/ui/button'
import { useCreateReport, useDeleteReport, useReports } from '@/hooks/use-reports'
import { useStats } from '@/hooks/use-stats'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { ReportType } from '@/lib/validations/reports'

const REPORT_TYPE_OPTIONS: Array<{ type: ReportType; labelKey: string; icon: typeof Shield }> = [
	{ type: 'HS', labelKey: 'reportTypes.liability', icon: Shield },
	{ type: 'KG', labelKey: 'reportTypes.shortReport', icon: FileText },
	{ type: 'BE', labelKey: 'reportTypes.evaluation', icon: BarChart3 },
	{ type: 'OT', labelKey: 'reportTypes.oldtimerValuation', icon: Car },
]

const CHART_MONTH_KEYS = [
	'months.jan',
	'months.feb',
	'months.mar',
	'months.apr',
	'months.may',
	'months.jun',
	'months.jul',
	'months.aug',
	'months.sep',
	'months.oct',
	'months.nov',
	'months.dec',
] as const

type ChartPeriod = 'yearly' | 'monthly' | 'weekly'

function formatRevenue(amount: number): string {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 2,
	}).format(amount)
}

function DashboardPage() {
	const t = useTranslations('dashboard')
	const tt = useTranslations('toast')
	const [page, setPage] = useState(1)
	const [search, setSearch] = useState('')
	const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('yearly')
	const [showReportTypeMenu, setShowReportTypeMenu] = useState(false)
	const reportTypeRef = useRef<HTMLDivElement>(null)
	const router = useRouter()
	const { data, isLoading, error } = useReports({ page, limit: 10 })
	const { data: stats } = useStats()
	const createReport = useCreateReport()
	const deleteReport = useDeleteReport()
	const toast = useToast()

	const chartValues = stats?.monthlyRevenue ?? Array(12).fill(0)
	const maxChartValue = Math.max(...chartValues, 1)
	const currentYear = new Date().getFullYear()

	// Close dropdown on outside click
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (reportTypeRef.current && !reportTypeRef.current.contains(e.target as Node)) {
				setShowReportTypeMenu(false)
			}
		}
		if (showReportTypeMenu) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [showReportTypeMenu])

	function handleCreateReport(reportType: ReportType) {
		setShowReportTypeMenu(false)
		createReport.mutate(
			{ title: t('untitledReport'), reportType },
			{
				onSuccess: (data) => {
					router.push(`/reports/${data.report.id}/gallery`)
				},
				onError: () => {
					toast.error(tt('reportCreateError'))
				},
			},
		)
	}

	function handleDeleteReport(id: string) {
		deleteReport.mutate(id, {
			onSuccess: () => {
				toast.success(tt('reportDeleted'))
			},
			onError: () => {
				toast.error(tt('reportDeleteError'))
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

	const periodLabels: Record<ChartPeriod, string> = {
		yearly: t('yearly'),
		monthly: t('monthly'),
		weekly: t('weekly'),
	}

	return (
		<div>
			<h1 className="mb-6 text-h1 font-bold text-black">{t('title')}</h1>

			{/* Revenue Chart Card */}
			<div className="mb-8 overflow-hidden rounded-card bg-linear-to-br from-chart-from via-chart-mid to-dark-green p-6">
				{/* Top section: revenue + tabs */}
				<div className="mb-6 flex items-start justify-between border-b border-white/40 pb-3">
					<div>
						<p className="text-plan-label font-medium text-white/50">{t('totalRevenue')}</p>
						<p className="mt-3 text-hero font-medium capitalize leading-none tracking-[-0.44px] text-white">
							{stats ? formatRevenue(stats.totalRevenue) : '\u20ac0,00'}
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
										'cursor-pointer rounded-lg px-3 py-2 text-body-sm font-medium capitalize transition-colors',
										chartPeriod === period
											? 'bg-white text-black shadow-sm'
											: 'text-white/30 hover:text-white',
									)}
								>
									{periodLabels[period]}
								</button>
							))}
						</div>
						<button
							type="button"
							className="flex cursor-pointer items-center gap-2 rounded-md border border-white px-3.5 py-2.5 text-body-sm text-surface-secondary"
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
								key={CHART_MONTH_KEYS[i]}
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
							<p className="text-body-sm tracking-[0.14px] text-white/50">
								{t('completedPayments')}
							</p>
							<p className="text-h2 font-medium tracking-[0.24px] text-white">
								{stats?.completedPayments ?? 0}
							</p>
						</div>
						<div>
							<p className="text-body-sm tracking-[0.14px] text-white/50">{t('pendingPayments')}</p>
							<p className="text-h2 font-medium tracking-[0.24px] text-white">
								{stats?.pendingPayments ?? 0}
							</p>
						</div>
						<div>
							<p className="text-body-sm tracking-[0.14px] text-white/50">{t('delayedPayments')}</p>
							<p className="text-h2 font-medium tracking-[0.24px] text-white">
								{stats?.delayedPayments ?? 0}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-4 px-4">
						{CHART_MONTH_KEYS.map((key) => (
							<span key={key} className="text-body-sm text-white/50">
								{t(key)}
							</span>
						))}
					</div>
				</div>
			</div>

			{/* Recent Reports Header */}
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<h2 className="text-subsection font-medium text-black">{t('recentReports')}</h2>
					<Info className="h-4 w-4 text-grey-100" />
					{data?.pagination.total != null && (
						<span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-primary/10 px-2 text-body-sm font-medium text-primary">
							{data.pagination.total}
						</span>
					)}
				</div>
				<div className="flex flex-wrap items-center gap-2 sm:gap-3">
					<button
						type="button"
						className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-white text-grey-100 opacity-80 transition-colors hover:bg-grey-25 hover:text-black"
						aria-label={t('filterReports')}
					>
						<ListFilter className="h-5 w-5" />
					</button>
					<div className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey-100" />
						<input
							type="text"
							placeholder={t('searchPlaceholder')}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-11 w-full max-w-[320px] rounded-lg border border-border bg-white pl-9 pr-3 text-body-sm text-black outline-none placeholder:text-grey-100 focus:border-primary focus:ring-1 focus:ring-primary"
						/>
					</div>
					<div className="relative" ref={reportTypeRef}>
						<Button
							onClick={() => setShowReportTypeMenu(!showReportTypeMenu)}
							loading={createReport.isPending}
							size="lg"
							icon={<Plus className="h-3.5 w-3.5" />}
							iconPosition="right"
						>
							{t('newReport')}
						</Button>
						{showReportTypeMenu && (
							<div className="absolute right-0 top-full z-50 mt-2 w-54.5 overflow-hidden rounded-xl bg-white shadow-dropdown">
								{REPORT_TYPE_OPTIONS.map((option, idx) => {
									const Icon = option.icon
									return (
										<button
											key={option.type}
											type="button"
											onClick={() => handleCreateReport(option.type)}
											className={cn(
												'flex w-full items-center gap-2.5 px-3.5 py-4 text-body-sm font-medium text-black transition-colors hover:bg-grey-25',
												idx > 0 && 'border-t border-border',
											)}
										>
											<Icon className="h-4.5 w-4.5 shrink-0 text-black" />
											{t(option.labelKey)}
										</button>
									)
								})}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Report Table */}
			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-grey-25 border-t-primary" />
				</div>
			) : error ? (
				<div className="rounded-lg border border-error bg-error-light px-6 py-4 text-body-sm text-error">
					{t('failedToLoad')}
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
