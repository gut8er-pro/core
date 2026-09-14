'use client'

import { AlertTriangle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { MissingInfoReport, ReportType, TabKey } from '@/lib/completeness'

type TabRoute = {
	key: TabKey
	/** Path under `/reports/{id}`. */
	path: string
	label: (t: ReturnType<typeof useTranslations>, reportType: ReportType) => string
}

/**
 * Where each tab's gaps live, in the order the assessor walks the report.
 *
 * Two tabs are renamed by report type — an Oldtimer collects a client rather
 * than an accident, and both valuation types head the last calculation tab
 * "Valuation" — so the label is a function rather than a key.
 */
const TAB_ROUTES: TabRoute[] = [
	{ key: 'gallery', path: 'gallery', label: (t) => t('sidebar.gallery') },
	{
		key: 'accidentInfo',
		path: 'details/accident-info',
		label: (t, reportType) =>
			reportType === 'OT' ? t('accidentInfo.clientInformation') : t('accidentInfo.title'),
	},
	{ key: 'vehicle', path: 'details/vehicle', label: (t) => t('vehicle.title') },
	{ key: 'condition', path: 'details/condition', label: (t) => t('condition.title') },
	{
		key: 'calculation',
		path: 'details/calculation',
		label: (t, reportType) =>
			reportType === 'BE' || reportType === 'OT'
				? t('calculation.valuationTab')
				: t('calculation.title'),
	},
	{ key: 'invoice', path: 'details/invoice', label: (t) => t('invoice.title') },
]

type IncompleteNoticeProps = {
	reportId: string
	reportType: ReportType
	missingInfo: MissingInfoReport
}

/**
 * Why Send is disabled, and where to go about it.
 *
 * The server refuses an incomplete Gutachten outright, so the point of this is
 * that the assessor never meets that refusal: they are told what is short and
 * handed a link to each place before they click anything.
 */
function IncompleteNotice({ reportId, reportType, missingInfo }: IncompleteNoticeProps) {
	const t = useTranslations('report')
	const te = useTranslations('report.export')

	const shortTabs = TAB_ROUTES.filter((tab) => missingInfo.tabs[tab.key].missingCount > 0)
	if (shortTabs.length === 0) return null

	return (
		<div className="flex flex-col gap-3 rounded-card border border-warning-border bg-warning/10 p-5">
			<div className="flex items-start gap-2">
				<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-dark" />
				<div className="flex flex-col gap-0.5">
					<p className="text-body font-medium text-black">{te('incompleteTitle')}</p>
					<p className="text-body-sm text-text-secondary">
						{te('incompleteDescription', { count: missingInfo.missingCount })}
					</p>
				</div>
			</div>

			<ul className="flex flex-col gap-1">
				{shortTabs.map((tab) => (
					<li key={tab.key}>
						<Link
							href={`/reports/${reportId}/${tab.path}`}
							aria-label={te('goToSection', { section: tab.label(t, reportType) })}
							className="flex items-center justify-between rounded-md bg-white px-4 py-2.5 text-body-sm transition-colors hover:bg-grey-25"
						>
							<span className="font-medium text-black">{tab.label(t, reportType)}</span>
							<span className="flex items-center gap-1 text-warning-dark">
								{te('incompleteTabCount', { count: missingInfo.tabs[tab.key].missingCount })}
								<ChevronRight className="h-4 w-4" />
							</span>
						</Link>
					</li>
				))}
			</ul>
		</div>
	)
}

export { IncompleteNotice }
