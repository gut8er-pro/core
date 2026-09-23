import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ConditionResponse } from '@/components/report/condition/types'
import { awaitSectionSave, trackSectionSave } from '@/lib/api/section-saves'
import type {
	ConditionInput,
	DamageMarkerInput,
	PaintMarkerInput,
	TireSetInput,
} from '@/lib/validations/condition'

async function fetchCondition(reportId: string): Promise<ConditionResponse> {
	await awaitSectionSave(reportId, 'condition')
	const response = await fetch(`/api/reports/${reportId}/condition`)
	if (!response.ok) {
		throw new Error('Failed to fetch condition data')
	}
	return response.json()
}

async function patchConditionSectionRequest(
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

function patchConditionSection(reportId: string, data: Record<string, unknown>): Promise<unknown> {
	return trackSectionSave(reportId, 'condition', patchConditionSectionRequest(reportId, data))
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
		mutationFn: (data: ConditionInput) => patchConditionSection(reportId, { condition: data }),
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

type CachedTireSet = ConditionResponse['tireSets'][number]

function withSavedTires(cached: CachedTireSet, saved: TireSetInput): CachedTireSet {
	return {
		...cached,
		matchAndAlloy: saved.matchAndAlloy ?? cached.matchAndAlloy,
		tires: cached.tires.map((tire) => {
			const typed = saved.tires?.find(
				(candidate) =>
					(candidate.id !== undefined && candidate.id === tire.id) ||
					candidate.position === tire.position,
			)
			if (!typed) return tire
			return {
				...tire,
				size: typed.size ?? tire.size,
				profileLevel: typed.profileLevel ?? tire.profileLevel,
				manufacturer: typed.manufacturer ?? tire.manufacturer,
				usability: typed.usability ?? tire.usability,
				dotCode: typed.dotCode ?? tire.dotCode,
				tireType: typed.tireType ?? tire.tireType,
			}
		}),
	}
}

/**
 * Only sets the cache already holds are patched: a set the server has not
 * created yet has no id to key it by, so it waits for the refetch.
 */
function applyTireSetsToCache(
	tireSets: CachedTireSet[],
	saves: TireSetInput[],
): CachedTireSet[] | null {
	let changed = false
	const next = tireSets.map((cached) => {
		const saved = saves.find((candidate) =>
			candidate.id ? candidate.id === cached.id : candidate.setNumber === cached.setNumber,
		)
		if (!saved) return cached
		changed = true
		return withSavedTires(cached, saved)
	})
	return changed ? next : null
}

function useSaveTireSet(reportId: string) {
	const queryClient = useQueryClient()
	const queryKey = ['report', reportId, 'condition']
	return useMutation({
		mutationFn: (data: TireSetInput | TireSetInput[]) =>
			patchConditionSection(reportId, {
				tireSets: Array.isArray(data) ? data : [data],
			}),
		onMutate: async (data) => {
			const saves = Array.isArray(data) ? data : [data]
			const cached = queryClient.getQueryData<ConditionResponse>(queryKey)
			if (!cached || !applyTireSetsToCache(cached.tireSets, saves)) return
			await queryClient.cancelQueries({ queryKey })
			queryClient.setQueryData<ConditionResponse>(queryKey, (current) => {
				if (!current) return current
				const tireSets = applyTireSetsToCache(current.tireSets, saves)
				return tireSets ? { ...current, tireSets } : current
			})
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey })
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
	fetchCondition,
	patchConditionSection,
	useCondition,
	useDeleteDamageMarker,
	useDeletePaintMarker,
	useDeleteTireSet,
	useSaveCondition,
	useSaveDamageMarker,
	useSavePaintMarker,
	useSaveTireSet,
}
