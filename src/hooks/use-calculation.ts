import {
	useQuery,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'
import type {
	CalculationInput,
	AdditionalCostInput,
} from '@/lib/validations/calculation'

type CalculationResponse = {
	calculation: {
		id: string
		reportId: string
		replacementValue: number | null
		taxRate: string | null
		residualValue: number | null
		diminutionInValue: number | null
		wheelAlignment: string | null
		bodyMeasurements: string | null
		bodyPaint: string | null
		plasticRepair: boolean
		repairMethod: string | null
		risks: string | null
		damageClass: string | null
		dropoutGroup: string | null
		costPerDay: number | null
		rentalCarClass: string | null
		repairTimeDays: number | null
		replacementTimeDays: number | null
	} | null
	additionalCosts: Array<{
		id: string
		calculationId: string
		description: string
		amount: number
	}>
}

async function fetchCalculation(reportId: string): Promise<CalculationResponse> {
	const response = await fetch(`/api/reports/${reportId}/calculation`)
	if (!response.ok) {
		throw new Error('Failed to fetch calculation data')
	}
	return response.json()
}

async function patchCalculationSection(
	reportId: string,
	data: Record<string, unknown>,
): Promise<unknown> {
	const response = await fetch(`/api/reports/${reportId}/calculation`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})
	if (!response.ok) {
		throw new Error('Failed to save calculation data')
	}
	return response.json()
}

function useCalculation(reportId: string) {
	return useQuery({
		queryKey: ['report', reportId, 'calculation'],
		queryFn: () => fetchCalculation(reportId),
		enabled: !!reportId,
		staleTime: 30_000,
		refetchOnMount: 'always',
	})
}

function useSaveCalculation(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: CalculationInput) =>
			patchCalculationSection(reportId, { calculation: data }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'calculation'],
			})
		},
	})
}

function useSaveAdditionalCost(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: AdditionalCostInput | AdditionalCostInput[]) =>
			patchCalculationSection(reportId, {
				additionalCosts: Array.isArray(data) ? data : [data],
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'calculation'],
			})
		},
	})
}

function useDeleteAdditionalCost(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (costId: string) =>
			patchCalculationSection(reportId, {
				deleteAdditionalCostIds: [costId],
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'calculation'],
			})
		},
	})
}

export {
	useCalculation,
	useSaveCalculation,
	useSaveAdditionalCost,
	useDeleteAdditionalCost,
	fetchCalculation,
}
export type { CalculationResponse }
