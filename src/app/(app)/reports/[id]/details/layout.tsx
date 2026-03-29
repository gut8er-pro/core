'use client'

import { type ReactNode, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
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

	const DETAIL_TABS = [
		{ key: 'accident-info', label: 'Accident Info' },
		{ key: 'vehicle', label: 'Vehicle' },
		{ key: 'condition', label: 'Condition' },
		{ key: 'calculation', label: calculationLabel },
		{ key: 'invoice', label: 'Invoice' },
	]

	const activeTab =
		DETAIL_TABS.find((t) => pathname.endsWith(`/${t.key}`))?.key ?? 'accident-info'

	function handleTabChange(key: string) {
		router.push(`/reports/${params.id}/details/${key}`)
	}

	return (
		<div className="flex flex-col gap-4">
			<TabBar
				tabs={DETAIL_TABS}
				activeTab={activeTab}
				onTabChange={handleTabChange}
			/>

			{/* Show missing information toggle */}
			<div className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
				<div>
					<p className="text-body-sm font-medium text-black">Show missing information</p>
					<p className="text-caption text-grey-100">
						{showMissing ? 'Highlighting missing fields' : 'X fields need attention'}
					</p>
				</div>
				<ToggleSwitch
					label=""
					checked={showMissing}
					onCheckedChange={setShowMissing}
				/>
			</div>

			{children}
		</div>
	)
}

export default DetailsLayout
