// AI client wrapper — calls our API routes which proxy to Claude API.

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

async function analyzePhoto(photoUrl: string): Promise<PhotoAnalysisResult> {
	const response = await fetch('/api/ai/analyze-photo', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ photoUrl }),
	})
	if (!response.ok) throw new Error(await parseErrorResponse(response, 'AI analysis failed'))
	return response.json()
}

async function detectVin(photoUrl: string): Promise<VinDetectionResult> {
	const response = await fetch('/api/ai/detect-vin', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ photoUrl }),
	})
	if (!response.ok) throw new Error(await parseErrorResponse(response, 'VIN detection failed'))
	return response.json()
}

async function detectLicensePlate(photoUrl: string): Promise<PlateDetectionResult> {
	const response = await fetch('/api/ai/detect-plate', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ photoUrl }),
	})
	if (!response.ok) throw new Error(await parseErrorResponse(response, 'Plate detection failed'))
	return response.json()
}

async function ocrDocument(photoUrl: string): Promise<OcrResult> {
	const response = await fetch('/api/ai/ocr', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ photoUrl }),
	})
	if (!response.ok) throw new Error(await parseErrorResponse(response, 'OCR failed'))
	return response.json()
}

export {
	analyzePhoto,
	detectVin,
	detectLicensePlate,
	ocrDocument,
}
export type {
	PhotoAnalysisResult,
	VinDetectionResult,
	PlateDetectionResult,
	OcrResult,
}
