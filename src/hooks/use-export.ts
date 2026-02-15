import {
	useQuery,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'

type ExportConfigResponse = {
	id: string
	reportId: string
	includeValuation: boolean
	includeCommission: boolean
	includeInvoice: boolean
	lockReport: boolean
	recipientEmail: string | null
	recipientName: string | null
	emailSubject: string | null
	emailBody: string | null
}

type SendReportResponse = {
	success: boolean
	message: string
	reportLocked: boolean
}

async function fetchExportConfig(reportId: string): Promise<ExportConfigResponse> {
	const response = await fetch(`/api/reports/${reportId}/export`)
	if (!response.ok) {
		throw new Error('Failed to fetch export config')
	}
	return response.json()
}

async function patchExportConfig(
	reportId: string,
	data: Record<string, unknown>,
): Promise<ExportConfigResponse> {
	const response = await fetch(`/api/reports/${reportId}/export`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})
	if (!response.ok) {
		throw new Error('Failed to save export config')
	}
	return response.json()
}

async function sendReport(
	reportId: string,
	data: Record<string, unknown>,
): Promise<SendReportResponse> {
	const response = await fetch(`/api/reports/${reportId}/send`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})
	if (!response.ok) {
		const errorBody = await response.json().catch(() => ({}))
		throw new Error(
			(errorBody as { error?: string }).error ?? 'Failed to send report',
		)
	}
	return response.json()
}

function useExportConfig(reportId: string) {
	return useQuery({
		queryKey: ['report', reportId, 'export'],
		queryFn: () => fetchExportConfig(reportId),
		enabled: !!reportId,
	})
}

function useSaveExportConfig(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: Record<string, unknown>) =>
			patchExportConfig(reportId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'export'],
			})
		},
	})
}

function useSendReport(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: Record<string, unknown>) =>
			sendReport(reportId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId],
			})
		},
	})
}

export {
	useExportConfig,
	useSaveExportConfig,
	useSendReport,
	fetchExportConfig,
}
export type { ExportConfigResponse, SendReportResponse }
