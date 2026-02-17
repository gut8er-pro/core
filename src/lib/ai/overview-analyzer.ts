// Overview photo analyzer — extracts general vehicle info from full-body shots.

import { getAnthropicClient } from './anthropic'
import { getCacheKey, getCachedResult, setCachedResult } from './cache'
import type { OverviewAnalysisResult } from './types'
import type { ImageData } from './fetch-image'

const OVERVIEW_PROMPT = `Analyze this vehicle photo for a professional assessment report. Extract any visible information about the vehicle.

Return JSON with these fields:
1. "description": A brief, professional description of what's visible in the photo (1-2 sentences)
2. "color": Vehicle exterior color (e.g., "Silver", "Black", "White", "Dark Blue"). Use null if not clearly visible.
3. "make": Vehicle manufacturer if identifiable (e.g., "Volkswagen", "BMW", "Mercedes-Benz"). Use null if unsure.
4. "model": Vehicle model if identifiable (e.g., "Golf", "3 Series", "C-Class"). Use null if unsure.
5. "bodyType": Body type (e.g., "Hatchback", "Sedan", "SUV", "Kombi/Estate", "Coupe", "Convertible", "Van"). Use null if unsure.
6. "generalCondition": Brief condition note (e.g., "Generally well-maintained exterior", "Signs of age and wear"). Use null if not assessable.
7. "bodyCondition": Body/chassis condition (e.g., "No visible corrosion", "Minor surface rust on wheel arches", "Structural corrosion present"). Use null if not assessable.

Return ONLY valid JSON.`

async function analyzeOverview(
	photoId: string,
	imageData: ImageData,
): Promise<OverviewAnalysisResult> {
	const cacheKey = getCacheKey(photoId, 'overview-analysis')
	const cached = getCachedResult<OverviewAnalysisResult>(cacheKey)
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
				{ type: 'text', text: OVERVIEW_PROMPT },
			],
		}],
	})

	const textBlock = message.content.find((block) => block.type === 'text')
	const rawResponse = textBlock ? textBlock.text.trim() : ''

	const result = parseOverviewResponse(photoId, rawResponse)
	setCachedResult(cacheKey, result)
	return result
}

function parseOverviewResponse(photoId: string, rawResponse: string): OverviewAnalysisResult {
	const fallback: OverviewAnalysisResult = {
		photoId,
		description: 'Vehicle overview photo.',
		color: null,
		make: null,
		model: null,
		bodyType: null,
		generalCondition: null,
		bodyCondition: null,
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
			color: typeof parsed.color === 'string' ? parsed.color : null,
			make: typeof parsed.make === 'string' ? parsed.make : null,
			model: typeof parsed.model === 'string' ? parsed.model : null,
			bodyType: typeof parsed.bodyType === 'string' ? parsed.bodyType : null,
			generalCondition: typeof parsed.generalCondition === 'string' ? parsed.generalCondition : null,
			bodyCondition: typeof parsed.bodyCondition === 'string' ? parsed.bodyCondition : null,
		}
	} catch {
		console.error('Failed to parse overview response:', rawResponse)
		return fallback
	}
}

export { analyzeOverview }
