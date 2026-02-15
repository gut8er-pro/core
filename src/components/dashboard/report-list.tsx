'use client'

import { formatDistanceToNow } from 'date-fns'
import { FileText, MoreVertical, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CompletionBadge } from '@/components/ui/completion-badge'
import { cn } from '@/lib/utils'
import type { Report } from '@/hooks/use-reports'

type ReportListProps = {
	reports: Report[]
	onDelete: (id: string) => void
	isDeleting?: boolean
}

const STATUS_BADGE_MAP: Record<Report['status'], { label: string; variant: 'primary' | 'success' | 'warning' | 'info' }> = {
	DRAFT: { label: 'Draft', variant: 'primary' },
	COMPLETED: { label: 'Completed', variant: 'success' },
	SENT: { label: 'Sent', variant: 'info' },
	LOCKED: { label: 'Locked', variant: 'warning' },
}

function ReportList({ reports, onDelete, isDeleting }: ReportListProps) {
	const router = useRouter()

	if (reports.length === 0) {
		return <EmptyState />
	}

	return (
		<div className="rounded-lg border border-border bg-white">
			<table className="w-full">
				<thead>
					<tr className="border-b border-border bg-surface-secondary">
						<th className="px-6 py-2 text-left text-caption font-semibold uppercase text-grey-100">
							Report
						</th>
						<th className="hidden px-6 py-2 text-left text-caption font-semibold uppercase text-grey-100 md:table-cell">
							Status
						</th>
						<th className="hidden px-6 py-2 text-left text-caption font-semibold uppercase text-grey-100 lg:table-cell">
							Photos
						</th>
						<th className="hidden px-6 py-2 text-left text-caption font-semibold uppercase text-grey-100 md:table-cell">
							Completion
						</th>
						<th className="px-6 py-2 text-left text-caption font-semibold uppercase text-grey-100">
							Updated
						</th>
						<th className="w-12 px-2 py-2" />
					</tr>
				</thead>
				<tbody>
					{reports.map((report) => (
						<ReportRow
							key={report.id}
							report={report}
							onOpen={() => router.push(`/reports/${report.id}/gallery`)}
							onDelete={() => onDelete(report.id)}
							isDeleting={isDeleting}
						/>
					))}
				</tbody>
			</table>
		</div>
	)
}

function ReportRow({
	report,
	onOpen,
	onDelete,
	isDeleting,
}: {
	report: Report
	onOpen: () => void
	onDelete: () => void
	isDeleting?: boolean
}) {
	const [showActions, setShowActions] = useState(false)
	const statusConfig = STATUS_BADGE_MAP[report.status]
	const updatedAt = formatDistanceToNow(new Date(report.updatedAt), { addSuffix: true })

	return (
		<tr
			className="cursor-pointer border-b border-border last:border-b-0 transition-colors hover:bg-grey-25"
			onClick={onOpen}
		>
			<td className="px-6 py-4">
				<div className="flex items-center gap-2">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
						<FileText className="h-5 w-5 text-primary" />
					</div>
					<div className="min-w-0">
						<p className="truncate text-body-sm font-medium text-black">{report.title}</p>
						<span className="text-caption text-grey-100 md:hidden">
							<Badge variant={statusConfig.variant} className="mr-1">
								{statusConfig.label}
							</Badge>
							{updatedAt}
						</span>
					</div>
				</div>
			</td>
			<td className="hidden px-6 py-4 md:table-cell">
				<Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
			</td>
			<td className="hidden px-6 py-4 lg:table-cell">
				<span className="text-body-sm text-grey-100">{report._count.photos}</span>
			</td>
			<td className="hidden px-6 py-4 md:table-cell">
				<CompletionBadge percentage={report.completionPercentage} />
			</td>
			<td className="px-6 py-4">
				<span className="text-body-sm text-grey-100">{updatedAt}</span>
			</td>
			<td className="px-2 py-4">
				<div className="relative">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation()
							setShowActions(!showActions)
						}}
						className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-grey-100 hover:bg-grey-25 hover:text-black"
						aria-label="Report actions"
					>
						<MoreVertical className="h-4 w-4" />
					</button>
					{showActions && (
						<div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-border bg-white py-1 shadow-dropdown">
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									onDelete()
									setShowActions(false)
								}}
								disabled={isDeleting}
								className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-body-sm text-error hover:bg-error-light"
							>
								<Trash2 className="h-4 w-4" />
								Delete
							</button>
						</div>
					)}
				</div>
			</td>
		</tr>
	)
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-white px-6 py-12 text-center">
			<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
				<FileText className="h-8 w-8 text-primary" />
			</div>
			<h3 className="mb-1 text-h4 font-semibold text-black">No reports yet</h3>
			<p className="mb-6 text-body-sm text-grey-100">
				Create your first report to get started with vehicle assessments.
			</p>
		</div>
	)
}

function Pagination({
	page,
	totalPages,
	onPageChange,
}: {
	page: number
	totalPages: number
	onPageChange: (page: number) => void
}) {
	if (totalPages <= 1) return null

	return (
		<div className="flex items-center justify-between px-6 py-4">
			<p className="text-body-sm text-grey-100">
				Page {page} of {totalPages}
			</p>
			<div className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={page <= 1}
					onClick={() => onPageChange(page - 1)}
				>
					Previous
				</Button>
				<Button
					variant="outline"
					size="sm"
					disabled={page >= totalPages}
					onClick={() => onPageChange(page + 1)}
				>
					Next
				</Button>
			</div>
		</div>
	)
}

export { ReportList, Pagination, EmptyState }
export type { ReportListProps }
