'use client'

import { type ReactNode } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { TabBar } from '@/components/ui/tab-bar'

const DETAIL_TABS = [
	{ key: 'accident-info', label: 'Accident Info' },
	{ key: 'vehicle', label: 'Vehicle' },
	{ key: 'condition', label: 'Condition' },
	{ key: 'calculation', label: 'Calculation' },
	{ key: 'invoice', label: 'Invoice' },
]

function DetailsLayout({ children }: { children: ReactNode }) {
	const params = useParams<{ id: string }>()
	const pathname = usePathname()
	const router = useRouter()

	const activeTab =
		DETAIL_TABS.find((t) => pathname.endsWith(`/${t.key}`))?.key ?? 'accident-info'

	function handleTabChange(key: string) {
		router.push(`/reports/${params.id}/details/${key}`)
	}

	return (
		<div className="flex flex-col gap-6">
			<TabBar
				tabs={DETAIL_TABS}
				activeTab={activeTab}
				onTabChange={handleTabChange}
			/>
			{children}
		</div>
	)
}

export default DetailsLayout
