'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { MissingInfoProvider, useMissingInfoToggle } from '@/components/report/missing-info'
import { TabBar } from '@/components/ui/tab-bar'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { useMissingInfo } from '@/hooks/use-missing-info'
import { useReport } from '@/hooks/use-reports'
import { useTabCompletion } from '@/hooks/use-tab-completion'

/**
 * Report-wide gap count plus the review toggle. The count covers the whole
 * report, not the tab on screen, so the assessor knows whether they are done
 * overall rather than merely done here.
 */
function MissingInfoBanner({ missingCount }: { missingCount: number }) {
	const t = useTranslations('report')
	const { showMissing, setShowMissing } = useMissingInfoToggle()

	const description =
		missingCount === 0
			? t('details.allCompleted')
			: showMissing
				? t('details.highlightingMissing', { count: missingCount })
				: t('details.fieldsMissing', { count: missingCount })

	return (
		<div className="flex items-center justify-between rounded-xl bg-white px-5 py-3.5">
			<div className="flex flex-col gap-0.5">
				<p className="text-body font-medium text-black">{t('details.showMissing')}</p>
				<p className="text-body-sm text-grey-100">{description}</p>
			</div>
			<ToggleSwitch
				id="show-missing-toggle"
				aria-label={t('details.showMissing')}
				label=""
				checked={showMissing}
				onCheckedChange={setShowMissing}
			/>
		</div>
	)
}

function DetailsLayout({ children }: { children: ReactNode }) {
	const t = useTranslations('report')
	const params = useParams<{ id: string }>()
	const pathname = usePathname()
	const router = useRouter()
	const { data: report } = useReport(params.id)

	const reportType = report?.reportType
	const isOT = reportType === 'OT'
	const isBEorOT = reportType === 'BE' || reportType === 'OT'

	const firstTabLabel = isOT ? t('accidentInfo.clientInformation') : t('accidentInfo.title')
	const calcTabLabel = isBEorOT ? t('calculation.valuationTab') : t('calculation.title')

	const missingInfo = useMissingInfo(params.id, reportType ?? undefined)
	const completion = useTabCompletion(params.id, reportType ?? undefined)

	const fmt = (c: { filled: number; total: number }) => `${c.filled}/${c.total}`

	const DETAIL_TABS = [
		{
			key: 'accident-info',
			label: firstTabLabel,
			isComplete: completion.accidentInfo.isComplete,
			completion: completion.accidentInfo.isComplete ? undefined : fmt(completion.accidentInfo),
		},
		{
			key: 'vehicle',
			label: t('vehicle.title'),
			isComplete: completion.vehicle.isComplete,
			completion: completion.vehicle.isComplete ? undefined : fmt(completion.vehicle),
		},
		{
			key: 'condition',
			label: t('condition.title'),
			isComplete: completion.condition.isComplete,
			completion: completion.condition.isComplete ? undefined : fmt(completion.condition),
		},
		// An Oldtimer is argued from its grade, so the grading gets a tab of its
		// own between the condition it summarises and the valuation it feeds.
		...(isOT
			? [
					{
						key: 'grading',
						label: t('condition.vehicleGrading.title'),
						isComplete: completion.grading.isComplete,
						completion: completion.grading.isComplete ? undefined : fmt(completion.grading),
					},
				]
			: []),
		{
			key: 'calculation',
			label: calcTabLabel,
			isComplete: completion.calculation.isComplete,
			completion: completion.calculation.isComplete ? undefined : fmt(completion.calculation),
		},
		{
			key: 'invoice',
			label: t('invoice.title'),
			isComplete: completion.invoice.isComplete,
			completion: completion.invoice.isComplete ? undefined : fmt(completion.invoice),
		},
	]

	const activeTab =
		DETAIL_TABS.find((tab) => pathname.endsWith(`/${tab.key}`))?.key ?? 'accident-info'

	function handleTabChange(key: string) {
		router.push(`/reports/${params.id}/details/${key}`)
	}

	return (
		<MissingInfoProvider>
			<div className="flex flex-col gap-4">
				<TabBar tabs={DETAIL_TABS} activeTab={activeTab} onTabChange={handleTabChange} />

				{/* Hidden on a sent report — gaps nobody can edit are just noise. */}
				{!report?.isLocked && <MissingInfoBanner missingCount={missingInfo.missingCount} />}

				{children}
			</div>
		</MissingInfoProvider>
	)
}

export default DetailsLayout
