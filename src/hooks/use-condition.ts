import {
	useQuery,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'
import type { ConditionResponse } from '@/components/report/condition/types'
import type {
	ConditionInput,
	DamageMarkerInput,
	PaintMarkerInput,
	TireSetInput,
} from '@/lib/validations/condition'

async function fetchCondition(reportId: string): Promise<ConditionResponse> {
	const response = await fetch(`/api/reports/${reportId}/condition`)
	if (!response.ok) {
		throw new Error('Failed to fetch condition data')
	}
	return response.json()
}

async function patchConditionSection(
	reportId: string,
	data: Record<string, unknown>,
): Promise<unknown> {
	const response = await fetch(`/api/reports/${reportId}/condition`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})
	if (!response.ok) {
		throw new Error('Failed to save condition data')
	}
	return response.json()
}

function useCondition(reportId: string) {
	return useQuery({
		queryKey: ['report', reportId, 'condition'],
		queryFn: () => fetchCondition(reportId),
		enabled: !!reportId,
		staleTime: 30_000,
		refetchOnMount: 'always',
	})
}

function useSaveCondition(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: ConditionInput) =>
			patchConditionSection(reportId, { condition: data }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'condition'],
			})
		},
	})
}

function useSaveDamageMarker(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: DamageMarkerInput | DamageMarkerInput[]) =>
			patchConditionSection(reportId, {
				damageMarkers: Array.isArray(data) ? data : [data],
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'condition'],
			})
		},
	})
}

function useDeleteDamageMarker(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (markerId: string) =>
			patchConditionSection(reportId, {
				deleteDamageMarkerIds: [markerId],
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'condition'],
			})
		},
	})
}

function useSavePaintMarker(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: PaintMarkerInput | PaintMarkerInput[]) =>
			patchConditionSection(reportId, {
				paintMarkers: Array.isArray(data) ? data : [data],
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'condition'],
			})
		},
	})
}

function useSaveTireSet(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: TireSetInput | TireSetInput[]) =>
			patchConditionSection(reportId, {
				tireSets: Array.isArray(data) ? data : [data],
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'condition'],
			})
		},
	})
}

function useDeletePaintMarker(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (markerId: string) =>
			patchConditionSection(reportId, {
				deletePaintMarkerIds: [markerId],
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'condition'],
			})
		},
	})
}

function useDeleteTireSet(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (tireSetId: string) =>
			patchConditionSection(reportId, {
				deleteTireSetIds: [tireSetId],
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'condition'],
			})
		},
	})
}

export {
	useCondition,
	useSaveCondition,
	useSaveDamageMarker,
	useDeleteDamageMarker,
	useSavePaintMarker,
	useDeletePaintMarker,
	useSaveTireSet,
	useDeleteTireSet,
	fetchCondition,
}
