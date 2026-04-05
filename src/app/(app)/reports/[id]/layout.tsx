'use client'

import { ChevronLeft, FileText, ImageIcon, Lock, Send, Sparkles } from 'lucide-react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { ReportSidebar } from '@/components/layout/report-sidebar'
import { Badge } from '@/components/ui/badge'
import { usePhotos } from '@/hooks/use-photos'
import { useReport } from '@/hooks/use-reports'

const REPORT_SECTIONS = [
	{ key: 'gallery', labelKey: 'sidebar.gallery', icon: ImageIcon },
	{ key: 'details', labelKey: 'sidebar.reportDetails', icon: FileText },
	{ key: 'export', labelKey: 'sidebar.exportAndSend', icon: Send },
] as const

function ReportLayout({ children }: { children: ReactNode }) {
	const t = useTranslations('report')
	const tc = useTranslations('common')
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
	const _hasGenerated = !!report?.aiGenerationSummary

	// Show report sidebar when user has photos (can navigate to details/export)
	// or when not on gallery page. Only hide on gallery with zero photos.
	const showReportSidebar = !isGallery || hasPhotos

	// Title: "Upload Images" only when gallery has no photos
	const title =
		isGallery && !hasPhotos
			? t('gallery.uploadPhotos')
			: (report?.title ?? t('gallery.uploadPhotos'))

	function handleSectionChange(key: string) {
		router.push(`/reports/${params.id}/${key}`)
	}

	return (
		<div className="flex flex-col gap-4 md:gap-6">
			{/* Top row: Go Back + Report title + action button */}
			<div className="flex flex-wrap items-center gap-3">
				<button
					type="button"
					onClick={() => router.push('/dashboard')}
					className="flex cursor-pointer items-center gap-1.5 text-body-sm font-medium text-black hover:text-grey-100 md:text-input"
				>
					<div className="flex items-center justify-center rounded-[13.5px] bg-white p-1.5">
						<ChevronLeft className="h-3.5 w-3.5" />
					</div>
					{tc('back')}
				</button>
				<div className="flex flex-1 flex-wrap items-center gap-2">
					<h1 className="text-h2 font-medium leading-none text-black md:text-[34px]">{title}</h1>
					{report?.reportType && <Badge variant="success">{report.reportType}</Badge>}
					{report?.isLocked && (
						<Badge variant="default">
							<Lock className="mr-1 h-3 w-3" />
							{t('export.lockReport')}
						</Badge>
					)}
				</div>
				{/* Generate Report button - shown on gallery page when photos exist */}
				{isGallery && (
					<button
						type="button"
						className="flex h-10 shrink-0 items-center gap-2 rounded-btn bg-primary px-3 text-body-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50 sm:h-12.5 sm:gap-2.5 sm:px-3.5 sm:text-input"
						disabled={!hasPhotos}
						onClick={() => {
							window.dispatchEvent(new CustomEvent('generate-report'))
						}}
					>
						<Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
						<span className="hidden sm:inline">{t('gallery.generateReport')}</span>
						<span className="sm:hidden">{t('gallery.generateReport')}</span>
					</button>
				)}
			</div>

			{report?.isLocked && (
				<div className="flex items-center gap-2 rounded-btn border border-warning bg-warning-light px-4 py-2.5 text-body-sm text-warning">
					<Lock className="h-4 w-4 shrink-0" />
					{t('sidebar.lockedMessage')}
				</div>
			)}

			{/* Main content */}
			{showReportSidebar ? (
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
					<ReportSidebar
						sections={REPORT_SECTIONS.map((s) => ({
							...s,
							label: t(s.labelKey),
						}))}
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
