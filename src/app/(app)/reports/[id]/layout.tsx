'use client'

import { type ReactNode } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { ImageIcon, FileText, Send } from 'lucide-react'
import { ReportSidebar } from '@/components/layout/report-sidebar'

const REPORT_SECTIONS = [
	{ key: 'gallery', label: 'Gallery', icon: ImageIcon },
	{ key: 'details', label: 'Report Details', icon: FileText },
	{ key: 'export', label: 'Export & Send', icon: Send },
]

function ReportLayout({ children }: { children: ReactNode }) {
	const params = useParams<{ id: string }>()
	const pathname = usePathname()
	const router = useRouter()

	const activeSection = REPORT_SECTIONS.find((s) =>
		pathname.includes(`/reports/${params.id}/${s.key}`),
	)?.key ?? 'gallery'

	function handleSectionChange(key: string) {
		router.push(`/reports/${params.id}/${key}`)
	}

	return (
		<div className="flex gap-6">
			<ReportSidebar
				sections={REPORT_SECTIONS}
				activeSection={activeSection}
				onSectionChange={handleSectionChange}
			/>
			<div className="flex-1 min-w-0">{children}</div>
		</div>
	)
}

export default ReportLayout
