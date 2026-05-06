// Overview photo analyzer — extracts general vehicle info from full-body shots.

import { getAnthropicClient } from './anthropic'
import { getCachedResult, getCacheKey, setCachedResult } from './cache'
import type { ImageData } from './fetch-image'
import type { OverviewAnalysisResult } from './types'

// Canonical enum values that must match keys in `valueTranslations`
// (src/lib/pdf/translations.ts) so the PDF can localize them at render time.
const ALLOWED_GENERAL_CONDITION = ['Well maintained', 'Average', 'Poor'] as const
const ALLOWED_BODY_CONDITION = ['No damage', 'Minor cosmetic', 'Structural damage'] as const
const ALLOWED_PAINT_TYPE = ['Metallic', 'Uni (2 Schicht)', 'Pearl', 'Matte'] as const
const ALLOWED_PAINT_CONDITION = ['Good', 'Fair', 'Poor'] as const
const ALLOWED_DRIVING_ABILITY = ['Roadworthy', 'Limited', 'Not roadworthy'] as const

function buildOverviewPrompt(locale: 'en' | 'de' = 'en'): string {
	const localeSuffix =
		locale === 'de'
			? '\n\nDescription/free-text in German. Keep all enum values in English exactly as listed.'
			: ''

	return `Analyze this vehicle photo for a professional assessment report. Extract any visible information about the vehicle.

Return JSON with these fields:
1. "description": A brief, professional description of what's visible in the photo (1-2 sentences)

2. "color": Vehicle exterior color (e.g., "Silver", "Black", "White", "Dark Blue"). Use null if not clearly visible.

3. "make": Vehicle manufacturer if identifiable (e.g., "Audi", "Volkswagen", "BMW", "Mercedes-Benz"). Use null if unsure.

4. "model": Vehicle model if identifiable (e.g., "A6", "Golf", "3 Series"). Use null if unsure.

5. "bodyType": Body type (e.g., "Hatchback", "Sedan", "SUV", "Kombi/Estate", "Coupe", "Convertible", "Van"). Use null if unsure.

6. "generalCondition": EXACTLY one of: "Well maintained" | "Average" | "Poor". Use null if not assessable.

7. "bodyCondition": EXACTLY one of: "No damage" | "Minor cosmetic" | "Structural damage". Use null if not assessable.

8. "paintType": EXACTLY one of: "Metallic" | "Uni (2 Schicht)" | "Pearl" | "Matte". Use null if you cannot tell from the photo.

9. "paintCondition": EXACTLY one of: "Good" | "Fair" | "Poor". Use null if not assessable.

10. "drivingAbility": EXACTLY one of: "Roadworthy" | "Limited" | "Not roadworthy". Use null if you cannot determine from a static photo (e.g., overview only — only set this if there's clear visible evidence such as deflated tires, deployed airbags, broken windscreen, severe collision damage).

Return ONLY valid JSON. Use null whenever you are not sure — do NOT make up enum values.${localeSuffix}`
}

async function analyzeOverview(
	photoId: string,
	imageData: ImageData,
	locale: 'en' | 'de' = 'en',
): Promise<OverviewAnalysisResult> {
	const cacheKey = getCacheKey(photoId, `overview-analysis:${locale}`)
	const cached = getCachedResult<OverviewAnalysisResult>(cacheKey)
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
					{ type: 'text', text: buildOverviewPrompt(locale) },
				],
			},
		],
	})

	const textBlock = message.content.find((block) => block.type === 'text')
	const rawResponse = textBlock ? textBlock.text.trim() : ''

	const result = parseOverviewResponse(photoId, rawResponse)
	setCachedResult(cacheKey, result)
	return result
}

function matchAllowed<T extends string>(raw: unknown, allowed: ReadonlyArray<T>): T | null {
	if (typeof raw !== 'string') return null
	const trimmed = raw.trim()
	if (!trimmed) return null
	return allowed.find((v) => v.toLowerCase() === trimmed.toLowerCase()) ?? null
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
		paintType: null,
		paintCondition: null,
		drivingAbility: null,
	}

	try {
		const jsonString = rawResponse
			.replace(/^```(?:json)?\s*\n?/i, '')
			.replace(/\n?```\s*$/i, '')
			.trim()
		const parsed = JSON.parse(jsonString) as Record<string, unknown>

		return {
			photoId,
			description:
				typeof parsed.description === 'string' ? parsed.description : fallback.description,
			color: typeof parsed.color === 'string' ? parsed.color : null,
			make: typeof parsed.make === 'string' ? parsed.make : null,
			model: typeof parsed.model === 'string' ? parsed.model : null,
			bodyType: typeof parsed.bodyType === 'string' ? parsed.bodyType : null,
			generalCondition: matchAllowed(parsed.generalCondition, ALLOWED_GENERAL_CONDITION),
			bodyCondition: matchAllowed(parsed.bodyCondition, ALLOWED_BODY_CONDITION),
			paintType: matchAllowed(parsed.paintType, ALLOWED_PAINT_TYPE),
			paintCondition: matchAllowed(parsed.paintCondition, ALLOWED_PAINT_CONDITION),
			drivingAbility: matchAllowed(parsed.drivingAbility, ALLOWED_DRIVING_ABILITY),
		}
	} catch {
		console.error('Failed to parse overview response:', rawResponse)
		return fallback
	}
}

export { analyzeOverview, parseOverviewResponse }
