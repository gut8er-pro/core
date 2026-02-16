// Photo classifier — categorizes each photo into one of 8 types using Haiku 4.5.

import { getAnthropicClient } from './anthropic'
import { getCacheKey, getCachedResult, setCachedResult } from './cache'
import type { ClassificationResult, PhotoClassificationType, VehiclePosition } from './types'
import type { ImageData } from './fetch-image'

const CLASSIFICATION_PROMPT = `You are a vehicle assessment photo classifier. Classify this photo into exactly one category.

Categories:
- "damage": Shows vehicle damage (dents, scratches, cracks, broken parts, deformation, paint damage)
- "vin": Shows a VIN plate, VIN sticker, or VIN number visible on the vehicle
- "plate": Shows the vehicle's license plate (Kennzeichen)
- "document": Shows a vehicle registration document (Zulassungsbescheinigung), insurance papers, or inspection certificate
- "overview": General vehicle photo showing the full car body or significant portion (undamaged areas)
- "tire": Close-up of a tire, wheel, or rim showing tread pattern, brand, or size markings
- "interior": Interior of the vehicle (dashboard, seats, steering wheel, trunk/boot space)
- "other": Cannot be classified into any above category

Also determine:
1. position: Where on the vehicle this photo was taken from. Use one of: front-left, front, front-right, left, right, rear-left, rear, rear-right, top, interior, engine, wheel-fl, wheel-fr, wheel-rl, wheel-rr, undercarriage, other
2. suggestedOrder: A number 1-20 for the logical ordering in a professional report:
   1=front-left diagonal, 2=front, 3=front-right diagonal, 4=right side, 5=rear-right diagonal, 6=rear, 7=rear-left diagonal, 8=left side, 9-12=damage close-ups, 13-14=interior, 15=engine, 16-17=tires, 18=VIN, 19=license plate, 20=document
3. confidence: 0.0 to 1.0 how certain you are
4. damageLocation: (only if type is "damage") Brief description of where on the car the damage is, e.g. "rear-left quarter panel", "front bumper". Use null for non-damage photos.

Return ONLY valid JSON: {"type":"...","position":"...","suggestedOrder":N,"confidence":0.X,"damageLocation":"...or null"}`

const VALID_TYPES: PhotoClassificationType[] = [
	'damage', 'vin', 'plate', 'document', 'overview', 'tire', 'interior', 'other',
]

const VALID_POSITIONS: VehiclePosition[] = [
	'front-left', 'front', 'front-right', 'left', 'right',
	'rear-left', 'rear', 'rear-right', 'top', 'interior', 'engine',
	'wheel-fl', 'wheel-fr', 'wheel-rl', 'wheel-rr', 'undercarriage', 'other',
]

async function classifyPhoto(
	photoId: string,
	imageData: ImageData,
): Promise<ClassificationResult> {
	const cacheKey = getCacheKey(photoId, 'classify')
	const cached = getCachedResult<ClassificationResult>(cacheKey)
	if (cached) return cached

	const client = getAnthropicClient()

	const message = await client.messages.create({
		model: 'claude-haiku-4-5-20251001',
		max_tokens: 256,
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
				{ type: 'text', text: CLASSIFICATION_PROMPT },
			],
		}],
	})

	const textBlock = message.content.find((block) => block.type === 'text')
	const rawResponse = textBlock ? textBlock.text.trim() : ''

	const result = parseClassificationResponse(photoId, rawResponse)
	setCachedResult(cacheKey, result)
	return result
}

function parseClassificationResponse(
	photoId: string,
	rawResponse: string,
): ClassificationResult {
	const fallback: ClassificationResult = {
		photoId,
		type: 'other',
		confidence: 0,
		position: 'other',
		suggestedOrder: 20,
		damageLocation: null,
	}

	try {
		const jsonString = rawResponse
			.replace(/^```(?:json)?\s*\n?/i, '')
			.replace(/\n?```\s*$/i, '')
			.trim()
		const parsed = JSON.parse(jsonString) as Record<string, unknown>

		const type = VALID_TYPES.includes(parsed.type as PhotoClassificationType)
			? (parsed.type as PhotoClassificationType)
			: 'other'

		const position = VALID_POSITIONS.includes(parsed.position as VehiclePosition)
			? (parsed.position as VehiclePosition)
			: 'other'

		const suggestedOrder = typeof parsed.suggestedOrder === 'number'
			? Math.min(20, Math.max(1, Math.round(parsed.suggestedOrder)))
			: 20

		const confidence = typeof parsed.confidence === 'number'
			? Math.min(1, Math.max(0, parsed.confidence))
			: 0.5

		const damageLocation = type === 'damage' && typeof parsed.damageLocation === 'string'
			? parsed.damageLocation
			: null

		return { photoId, type, confidence, position, suggestedOrder, damageLocation }
	} catch {
		console.error('Failed to parse classification response:', rawResponse)
		return fallback
	}
}

export { classifyPhoto }
