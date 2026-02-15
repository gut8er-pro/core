import {
	useQuery,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'
import type { ReportListParams } from '@/lib/validations/reports'

type Report = {
	id: string
	userId: string
	title: string
	status: 'DRAFT' | 'COMPLETED' | 'SENT' | 'LOCKED'
	completionPercentage: number
	isLocked: boolean
	createdAt: string
	updatedAt: string
	_count: { photos: number }
}

type ReportListResponse = {
	reports: Report[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
	}
}

async function fetchReports(params: Partial<ReportListParams> = {}): Promise<ReportListResponse> {
	const searchParams = new URLSearchParams()
	if (params.page) searchParams.set('page', String(params.page))
	if (params.limit) searchParams.set('limit', String(params.limit))
	if (params.status) searchParams.set('status', params.status)
	if (params.sortBy) searchParams.set('sortBy', params.sortBy)
	if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

	const response = await fetch(`/api/reports?${searchParams.toString()}`)
	if (!response.ok) {
		throw new Error('Failed to fetch reports')
	}
	return response.json()
}

async function createReport(title: string): Promise<{ report: Report }> {
	const response = await fetch('/api/reports', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ title }),
	})
	if (!response.ok) {
		throw new Error('Failed to create report')
	}
	return response.json()
}

async function deleteReport(id: string): Promise<void> {
	const response = await fetch(`/api/reports/${id}`, {
		method: 'DELETE',
	})
	if (!response.ok) {
		throw new Error('Failed to delete report')
	}
}

function useReports(params: Partial<ReportListParams> = {}) {
	return useQuery({
		queryKey: ['reports', params],
		queryFn: () => fetchReports(params),
	})
}

function useCreateReport() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: createReport,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reports'] })
		},
	})
}

function useDeleteReport() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: deleteReport,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reports'] })
		},
	})
}

export { useReports, useCreateReport, useDeleteReport, fetchReports }
export type { Report, ReportListResponse }
