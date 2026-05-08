// Interior photo analyzer — extracts condition and features from interior shots.

import { getAnthropicClient } from './anthropic'
import { getCachedResult, getCacheKey, setCachedResult } from './cache'
import type { ImageData } from './fetch-image'
import type { InteriorAnalysisResult } from './types'

function buildInteriorPrompt(locale: 'en' | 'de' = 'en'): string {
	const localeSuffix =
		locale === 'de'
			? '\n\nDescription/free-text in German. Keep "condition" enum and "features" array items in English exactly as listed.'
			: '\n\nDescription/free-text strictly in English. Keep "condition" enum and "features" array items in English exactly as listed.'

	return `Analyze this vehicle interior photo for a professional assessment report.

Return JSON with:
1. "description": Brief professional description of the interior visible in the photo (1-2 sentences)

2. "condition": Overall interior condition. Use EXACTLY one of these values (title case): "Excellent", "Good", "Fair", "Poor". Use null if not assessable.

3. "features": Array of OPTIONAL vehicle equipment visible. Include items like:
   "leather seats", "navigation system", "heated seats", "ventilated seats", "panoramic sunroof", "sliding sunroof", "adaptive cruise control", "head-up display", "parking assist", "360° camera", "premium audio system", "Apple CarPlay", "Android Auto", "automatic climate control"
   EXCLUDE all of: dashboard UI components (speedometer, tachometer, fuel gauge, warning lights, gear selector indicator, odometer display, information display), standard equipment (steering wheel, plain seats, AC vents, dashboard, glove box, sun visors), and any control present in every car.
   Return an empty array if nothing notable is visible.

4. "mileage": If an odometer is visible, extract the reading as a number (in km). Use null if not visible.

5. "parkingSensors": true if parking sensor indicators or PDC display are visible, false if dashboard visible without sensors, null if cannot determine.

6. "airbagsDeployed": true if deployed airbags are visible, false if airbags appear intact, null if cannot determine.

Return ONLY valid JSON.${localeSuffix}`
}

async function analyzeInterior(
	photoId: string,
	imageData: ImageData,
	locale: 'en' | 'de' = 'en',
): Promise<InteriorAnalysisResult> {
	const cacheKey = getCacheKey(photoId, `interior-analysis:${locale}`)
	const cached = getCachedResult<InteriorAnalysisResult>(cacheKey)
	if (cached) return cached

	const client = getAnthropicClient()

	const message = await client.messages.create({
		model: 'claude-haiku-4-5-20251001',
		max_tokens: 512,
		messages: [
			{
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
					{ type: 'text', text: buildInteriorPrompt(locale) },
				],
			},
		],
	})

	const textBlock = message.content.find((block) => block.type === 'text')
	const rawResponse = textBlock ? textBlock.text.trim() : ''

	const result = parseInteriorResponse(photoId, rawResponse)
	setCachedResult(cacheKey, result)
	return result
}

function parseInteriorResponse(photoId: string, rawResponse: string): InteriorAnalysisResult {
	const fallback: InteriorAnalysisResult = {
		photoId,
		description: 'Vehicle interior photo.',
		condition: null,
		features: [],
		mileage: null,
		parkingSensors: null,
		airbagsDeployed: null,
	}

	try {
		const jsonString = rawResponse
			.replace(/^```(?:json)?\s*\n?/i, '')
			.replace(/\n?```\s*$/i, '')
			.trim()
		const parsed = JSON.parse(jsonString) as Record<string, unknown>

		const conditionRaw = typeof parsed.condition === 'string' ? parsed.condition.trim() : ''
		const allowedConditions = ['Excellent', 'Good', 'Fair', 'Poor']
		const conditionMatch = allowedConditions.find(
			(c) => c.toLowerCase() === conditionRaw.toLowerCase(),
		)

		return {
			photoId,
			description:
				typeof parsed.description === 'string' ? parsed.description : fallback.description,
			condition: conditionMatch ?? null,
			features: Array.isArray(parsed.features)
				? parsed.features.filter((f): f is string => typeof f === 'string')
				: [],
			mileage: typeof parsed.mileage === 'number' ? Math.round(parsed.mileage) : null,
			parkingSensors: typeof parsed.parkingSensors === 'boolean' ? parsed.parkingSensors : null,
			airbagsDeployed: typeof parsed.airbagsDeployed === 'boolean' ? parsed.airbagsDeployed : null,
		}
	} catch {
		console.error('Failed to parse interior response:', rawResponse)
		return fallback
	}
}

export { analyzeInterior, parseInteriorResponse }
