'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useReports, useCreateReport, useDeleteReport } from '@/hooks/use-reports'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { ReportList, Pagination } from '@/components/dashboard/report-list'

function DashboardPage() {
	const [page, setPage] = useState(1)
	const { data, isLoading, error } = useReports({ page, limit: 10 })
	const createReport = useCreateReport()
	const deleteReport = useDeleteReport()
	const toast = useToast()

	function handleCreateReport() {
		createReport.mutate('Untitled Report', {
			onSuccess: () => {
				toast.success('Report created successfully')
			},
			onError: () => {
				toast.error('Failed to create report. Please try again.')
			},
		})
	}

	function handleDeleteReport(id: string) {
		deleteReport.mutate(id, {
			onSuccess: () => {
				toast.success('Report deleted successfully')
			},
			onError: () => {
				toast.error('Failed to delete report. Please try again.')
			},
		})
	}

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-h2 font-bold text-black">Reports</h1>
					<p className="text-body-sm text-grey-100">
						{data?.pagination.total
							? `${data.pagination.total} report${data.pagination.total === 1 ? '' : 's'}`
							: 'Manage your vehicle assessment reports'}
					</p>
				</div>
				<Button
					onClick={handleCreateReport}
					loading={createReport.isPending}
					icon={<Plus className="h-4 w-4" />}
				>
					New Report
				</Button>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-grey-25 border-t-primary" />
				</div>
			) : error ? (
				<div className="rounded-lg border border-error bg-error-light px-6 py-4 text-body-sm text-error">
					Failed to load reports. Please try again.
				</div>
			) : (
				<>
					<ReportList
						reports={data?.reports ?? []}
						onDelete={handleDeleteReport}
						isDeleting={deleteReport.isPending}
					/>
					{data?.pagination && (
						<Pagination
							page={data.pagination.page}
							totalPages={data.pagination.totalPages}
							onPageChange={setPage}
						/>
					)}
				</>
			)}
		</div>
	)
}

export default DashboardPage
