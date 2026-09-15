// AI client wrapper — calls our API routes which proxy to Claude API.

import { isSubscriptionRequired, SubscriptionRequiredError } from '@/lib/api/errors'

type PhotoAnalysisResult = {
	description: string
}

type VinDetectionResult = {
	vin: string | null
}

type PlateDetectionResult = {
	plate: string | null
}

type OcrResult = Record<string, string>

async function parseErrorResponse(response: Response, fallback: string): Promise<string> {
	try {
		const data = await response.json()
		return data.error || fallback
	} catch {
		return fallback
	}
}

/**
 * Every one of these routes sits behind `getEntitledUser`, so a lapsed subscriber gets a
 * 402 from all four. That is the one failure worth distinguishing: it is not a bad photo
 * and not a provider outage, and retrying cannot help. It leaves here as
 * `SubscriptionRequiredError` so the caller can say so instead of showing "AI analysis
 * failed" to someone whose photo was fine.
 */
async function postToAiRoute<T>(url: string, photoUrl: string, fallback: string): Promise<T> {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ photoUrl }),
	})
	if (isSubscriptionRequired(response)) throw new SubscriptionRequiredError()
	if (!response.ok) throw new Error(await parseErrorResponse(response, fallback))
	return response.json()
}

async function analyzePhoto(photoUrl: string): Promise<PhotoAnalysisResult> {
	return postToAiRoute('/api/ai/analyze-photo', photoUrl, 'AI analysis failed')
}

async function detectVin(photoUrl: string): Promise<VinDetectionResult> {
	return postToAiRoute('/api/ai/detect-vin', photoUrl, 'VIN detection failed')
}

async function detectLicensePlate(photoUrl: string): Promise<PlateDetectionResult> {
	return postToAiRoute('/api/ai/detect-plate', photoUrl, 'Plate detection failed')
}

async function ocrDocument(photoUrl: string): Promise<OcrResult> {
	return postToAiRoute('/api/ai/ocr', photoUrl, 'OCR failed')
}

export type { OcrResult, PhotoAnalysisResult, PlateDetectionResult, VinDetectionResult }
export { analyzePhoto, detectLicensePlate, detectVin, ocrDocument }
