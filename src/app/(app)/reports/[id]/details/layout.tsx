'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { type ReactNode, useState } from 'react'
import { TabBar } from '@/components/ui/tab-bar'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { useReport } from '@/hooks/use-reports'
import { useTabCompletion } from '@/hooks/use-tab-completion'

function DetailsLayout({ children }: { children: ReactNode }) {
	const params = useParams<{ id: string }>()
	const pathname = usePathname()
	const router = useRouter()
	const [showMissing, setShowMissing] = useState(false)
	const { data: report } = useReport(params.id)

	const reportType = report?.reportType
	const isOT = reportType === 'OT'
	const isBEorOT = reportType === 'BE' || reportType === 'OT'

	const firstTabLabel = isOT ? 'Customer' : 'Accident Info'
	const calcTabLabel = isBEorOT ? 'Valuation' : 'Calculation'

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
			label: 'Vehicle',
			isComplete: completion.vehicle.isComplete,
			completion: completion.vehicle.isComplete ? undefined : fmt(completion.vehicle),
		},
		{
			key: 'condition',
			label: 'Condition',
			isComplete: completion.condition.isComplete,
			completion: completion.condition.isComplete ? undefined : fmt(completion.condition),
		},
		{
			key: 'calculation',
			label: calcTabLabel,
			isComplete: completion.calculation.isComplete,
			completion: completion.calculation.isComplete ? undefined : fmt(completion.calculation),
		},
		{
			key: 'invoice',
			label: 'Invoice',
			isComplete: completion.invoice.isComplete,
			completion: completion.invoice.isComplete ? undefined : fmt(completion.invoice),
		},
	]

	const activeTab = DETAIL_TABS.find((t) => pathname.endsWith(`/${t.key}`))?.key ?? 'accident-info'

	const totalMissing =
		completion.accidentInfo.total -
		completion.accidentInfo.filled +
		(completion.vehicle.total - completion.vehicle.filled) +
		(completion.condition.total - completion.condition.filled) +
		(completion.calculation.total - completion.calculation.filled) +
		(completion.invoice.total - completion.invoice.filled)

	function handleTabChange(key: string) {
		router.push(`/reports/${params.id}/details/${key}`)
	}

	return (
		<div className="flex flex-col gap-4">
			<TabBar tabs={DETAIL_TABS} activeTab={activeTab} onTabChange={handleTabChange} />

			{/* Show missing information banner */}
			<div className="flex items-center justify-between rounded-xl bg-white px-5 py-3.5">
				<div className="flex flex-col gap-0.5">
					<p className="text-body font-medium text-black">Show missing information</p>
					<p className="text-body-sm text-grey-100">
						{showMissing
							? 'Highlighting empty fields'
							: totalMissing > 0
								? `${totalMissing} sections need attention`
								: 'All sections completed'}
					</p>
				</div>
				<ToggleSwitch label="" checked={showMissing} onCheckedChange={setShowMissing} />
			</div>

			{children}
		</div>
	)
}

export default DetailsLayout
