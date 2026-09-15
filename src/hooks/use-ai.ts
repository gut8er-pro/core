import { useMutation } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useSubscriptionNotice } from '@/hooks/use-subscription-notice'
import type {
	OcrResult,
	PhotoAnalysisResult,
	PlateDetectionResult,
	VinDetectionResult,
} from '@/lib/ai/client'
import { analyzePhoto, detectLicensePlate, detectVin, ocrDocument } from '@/lib/ai/client'
import { SubscriptionRequiredError } from '@/lib/api/errors'

/**
 * A 402 from an AI route is not a failure of the photo or of the provider — the account
 * is lapsed, and no retry will change that. Saying so here means every AI mutation
 * explains itself by default, rather than leaving it to each future caller to notice.
 * Callers can still add their own `onError`; both run.
 */
function useRefusalHandler() {
	const { notify } = useSubscriptionNotice()

	return useCallback(
		(error: Error) => {
			if (error instanceof SubscriptionRequiredError) notify()
		},
		[notify],
	)
}

function usePhotoAnalysis() {
	const onError = useRefusalHandler()
	return useMutation<PhotoAnalysisResult, Error, string>({
		mutationFn: (photoUrl: string) => analyzePhoto(photoUrl),
		onError,
	})
}

function useVinDetection() {
	const onError = useRefusalHandler()
	return useMutation<VinDetectionResult, Error, string>({
		mutationFn: (photoUrl: string) => detectVin(photoUrl),
		onError,
	})
}

function usePlateDetection() {
	const onError = useRefusalHandler()
	return useMutation<PlateDetectionResult, Error, string>({
		mutationFn: (photoUrl: string) => detectLicensePlate(photoUrl),
		onError,
	})
}

function useDocumentOcr() {
	const onError = useRefusalHandler()
	return useMutation<OcrResult, Error, string>({
		mutationFn: (photoUrl: string) => ocrDocument(photoUrl),
		onError,
	})
}

export { useDocumentOcr, usePhotoAnalysis, usePlateDetection, useVinDetection }
