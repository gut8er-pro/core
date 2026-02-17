// Tire photo analyzer — extracts brand, size, tread depth, and condition.

import { getAnthropicClient } from './anthropic'
import { getCacheKey, getCachedResult, setCachedResult } from './cache'
import type { TireAnalysisResult, VehiclePosition } from './types'
import type { ImageData } from './fetch-image'

const TIRE_PROMPT = `Analyze this tire photo from a vehicle assessment. Extract as much information as visible.

Extract:
1. "manufacturer": Tire brand name (e.g., "Continental", "Michelin", "Goodyear", "Pirelli", "Bridgestone", "Hankook", "Dunlop"). Use null if unreadable.
2. "size": Full tire size marking (e.g., "205/55 R16 91V"). Look for numbers on the sidewall. Use null if unreadable.
3. "treadDepth": Estimated remaining tread depth in mm if you can judge (2-8mm range typically). Use null if impossible to tell.
4. "profileLevel": "good" (>4mm tread), "acceptable" (2-4mm), "worn" (<2mm), "critical" (at/below 1.6mm legal limit). Use null if impossible to judge.
5. "condition": Brief condition description (wear pattern, visible damage, cracking, bulges). Use null if not assessable.
6. "usability": 1 (good, safe), 2 (acceptable, monitor), 3 (worn, replace)
7. "tireType": "summer", "winter" (M+S or snowflake symbol), or "all-season". Use null if unclear.
8. "dotCode": DOT manufacturing code if visible (4 digits, e.g., "2419" = week 24 of 2019). Use null if not visible.
9. "position": Best guess of wheel position: "VL" (front-left), "VR" (front-right), "HL" (rear-left), "HR" (rear-right). Use null if unsure.
10. "confidence": 0.0-1.0 how much information you could reliably extract

Return ONLY valid JSON.`

function mapWheelPosition(position: VehiclePosition): 'VL' | 'VR' | 'HL' | 'HR' | null {
	switch (position) {
		case 'wheel-fl': return 'VL'
		case 'wheel-fr': return 'VR'
		case 'wheel-rl': return 'HL'
		case 'wheel-rr': return 'HR'
		// Map general positions to closest wheel — better than returning null
		case 'front-left': return 'VL'
		case 'front-right': return 'VR'
		case 'front': return 'VL'
		case 'rear-left': return 'HL'
		case 'rear-right': return 'HR'
		case 'rear': return 'HL'
		case 'left': return 'VL'
		case 'right': return 'VR'
		default: return null
	}
}

async function analyzeTire(
	photoId: string,
	imageData: ImageData,
	vehiclePosition: VehiclePosition,
): Promise<TireAnalysisResult> {
	const cacheKey = getCacheKey(photoId, 'tire-analysis')
	const cached = getCachedResult<TireAnalysisResult>(cacheKey)
	if (cached) return cached

	const client = getAnthropicClient()

	const message = await client.messages.create({
		model: 'claude-haiku-4-5-20251001',
		max_tokens: 512,
		messages: [{
			role: 'user',
			content: [
				{
					type: 'image',
					source: {
						type: 'base64',
						media_type: imageData.mediaType,
						data: imageData.base64,
					},
				},
				{ type: 'text', text: TIRE_PROMPT },
			],
		}],
	})

	const textBlock = message.content.find((block) => block.type === 'text')
	const rawResponse = textBlock ? textBlock.text.trim() : ''

	const result = parseTireResponse(photoId, rawResponse, vehiclePosition)
	setCachedResult(cacheKey, result)
	return result
}

function parseTireResponse(
	photoId: string,
	rawResponse: string,
	vehiclePosition: VehiclePosition,
): TireAnalysisResult {
	const fallback: TireAnalysisResult = {
		photoId,
		manufacturer: null,
		size: null,
		treadDepth: null,
		profileLevel: null,
		condition: null,
		usability: 2,
		tireType: null,
		dotCode: null,
		position: mapWheelPosition(vehiclePosition),
		confidence: 0,
	}

	try {
		const jsonString = rawResponse
			.replace(/^```(?:json)?\s*\n?/i, '')
			.replace(/\n?```\s*$/i, '')
			.trim()
		const parsed = JSON.parse(jsonString) as Record<string, unknown>

		const validProfileLevels = ['good', 'acceptable', 'worn', 'critical']
		const validTireTypes = ['summer', 'winter', 'all-season']
		const validPositions = ['VL', 'VR', 'HL', 'HR']

		const usabilityRaw = typeof parsed.usability === 'number' ? parsed.usability : 2
		const usability = ([1, 2, 3] as const).includes(usabilityRaw as 1 | 2 | 3)
			? (usabilityRaw as 1 | 2 | 3)
			: 2

		// Prefer AI-detected position, fall back to classifier's wheel position
		const aiPosition = typeof parsed.position === 'string' && validPositions.includes(parsed.position)
			? (parsed.position as 'VL' | 'VR' | 'HL' | 'HR')
			: null
		const resolvedPosition = aiPosition || mapWheelPosition(vehiclePosition)

		return {
			photoId,
			manufacturer: typeof parsed.manufacturer === 'string' ? parsed.manufacturer : null,
			size: typeof parsed.size === 'string' ? parsed.size : null,
			treadDepth: typeof parsed.treadDepth === 'number' ? parsed.treadDepth : null,
			profileLevel: typeof parsed.profileLevel === 'string' && validProfileLevels.includes(parsed.profileLevel)
				? (parsed.profileLevel as TireAnalysisResult['profileLevel'])
				: null,
			condition: typeof parsed.condition === 'string' ? parsed.condition : null,
			usability,
			tireType: typeof parsed.tireType === 'string' && validTireTypes.includes(parsed.tireType)
				? (parsed.tireType as TireAnalysisResult['tireType'])
				: null,
			dotCode: typeof parsed.dotCode === 'string' ? parsed.dotCode : null,
			position: resolvedPosition,
			confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
		}
	} catch {
		console.error('Failed to parse tire response:', rawResponse)
		return fallback
	}
}

export { analyzeTire, mapWheelPosition }
