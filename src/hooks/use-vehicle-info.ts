import {
	useQuery,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'
import type { VehicleInfoInput } from '@/lib/validations/vehicle'

type VehicleInfoResponse = {
	id: string
	reportId: string
	vin: string | null
	datsCode: string | null
	marketIndex: string | null
	manufacturer: string | null
	mainType: string | null
	subType: string | null
	kbaNumber: string | null
	powerKw: number | null
	powerHp: number | null
	engineDesign: string | null
	cylinders: number | null
	transmission: string | null
	displacement: number | null
	firstRegistration: string | null
	lastRegistration: string | null
	sourceOfTechnicalData: string | null
	vehicleType: string | null
	motorType: string | null
	axles: number | null
	drivenAxles: number | null
	doors: number | null
	seats: number | null
	previousOwners: number | null
} | null

async function fetchVehicleInfo(reportId: string): Promise<VehicleInfoResponse> {
	const response = await fetch(`/api/reports/${reportId}/vehicle`)
	if (!response.ok) {
		throw new Error('Failed to fetch vehicle info')
	}
	return response.json()
}

async function patchVehicleInfo(
	reportId: string,
	data: VehicleInfoInput,
): Promise<VehicleInfoResponse> {
	const response = await fetch(`/api/reports/${reportId}/vehicle`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})
	if (!response.ok) {
		throw new Error('Failed to save vehicle info')
	}
	return response.json()
}

function useVehicleInfo(reportId: string) {
	return useQuery({
		queryKey: ['report', reportId, 'vehicle'],
		queryFn: () => fetchVehicleInfo(reportId),
		enabled: !!reportId,
		staleTime: 30_000,
		refetchOnMount: 'always',
	})
}

function useSaveVehicleInfo(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: VehicleInfoInput) =>
			patchVehicleInfo(reportId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'vehicle'],
			})
		},
	})
}

export {
	useVehicleInfo,
	useSaveVehicleInfo,
	fetchVehicleInfo,
}
export type { VehicleInfoResponse }
