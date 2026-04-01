import { useMutation } from '@tanstack/react-query'
import type {
	OcrResult,
	PhotoAnalysisResult,
	PlateDetectionResult,
	VinDetectionResult,
} from '@/lib/ai/client'
import { analyzePhoto, detectLicensePlate, detectVin, ocrDocument } from '@/lib/ai/client'

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

export { useDocumentOcr, usePhotoAnalysis, usePlateDetection, useVinDetection }
