'use client'

import { BarChart3, Car, FileText, Info, Plus, Search, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { EmptyState, Pagination, ReportTable } from '@/components/dashboard/report-list'
import { Button } from '@/components/ui/button'
import { ChartPeriodToggle } from '@/components/ui/chart-period-toggle'
import { useCheckoutReturn } from '@/hooks/use-checkout-return'
import { useCreateReport, useDeleteReport, useReports } from '@/hooks/use-reports'
import { useRevenueSeries } from '@/hooks/use-revenue-series'
import { type ChartPeriod, useRevenueStats } from '@/hooks/use-revenue-stats'
import { useToast } from '@/hooks/use-toast'
import { SubscriptionRequiredError } from '@/lib/api/errors'
import { consumeQueryParam, NEW_REPORT_PARAM } from '@/lib/navigation'
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

function formatRevenue(amount: number): string {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 2,
	}).format(amount)
}

function PaymentTotal({ label, count, amount }: { label: string; count: number; amount: number }) {
	return (
		<div>
			<p className="text-body-sm tracking-[0.14px] text-white/50">{label}</p>
			<div className="flex items-baseline gap-2">
				<p className="text-h2 font-medium tracking-[0.24px] text-white">{count}</p>
				<p className="text-body-sm font-medium text-white/70">{formatRevenue(amount)}</p>
			</div>
		</div>
	)
}

function DashboardPage() {
	const t = useTranslations('dashboard')
	const tt = useTranslations('toast')
	const [page, setPage] = useState(1)
	const [search, setSearch] = useState('')
	const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('monthly')
	const [showReportTypeMenu, setShowReportTypeMenu] = useState(false)
	const [newReportRequested, setNewReportRequested] = useState(false)
	const [menuPlacement, setMenuPlacement] = useState<'down' | 'up' | null>(null)
	const reportTypeRef = useRef<HTMLDivElement>(null)
	const reportTypeMenuRef = useRef<HTMLDivElement>(null)
	const router = useRouter()
	const { data, isLoading, error } = useReports({ page, limit: 10 })
	const { data: stats } = useRevenueStats()
	const createReport = useCreateReport()
	const deleteReport = useDeleteReport()
	const toast = useToast()
	// This is where Stripe Checkout lands, and where the signup's completion screen hands
	// the user on. Both may arrive ahead of the webhook that records what they bought.
	const isAwaitingEntitlement = useCheckoutReturn()

	const monthLabels = useMemo(() => CHART_MONTH_KEYS.map((key) => t(key)), [t])
	const { values: chartValues, labels: chartLabels } = useRevenueSeries({
		series: stats?.revenueSeries,
		period: chartPeriod,
		monthLabels,
	})
	const maxChartValue = Math.max(...chartValues, 1)

	// Arriving from "Create your first report" (signup complete) opens the report-type
	// menu. Read from location rather than useSearchParams so this prerendered route
	// needs no Suspense boundary, and consumed so a refresh does not reopen the menu.
	useEffect(() => {
		if (consumeQueryParam(NEW_REPORT_PARAM) === null) return
		setNewReportRequested(true)
	}, [])

	// ...but not before the webhook has caught up. That request arrives one click after
	// Checkout, and opening the menu into a refusal would be the whole race made visible.
	useEffect(() => {
		if (!newReportRequested || isAwaitingEntitlement) return
		setShowReportTypeMenu(true)
		setNewReportRequested(false)
	}, [newReportRequested, isAwaitingEntitlement])

	useEffect(() => {
		if (!showReportTypeMenu) {
			setMenuPlacement(null)
			return
		}
		const trigger = reportTypeRef.current
		const menu = reportTypeMenuRef.current
		if (!trigger || !menu) return

		const triggerRect = trigger.getBoundingClientRect()
		const menuHeight = menu.offsetHeight
		const spaceBelow = window.innerHeight - triggerRect.bottom
		const spaceAbove = triggerRect.top
		const overflowsBelow = spaceBelow < menuHeight + 16
		setMenuPlacement(overflowsBelow && spaceAbove > spaceBelow ? 'up' : 'down')
	}, [showReportTypeMenu])

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
			{ reportType },
			{
				onSuccess: (data) => {
					router.push(`/reports/${data.report.id}/gallery`)
				},
				onError: (err) => {
					if (err instanceof SubscriptionRequiredError) {
						toast.error(tt('subscriptionRequired'))
						router.push('/settings/billing')
						return
					}
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
			(report.fileNumber?.toLowerCase().includes(q) ?? false) ||
			(report.claimantName?.toLowerCase().includes(q) ?? false) ||
			(report.plateNumber?.toLowerCase().includes(q) ?? false) ||
			(report.vehicleMake?.toLowerCase().includes(q) ?? false) ||
			(report.vehicleModel?.toLowerCase().includes(q) ?? false)
		)
	})

	const periodOptions = [
		{ value: 'yearly' as const, label: t('yearly') },
		{ value: 'monthly' as const, label: t('monthly') },
		{ value: 'weekly' as const, label: t('weekly') },
	]

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
					<ChartPeriodToggle
						value={chartPeriod}
						options={periodOptions}
						onChange={setChartPeriod}
						variant="onDark"
					/>
				</div>

				{/* Bar chart */}
				<div className="mb-4 flex items-end gap-1.5" style={{ height: '199px' }}>
					{chartValues.map((value, i) => {
						const heightPct = maxChartValue > 0 ? (value / maxChartValue) * 100 : 2
						return (
							<div
								key={chartLabels[i] ?? i}
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
						<PaymentTotal
							label={t('completedPayments')}
							count={stats?.completedPayments ?? 0}
							amount={stats?.totalRevenue ?? 0}
						/>
						<PaymentTotal
							label={t('pendingPayments')}
							count={stats?.pendingPayments ?? 0}
							amount={stats?.pendingRevenue ?? 0}
						/>
						<PaymentTotal
							label={t('delayedPayments')}
							count={stats?.delayedPayments ?? 0}
							amount={stats?.delayedRevenue ?? 0}
						/>
					</div>
					<div className="flex items-center gap-4 px-4">
						{chartLabels.map((label) => (
							<span key={label} className="text-body-sm text-white/50">
								{label}
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
							loading={createReport.isPending || isAwaitingEntitlement}
							size="lg"
							icon={<Plus className="h-3.5 w-3.5" />}
							iconPosition="right"
						>
							{isAwaitingEntitlement ? t('activatingSubscription') : t('newReport')}
						</Button>
						{showReportTypeMenu && (
							<div
								ref={reportTypeMenuRef}
								className={cn(
									'absolute right-0 z-50 w-54.5 overflow-hidden rounded-xl bg-white shadow-dropdown',
									menuPlacement === 'up' ? 'bottom-full mb-2' : 'top-full mt-2',
									menuPlacement === null && 'invisible',
								)}
							>
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
