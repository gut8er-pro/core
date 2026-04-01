'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { type ReactNode, useState } from 'react'
import { TabBar } from '@/components/ui/tab-bar'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { useReport } from '@/hooks/use-reports'

function DetailsLayout({ children }: { children: ReactNode }) {
	const params = useParams<{ id: string }>()
	const pathname = usePathname()
	const router = useRouter()
	const [showMissing, setShowMissing] = useState(false)
	const { data: report } = useReport(params.id)

	const calculationLabel = report?.reportType === 'BE' ? 'Valuation' : 'Calculation'

	// TODO: Wire real completion counts from report data
	const DETAIL_TABS = [
		{ key: 'accident-info', label: 'Accident Info', isComplete: false, completion: undefined },
		{ key: 'vehicle', label: 'Vehicle', isComplete: false, completion: '0/4' },
		{ key: 'condition', label: 'Condition', isComplete: false, completion: '0/12' },
		{ key: 'calculation', label: calculationLabel, isComplete: false, completion: '0/15' },
		{ key: 'invoice', label: 'Invoice', isComplete: false, completion: undefined },
	]

	const activeTab = DETAIL_TABS.find((t) => pathname.endsWith(`/${t.key}`))?.key ?? 'accident-info'

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
						{showMissing ? 'Highlighting empty fields' : 'X fields need attention'}
					</p>
				</div>
				<ToggleSwitch label="" checked={showMissing} onCheckedChange={setShowMissing} />
			</div>

			{children}
		</div>
	)
}

export default DetailsLayout
