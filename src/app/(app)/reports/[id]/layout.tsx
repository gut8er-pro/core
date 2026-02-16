'use client'

import { type ReactNode } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, ImageIcon, FileText, Send } from 'lucide-react'
import { ReportSidebar } from '@/components/layout/report-sidebar'
import { Badge } from '@/components/ui/badge'

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
		<div className="flex flex-col gap-4">
			{/* Top row: Go Back + Report title */}
			<div className="flex items-start gap-6">
				<div className="w-52 shrink-0">
					<button
						type="button"
						onClick={() => router.push('/dashboard')}
						className="flex cursor-pointer items-center gap-1 text-body-sm font-medium text-black hover:text-grey-100"
					>
						<ChevronLeft className="h-4 w-4" />
						Go Back
					</button>
				</div>
				<div className="flex items-center gap-2">
					<h1 className="text-h2 font-bold text-black">Create New Report</h1>
					<Badge variant="success">KG</Badge>
				</div>
			</div>

			{/* Main content: Sidebar + Page */}
			<div className="flex gap-6">
				<ReportSidebar
					sections={REPORT_SECTIONS}
					activeSection={activeSection}
					onSectionChange={handleSectionChange}
				/>
				<div className="min-w-0 flex-1">{children}</div>
			</div>
		</div>
	)
}

export default ReportLayout
