import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MissingInfoReport } from '@/lib/completeness'

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

/**
 * The server refused to send because the report is incomplete.
 *
 * Its own type because the client handles it differently from a failure: there
 * is nothing to retry until the assessor fills something in, and the structured
 * breakdown is what tells them where.
 */
class IncompleteReportError extends Error {
	readonly missingInfo: MissingInfoReport

	constructor(missingInfo: MissingInfoReport) {
		super('Report is incomplete')
		this.name = 'IncompleteReportError'
		this.missingInfo = missingInfo
	}
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
		const errorBody = (await response.json().catch(() => ({}))) as {
			error?: string
			missingInfo?: MissingInfoReport
		}
		// The gate answers with the breakdown, not a message — the count means
		// nothing to the assessor without the locations.
		if (response.status === 422 && errorBody.missingInfo) {
			throw new IncompleteReportError(errorBody.missingInfo)
		}
		throw new Error(errorBody.error ?? 'Failed to send report')
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
		mutationFn: (data: Record<string, unknown>) => patchExportConfig(reportId, data),
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
		mutationFn: (data: Record<string, unknown>) => sendReport(reportId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId],
			})
		},
	})
}

export type { ExportConfigResponse, SendReportResponse }
export {
	fetchExportConfig,
	IncompleteReportError,
	useExportConfig,
	useSaveExportConfig,
	useSendReport,
}
