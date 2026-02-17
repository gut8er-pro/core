'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Eye, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LicensePlate } from '@/components/ui/license-plate'
import { CarBrandLogo } from '@/components/ui/car-brand-logo'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import type { Report } from '@/hooks/use-reports'

type ReportTableProps = {
	reports: Report[]
	onDelete: (id: string) => void
	isDeleting?: boolean
}

const AVATAR_COLORS = [
	'bg-primary',
	'bg-[#6366F1]',
	'bg-[#F59E0B]',
	'bg-[#EF4444]',
	'bg-[#8B5CF6]',
	'bg-[#EC4899]',
	'bg-[#14B8A6]',
	'bg-[#F97316]',
]

function getAvatarColor(name: string): string {
	let hash = 0
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash)
	}
	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? 'bg-primary'
}

function getInitials(name: string): string {
	return name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2)
}

function formatDateGerman(dateStr: string): string {
	const date = new Date(dateStr)
	const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
	const day = days[date.getDay()]
	const dd = String(date.getDate()).padStart(2, '0')
	const mm = String(date.getMonth() + 1).padStart(2, '0')
	const yyyy = date.getFullYear()
	return `${day}, ${dd}.${mm}.${yyyy}`
}

function generateReportNumber(id: string): string {
	const hash = id.replace(/-/g, '').slice(0, 6).toUpperCase()
	return `GH-${hash.slice(0, 3)}-${hash.slice(3, 5)}`
}

function ReportTable({ reports, onDelete, isDeleting }: ReportTableProps) {
	const router = useRouter()

	return (
		<div className="overflow-hidden rounded-lg border border-border bg-white">
			<table className="w-full">
				<thead>
					<tr className="border-b border-border">
						<th className="px-6 py-3 text-left">
							<span className="flex items-center gap-1 text-caption font-medium text-grey-100">
								Report
								<ChevronDown className="h-3 w-3" />
							</span>
						</th>
						<th className="hidden px-6 py-3 text-left md:table-cell">
							<span className="flex items-center gap-1 text-caption font-medium text-grey-100">
								Report Number
								<ChevronDown className="h-3 w-3" />
							</span>
						</th>
						<th className="hidden px-6 py-3 text-left lg:table-cell">
							<span className="flex items-center gap-1 text-caption font-medium text-grey-100">
								Plate Number
								<ChevronDown className="h-3 w-3" />
							</span>
						</th>
						<th className="hidden px-6 py-3 text-left md:table-cell">
							<span className="flex items-center gap-1 text-caption font-medium text-grey-100">
								Date Created
								<ChevronDown className="h-3 w-3" />
							</span>
						</th>
						<th className="hidden px-6 py-3 text-left lg:table-cell">
							<span className="flex items-center gap-1 text-caption font-medium text-grey-100">
								Car Model
								<ChevronDown className="h-3 w-3" />
							</span>
						</th>
						<th className="w-12 px-2 py-3" />
					</tr>
				</thead>
				<tbody>
					{reports.map((report) => (
						<ReportRow
							key={report.id}
							report={report}
							onOpen={() => router.push(`/reports/${report.id}/gallery`)}
							onEdit={() => router.push(`/reports/${report.id}/gallery`)}
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
	onEdit,
	onDelete,
	isDeleting,
}: {
	report: Report
	onOpen: () => void
	onEdit: () => void
	onDelete: () => void
	isDeleting?: boolean
}) {
	const [showActions, setShowActions] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)

	const displayName = report.claimantName || report.title
	const reportNumber = generateReportNumber(report.id)
	const plateNumber = report.plateNumber
	const carModel = [report.vehicleMake, report.vehicleModel].filter(Boolean).join(' - ') || null

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setShowActions(false)
			}
		}
		if (showActions) {
			document.addEventListener('mousedown', handleClickOutside)
		}
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [showActions])

	return (
		<tr
			className="cursor-pointer border-b border-border last:border-b-0 transition-colors hover:bg-grey-25"
			onClick={onOpen}
		>
			{/* Report (Avatar + Name) */}
			<td className="px-6 py-3">
				<div className="flex items-center gap-3">
					<Avatar className="h-[42px] w-[42px]">
						<AvatarFallback className={getAvatarColor(displayName)}>
							{getInitials(displayName)}
						</AvatarFallback>
					</Avatar>
					<span className="text-body-sm font-medium text-black">{displayName}</span>
				</div>
			</td>

			{/* Report Number */}
			<td className="hidden px-6 py-3 md:table-cell">
				<span className="text-body-sm text-grey-100">{reportNumber}</span>
			</td>

			{/* Plate Number */}
			<td className="hidden px-6 py-3 lg:table-cell">
				{plateNumber ? (
					<LicensePlate plate={plateNumber} className="text-xs" />
				) : (
					<span className="text-body-sm text-grey-100">--</span>
				)}
			</td>

			{/* Date Created */}
			<td className="hidden px-6 py-3 md:table-cell">
				<span className="text-body-sm text-grey-100">
					{formatDateGerman(report.createdAt)}
				</span>
			</td>

			{/* Car Model */}
			<td className="hidden px-6 py-3 lg:table-cell">
				{carModel ? (
					<div className="flex items-center gap-2">
						<CarBrandLogo make={report.vehicleMake ?? ''} />
						<span className="text-body-sm text-black">{carModel}</span>
					</div>
				) : (
					<span className="text-body-sm text-grey-100">--</span>
				)}
			</td>

			{/* Actions */}
			<td className="px-2 py-3">
				<div ref={menuRef} className="relative">
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
						<div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-border bg-white py-1 shadow-dropdown">
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									onOpen()
									setShowActions(false)
								}}
								className="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-body-sm text-black hover:bg-grey-25"
							>
								<Eye className="h-4 w-4 text-grey-100" />
								Details
							</button>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									onEdit()
									setShowActions(false)
								}}
								className="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-body-sm text-black hover:bg-grey-25"
							>
								<Pencil className="h-4 w-4 text-grey-100" />
								Edit Report
							</button>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									onDelete()
									setShowActions(false)
								}}
								disabled={isDeleting}
								className="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-body-sm text-error hover:bg-error-light"
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

export { ReportTable, EmptyState, Pagination }
export type { ReportTableProps }
