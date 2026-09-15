'use client'

import { Info, Search } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { ChartPeriodToggle } from '@/components/ui/chart-period-toggle'
import { useRevenueSeries } from '@/hooks/use-revenue-series'
import { type ChartPeriod, type InvoiceStatus, useRevenueStats } from '@/hooks/use-revenue-stats'
import { cn } from '@/lib/utils'

const MONTH_KEYS = [
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

const AXIS_STEPS = [4, 3, 2, 1, 0]
const NICE_STEPS = [1, 2, 4, 8, 10]
const EMPTY_AXIS_MAX = 1000

function niceCeiling(value: number): number {
	if (value <= 0) return EMPTY_AXIS_MAX
	const magnitude = 10 ** Math.floor(Math.log10(value))
	const normalized = value / magnitude
	return (NICE_STEPS.find((step) => normalized <= step) ?? 10) * magnitude
}

function StatisticsPage() {
	const t = useTranslations('statistics')
	const tc = useTranslations('common')
	const locale = useLocale()
	const { data: stats, isLoading, isError } = useRevenueStats()
	const [chartView, setChartView] = useState<ChartPeriod>('monthly')
	const [searchQuery, setSearchQuery] = useState('')

	const totalRevenue = stats?.totalRevenue ?? 0
	const totalReports = stats?.totalReports ?? 0
	const avgReportValue = totalReports > 0 ? totalRevenue / totalReports : 0
	const completionRate =
		totalReports > 0 ? Math.round(((stats?.completedPayments ?? 0) / totalReports) * 100) : 0

	const monthLabels = useMemo(() => MONTH_KEYS.map((key) => t(key)), [t])
	const { values: chartValues, labels: chartLabels } = useRevenueSeries({
		series: stats?.revenueSeries,
		period: chartView,
		monthLabels,
	})
	const chartMax = niceCeiling(Math.max(...chartValues, 0))

	const invoices = stats?.invoices ?? []
	const filteredInvoices = invoices.filter((invoice) => {
		if (!searchQuery) return true
		const query = searchQuery.toLowerCase()
		return (
			(invoice.client?.toLowerCase().includes(query) ?? false) ||
			(invoice.invoiceNumber?.toLowerCase().includes(query) ?? false)
		)
	})

	const periodOptions = [
		{ value: 'weekly' as const, label: t('weekly') },
		{ value: 'monthly' as const, label: t('monthly') },
		{ value: 'yearly' as const, label: t('yearly') },
	]

	const statusLabels: Record<InvoiceStatus, string> = {
		completed: t('status.completed'),
		pending: t('status.pending'),
		delayed: t('status.delayed'),
	}

	function emptyMessage(): string {
		if (isLoading) return tc('loading')
		if (isError) return t('loadError')
		return searchQuery ? t('noInvoicesFound') : t('noInvoices')
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div>
				<h1 className="text-page-title font-medium leading-none text-black">{t('title')}</h1>
				<p className="mt-2 text-input tracking-[0.18px] text-black/70">{t('subtitle')}</p>
			</div>

			{/* Summary cards */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
				<StatCard
					label={t('totalRevenue')}
					value={isLoading ? '—' : formatCurrencyRounded(totalRevenue, locale)}
					change={stats?.revenueChange ?? null}
					changeLabel={t('vsPreviousPeriod')}
					locale={locale}
				/>
				<StatCard
					label={t('totalReports')}
					value={isLoading ? '—' : String(totalReports)}
					change={stats?.reportsChange ?? null}
					changeLabel={t('vsPreviousPeriod')}
					locale={locale}
				/>
				<StatCard
					label={t('avgReportValue')}
					value={isLoading ? '—' : formatCurrencyRounded(avgReportValue, locale)}
					change={stats?.avgReportValueChange ?? null}
					changeLabel={t('vsPreviousPeriod')}
					locale={locale}
				/>
				<StatCard
					label={t('completionRate')}
					value={isLoading ? '—' : `${completionRate}%`}
					change={null}
					changeLabel={t('vsPreviousPeriod')}
					locale={locale}
				/>
			</div>

			{/* Revenue chart */}
			<div className="rounded-card border border-border-card bg-white p-5">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-h3 font-medium leading-[30px] text-black">
							{t('revenueOverview')}
						</h2>
						<p className="text-body leading-6 text-black/60">{t('revenueOverviewSubtitle')}</p>
					</div>
					<ChartPeriodToggle value={chartView} options={periodOptions} onChange={setChartView} />
				</div>

				<div className="flex gap-6" style={{ height: '282px' }}>
					{/* Y-axis */}
					<div className="flex w-12 flex-col items-end justify-between py-3 text-body-sm font-medium text-black">
						{AXIS_STEPS.map((step) => (
							<span key={step}>{formatAxisValue((chartMax * step) / 4, locale)}</span>
						))}
					</div>

					{/* Chart area */}
					<div className="relative flex-1">
						<AreaChart data={chartValues} maxValue={chartMax} />
					</div>
				</div>

				{/* X-axis */}
				<div className="mt-3 flex justify-between pl-18 pr-[30px] text-body text-black">
					{chartLabels.map((label) => (
						<span key={label}>{label}</span>
					))}
				</div>
			</div>

			{/* Invoice History */}
			<div>
				<div className="mb-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<h2 className="text-subsection font-medium text-black">{t('invoiceHistory')}</h2>
						<Info className="h-4 w-4 text-grey-100" />
					</div>
					<div className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-100" />
						<input
							type="text"
							placeholder={t('searchPlaceholder')}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-11 w-[320px] rounded-lg border border-border bg-white pl-10 pr-3 text-body-sm text-black opacity-80 outline-none placeholder:text-grey-100 focus:border-primary"
						/>
					</div>
				</div>

				<div className="overflow-x-auto rounded-xl border-2 border-border-card bg-white">
					<table className="w-full min-w-120">
						<thead>
							<tr className="border-b border-border-card bg-surface-secondary">
								<th className="px-6 py-3 text-left text-caption font-medium text-grey-100">
									{t('table.clients')}
								</th>
								<th className="px-6 py-3 text-left text-caption font-medium text-grey-100">
									{t('table.invoiceId')}
								</th>
								<th className="px-6 py-3 text-left text-caption font-medium text-grey-100">
									{t('table.dateCreated')}
								</th>
								<th className="px-6 py-3 text-left text-caption font-medium text-grey-100">
									{t('table.amount')}
								</th>
								<th className="px-6 py-3 text-left text-caption font-medium text-grey-100">
									{t('table.status')}
								</th>
							</tr>
						</thead>
						<tbody>
							{filteredInvoices.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-6 py-10 text-center text-body-sm text-grey-100">
										{emptyMessage()}
									</td>
								</tr>
							) : (
								filteredInvoices.map((invoice) => {
									const client = invoice.client ?? t('unknownClient')
									return (
										<tr
											key={invoice.id}
											className="border-b border-border-card last:border-0 hover:bg-grey-25"
										>
											<td className="px-6 py-3">
												<div className="flex items-center gap-3">
													<div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-grey-25 text-caption font-medium text-grey-100">
														{initials(client)}
													</div>
													<span className="text-body-sm font-medium text-black">{client}</span>
												</div>
											</td>
											<td className="px-6 py-3 text-body-sm text-grey-100">
												{invoice.invoiceNumber ?? '—'}
											</td>
											<td className="px-6 py-3 text-body-sm text-grey-100">
												{formatInvoiceDate(invoice.date, locale)}
											</td>
											<td
												className={cn(
													'px-6 py-3 text-body-sm font-medium',
													invoice.amount < 0 ? 'text-negative' : 'text-black',
												)}
											>
												{formatCurrency(invoice.amount, locale)}
											</td>
											<td className="px-6 py-3">
												<InvoiceStatusBadge
													status={invoice.status}
													label={statusLabels[invoice.status]}
												/>
											</td>
										</tr>
									)
								})
							)}
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
	changeLabel,
	locale,
}: {
	label: string
	value: string
	change: number | null
	changeLabel: string
	locale: string
}) {
	const positive = change !== null && change >= 0

	return (
		<div className="flex items-center rounded-card border border-border bg-white p-6">
			<div className="flex flex-col gap-10">
				<p className="text-body font-medium text-text-secondary">{label}</p>
				<div className="flex flex-col gap-1.5">
					<p className="text-page-title font-medium leading-none text-black">{value}</p>
					{change !== null && (
						<p className={cn('text-body-sm font-medium', positive ? 'text-primary' : 'text-error')}>
							{positive ? '↑ +' : '↓ '}
							{formatPercent(change, locale)}%{' '}
							<span className="font-normal text-grey-100">{changeLabel}</span>
						</p>
					)}
				</div>
			</div>
		</div>
	)
}

function AreaChart({ data, maxValue }: { data: number[]; maxValue: number }) {
	const chartHeight = 258
	const chartWidth = 1000
	const span = Math.max(data.length - 1, 1)

	const points = data.map((value, index) => ({
		x: (index / span) * chartWidth,
		y: chartHeight - Math.max((value / maxValue) * chartHeight, 0),
	}))

	const linePath = points
		.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
		.join(' ')
	const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`

	return (
		<svg
			viewBox={`0 0 ${chartWidth} ${chartHeight}`}
			className="h-full w-full"
			preserveAspectRatio="none"
		>
			<defs>
				<linearGradient id="statsAreaGradient" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#019447" stopOpacity="0.25" />
					<stop offset="100%" stopColor="#019447" stopOpacity="0.03" />
				</linearGradient>
			</defs>
			{AXIS_STEPS.map((step) => (
				<line
					key={step}
					x1="0"
					y1={chartHeight - (step / 4) * chartHeight}
					x2={chartWidth}
					y2={chartHeight - (step / 4) * chartHeight}
					stroke="#e5e7eb"
					strokeWidth="1"
				/>
			))}
			{points.length > 0 && (
				<>
					<path d={areaPath} fill="url(#statsAreaGradient)" />
					<path d={linePath} fill="none" stroke="#019447" strokeWidth="2.5" />
				</>
			)}
		</svg>
	)
}

function InvoiceStatusBadge({ status, label }: { status: InvoiceStatus; label: string }) {
	if (status === 'completed') {
		return (
			<span className="inline-flex items-center justify-center rounded-md border border-[0.5px] border-primary bg-primary/10 px-1.5 py-1 text-caption text-success-dark">
				{label}
			</span>
		)
	}
	if (status === 'pending') {
		return (
			<span className="inline-flex items-center justify-center rounded-md border border-warning-border bg-warning/10 px-1.5 py-1 text-caption text-warning-dark">
				{label}
			</span>
		)
	}
	return (
		<span className="inline-flex items-center justify-center rounded-md border border-[0.5px] border-danger bg-error/10 px-1.5 py-1 text-caption text-danger">
			{label}
		</span>
	)
}

function initials(name: string): string {
	return name
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0] ?? '')
		.join('')
}

function formatCurrency(amount: number, locale: string): string {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount)
}

function formatCurrencyRounded(amount: number, locale: string): string {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount)
}

function formatPercent(value: number, locale: string): string {
	return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)
}

function formatAxisValue(value: number, locale: string): string {
	if (value >= 1000) {
		return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / 1000)}k`
	}
	return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)
}

function formatInvoiceDate(dateKey: string, locale: string): string {
	const [year, month, day] = dateKey.split('-').map(Number)
	return new Intl.DateTimeFormat(locale, {
		weekday: 'short',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	}).format(new Date(year ?? 0, (month ?? 1) - 1, day ?? 1))
}

export default StatisticsPage
