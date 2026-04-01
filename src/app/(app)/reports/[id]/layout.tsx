'use client'

import { ChevronLeft, FileText, ImageIcon, Lock, Send, Sparkles } from 'lucide-react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { ReportSidebar } from '@/components/layout/report-sidebar'
import { Badge } from '@/components/ui/badge'
import { usePhotos } from '@/hooks/use-photos'
import { useReport } from '@/hooks/use-reports'

const REPORT_SECTIONS = [
	{ key: 'gallery', label: 'Gallery', icon: ImageIcon },
	{ key: 'details', label: 'Report Details', icon: FileText },
	{ key: 'export', label: 'Export & Send', icon: Send },
]

function ReportLayout({ children }: { children: ReactNode }) {
	const params = useParams<{ id: string }>()
	const pathname = usePathname()
	const router = useRouter()
	const { data: report } = useReport(params.id)
	const { data: photoData } = usePhotos(params.id)

	const activeSection =
		REPORT_SECTIONS.find((s) => pathname.includes(`/reports/${params.id}/${s.key}`))?.key ??
		'gallery'

	const isGallery = activeSection === 'gallery'
	const hasPhotos = (photoData?.photos?.length ?? 0) > 0
	const hasGenerated = !!report?.aiGenerationSummary

	// Gallery shows report sidebar only after report has been generated.
	// Before generation: gallery page renders its own instruction sidebar.
	// After generation: layout renders the report nav sidebar.
	const showReportSidebar = !isGallery || (isGallery && hasGenerated)

	// Title: "Upload Images" during upload phase, report title after
	const title =
		isGallery && !hasPhotos && !hasGenerated
			? 'Upload Images'
			: (report?.title ?? 'Create New Report')

	function handleSectionChange(key: string) {
		router.push(`/reports/${params.id}/${key}`)
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Top row: Go Back + Report title + action button */}
			<div className="flex items-center">
				<div className="w-[302px] shrink-0">
					<button
						type="button"
						onClick={() => router.push('/dashboard')}
						className="flex cursor-pointer items-center gap-1.5 text-input font-medium text-black hover:text-grey-100"
					>
						<div className="flex items-center justify-center rounded-[13.5px] bg-white p-1.5">
							<ChevronLeft className="h-3.5 w-3.5" />
						</div>
						Go Back
					</button>
				</div>
				<div className="flex flex-1 items-center gap-2">
					<h1 className="text-[34px] font-medium leading-none text-black">{title}</h1>
					{report?.reportType && <Badge variant="success">{report.reportType}</Badge>}
					{report?.isLocked && (
						<Badge variant="default">
							<Lock className="mr-1 h-3 w-3" />
							Locked
						</Badge>
					)}
				</div>
				{/* Generate Report button - shown on gallery page when photos exist */}
				{isGallery && (
					<button
						type="button"
						className="flex h-[50px] shrink-0 items-center gap-2.5 rounded-btn bg-primary px-3.5 text-input font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
						disabled={!hasPhotos}
						onClick={() => {
							window.dispatchEvent(new CustomEvent('generate-report'))
						}}
					>
						<Sparkles className="h-6 w-6" />
						Generate Report
					</button>
				)}
			</div>

			{report?.isLocked && (
				<div className="flex items-center gap-2 rounded-btn border border-warning bg-warning-light px-4 py-2.5 text-body-sm text-warning">
					<Lock className="h-4 w-4 shrink-0" />
					This report has been locked and is read-only. Unlock it from Export &amp; Send to make
					changes.
				</div>
			)}

			{/* Main content */}
			{showReportSidebar ? (
				<div className="flex items-start gap-6">
					<ReportSidebar
						sections={REPORT_SECTIONS}
						activeSection={activeSection}
						onSectionChange={handleSectionChange}
					/>
					<div className="min-w-0 flex-1">{children}</div>
				</div>
			) : (
				/* Gallery page owns its own layout (instruction sidebar + content) */
				<div className="min-w-0 flex-1">{children}</div>
			)}
		</div>
	)
}

export default ReportLayout
