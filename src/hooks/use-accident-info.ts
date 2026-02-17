import {
	useQuery,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'
import type {
	AccidentInfoInput,
	ClaimantInfoInput,
	OpponentInfoInput,
	VisitInput,
	ExpertOpinionInput,
	SignatureInput,
} from '@/lib/validations/accident-info'

type AccidentInfoResponse = {
	accidentInfo: {
		id: string
		reportId: string
		accidentDay: string | null
		accidentScene: string | null
	} | null
	claimantInfo: {
		id: string
		reportId: string
		company: string | null
		salutation: string | null
		firstName: string | null
		lastName: string | null
		street: string | null
		postcode: string | null
		location: string | null
		email: string | null
		phone: string | null
		vehicleMake: string | null
		licensePlate: string | null
		eligibleForInputTaxDeduction: boolean
		isVehicleOwner: boolean
		representedByLawyer: boolean
		involvedLawyer: string | null
	} | null
	opponentInfo: {
		id: string
		reportId: string
		company: string | null
		salutation: string | null
		firstName: string | null
		lastName: string | null
		street: string | null
		postcode: string | null
		location: string | null
		email: string | null
		phone: string | null
		insuranceCompany: string | null
		insuranceNumber: string | null
	} | null
	visits: Array<{
		id: string
		reportId: string
		type: string
		street: string | null
		postcode: string | null
		location: string | null
		date: string | null
		expert: string | null
		vehicleCondition: string | null
	}>
	expertOpinion: {
		id: string
		reportId: string
		expertName: string | null
		fileNumber: string | null
		caseDate: string | null
		orderWasPlacement: string | null
		issuedDate: string | null
		orderByClaimant: boolean
		mediator: string | null
	} | null
	signatures: Array<{
		id: string
		reportId: string
		type: 'LAWYER' | 'DATA_PERMISSION' | 'CANCELLATION'
		imageUrl: string | null
		signedAt: string | null
	}>
}

async function fetchAccidentInfo(reportId: string): Promise<AccidentInfoResponse> {
	const response = await fetch(`/api/reports/${reportId}/accident-info`)
	if (!response.ok) {
		throw new Error('Failed to fetch accident info')
	}
	return response.json()
}

async function patchAccidentInfoSection(
	reportId: string,
	data: Record<string, unknown>,
): Promise<unknown> {
	const response = await fetch(`/api/reports/${reportId}/accident-info`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})
	if (!response.ok) {
		throw new Error('Failed to save accident info')
	}
	return response.json()
}

function useAccidentInfo(reportId: string) {
	return useQuery({
		queryKey: ['report', reportId, 'accident-info'],
		queryFn: () => fetchAccidentInfo(reportId),
		enabled: !!reportId,
		staleTime: 30_000,
		refetchOnMount: 'always',
	})
}

function useSaveAccidentInfo(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: AccidentInfoInput) =>
			patchAccidentInfoSection(reportId, { accidentInfo: data }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'accident-info'],
			})
		},
	})
}

function useSaveClaimantInfo(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: ClaimantInfoInput) =>
			patchAccidentInfoSection(reportId, { claimantInfo: data }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'accident-info'],
			})
		},
	})
}

function useSaveOpponentInfo(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: OpponentInfoInput) =>
			patchAccidentInfoSection(reportId, { opponentInfo: data }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'accident-info'],
			})
		},
	})
}

function useSaveVisit(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: VisitInput) =>
			patchAccidentInfoSection(reportId, { visits: [data] }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'accident-info'],
			})
		},
	})
}

function useSaveExpertOpinion(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: ExpertOpinionInput) =>
			patchAccidentInfoSection(reportId, { expertOpinion: data }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'accident-info'],
			})
		},
	})
}

function useSaveSignature(reportId: string) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: SignatureInput) =>
			patchAccidentInfoSection(reportId, { signatures: [data] }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['report', reportId, 'accident-info'],
			})
		},
	})
}

export {
	useAccidentInfo,
	useSaveAccidentInfo,
	useSaveClaimantInfo,
	useSaveOpponentInfo,
	useSaveVisit,
	useSaveExpertOpinion,
	useSaveSignature,
	fetchAccidentInfo,
}
export type { AccidentInfoResponse }
