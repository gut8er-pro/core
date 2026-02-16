// Interior photo analyzer — extracts condition and features from interior shots.

import { getAnthropicClient } from './anthropic'
import { getCacheKey, getCachedResult, setCachedResult } from './cache'
import type { InteriorAnalysisResult } from './types'
import type { ImageData } from './fetch-image'

const INTERIOR_PROMPT = `Analyze this vehicle interior photo for a professional assessment report.

Return JSON with:
1. "description": Brief professional description of the interior visible in the photo (1-2 sentences)
2. "condition": Overall interior condition: "excellent", "good", "fair", "poor", or null if not assessable
3. "features": Array of notable features visible (e.g., "leather seats", "navigation system", "sunroof", "heated seats", "parking sensors display", "automatic climate control"). Empty array if none identifiable.

Return ONLY valid JSON.`

async function analyzeInterior(
	photoId: string,
	imageData: ImageData,
): Promise<InteriorAnalysisResult> {
	const cacheKey = getCacheKey(photoId, 'interior-analysis')
	const cached = getCachedResult<InteriorAnalysisResult>(cacheKey)
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
				{ type: 'text', text: INTERIOR_PROMPT },
			],
		}],
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
	}

	try {
		const jsonString = rawResponse
			.replace(/^```(?:json)?\s*\n?/i, '')
			.replace(/\n?```\s*$/i, '')
			.trim()
		const parsed = JSON.parse(jsonString) as Record<string, unknown>

		return {
			photoId,
			description: typeof parsed.description === 'string' ? parsed.description : fallback.description,
			condition: typeof parsed.condition === 'string' ? parsed.condition : null,
			features: Array.isArray(parsed.features) ? parsed.features.filter((f): f is string => typeof f === 'string') : [],
		}
	} catch {
		console.error('Failed to parse interior response:', rawResponse)
		return fallback
	}
}

export { analyzeInterior }
