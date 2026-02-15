import {
	useQuery,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'
import type {
	InvoiceInput,
	LineItemInput,
} from '@/lib/validations/invoice'

type InvoiceResponse = {
	invoice: {
		id: string
		reportId: string
		invoiceNumber: string | null
		date: string | null
		recipientId: string | null
		payoutDelay: number | null
		eInvoice: boolean
		feeSchedule: string
		totalNet: number
		totalGross: number
		taxRate: number
	} | null
	lineItems: Array<{
		id: string
		invoiceId: string
		description: string
		specialFeature: string | null
		isLumpSum: boolean
		rate: number
		amount: number
		quantity: number
		perUnit: number | null
		order: number
	}>
}

async function fetchInvoice(reportId: string): Promise<InvoiceResponse> {
	const response = await fetch(`/api/reports/${reportId}/invoice`)
	if (!response.ok) {
		throw new Error('Failed to fetch invoice data')
	}
	return response.json()
}

async function patchInvoiceSection(
	reportId: string,
	data: Record<string, unknown>,
): Promise<unknown> {
	const response = await fetch(`/api/reports/${reportId}/invoice`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})
	if (!response.ok) {
		throw new Error('Failed to save invoice data')
	}
	return response.json()
}

function useInvoice(reportId: string) {
	return useQuery({
		queryKey: ['report', reportId, 'invoice'],
		queryFn: () => fetchInvoice(reportId),
		enabled: !!reportId,
	})
}

function useSaveInvoice(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: InvoiceInput) =>
			patchInvoiceSection(reportId, { invoice: data }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'invoice'],
			})
		},
	})
}

function useSaveLineItem(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: LineItemInput | LineItemInput[]) =>
			patchInvoiceSection(reportId, {
				lineItems: Array.isArray(data) ? data : [data],
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'invoice'],
			})
		},
	})
}

function useDeleteLineItem(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (lineItemId: string) =>
			patchInvoiceSection(reportId, {
				deleteLineItemIds: [lineItemId],
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'invoice'],
			})
		},
	})
}

export {
	useInvoice,
	useSaveInvoice,
	useSaveLineItem,
	useDeleteLineItem,
	fetchInvoice,
}
export type { InvoiceResponse }
