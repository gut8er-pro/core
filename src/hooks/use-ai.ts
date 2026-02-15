import { useMutation } from '@tanstack/react-query'
import {
	analyzePhoto,
	detectVin,
	detectLicensePlate,
	ocrDocument,
} from '@/lib/ai/client'
import type {
	PhotoAnalysisResult,
	VinDetectionResult,
	PlateDetectionResult,
	OcrResult,
} from '@/lib/ai/client'

function usePhotoAnalysis() {
	return useMutation<PhotoAnalysisResult, Error, string>({
		mutationFn: (photoUrl: string) => analyzePhoto(photoUrl),
	})
}

function useVinDetection() {
	return useMutation<VinDetectionResult, Error, string>({
		mutationFn: (photoUrl: string) => detectVin(photoUrl),
	})
}

function usePlateDetection() {
	return useMutation<PlateDetectionResult, Error, string>({
		mutationFn: (photoUrl: string) => detectLicensePlate(photoUrl),
	})
}

function useDocumentOcr() {
	return useMutation<OcrResult, Error, string>({
		mutationFn: (photoUrl: string) => ocrDocument(photoUrl),
	})
}

export {
	usePhotoAnalysis,
	useVinDetection,
	usePlateDetection,
	useDocumentOcr,
}
