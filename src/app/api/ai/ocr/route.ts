import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { aiPhotoRequestSchema } from '@/lib/validations/ai'
import { getAnthropicClient } from '@/lib/ai/anthropic'
import { getCacheKey, getCachedResult, setCachedResult } from '@/lib/ai/cache'
import { fetchImageAsBase64 } from '@/lib/ai/fetch-image'

const EMPTY_OCR_RESULT = {
	manufacturer: '',
	model: '',
	vin: '',
	licensePlate: '',
	firstRegistration: '',
	engineDisplacement: '',
	power: '',
	fuel: '',
	mileage: '',
}

type OcrData = typeof EMPTY_OCR_RESULT

async function POST(request: NextRequest) {
	const { error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const body = await request.json()
	const parsed = aiPhotoRequestSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	// Check cache before calling Claude
	const cacheKey = getCacheKey(parsed.data.photoUrl, 'ocr')
	const cached = getCachedResult<OcrData>(cacheKey)
	if (cached) {
		return NextResponse.json(cached)
	}

	if (!process.env.ANTHROPIC_API_KEY) {
		return NextResponse.json(
			{ error: 'AI service is not configured. Please set the ANTHROPIC_API_KEY environment variable.' },
			{ status: 503 },
		)
	}

	try {
		const client = getAnthropicClient()

		// Fetch image server-side and convert to base64 to avoid URL accessibility issues
		const imageData = await fetchImageAsBase64(parsed.data.photoUrl)

		const message = await client.messages.create({
			model: 'claude-sonnet-4-5-20250929',
			max_tokens: 1024,
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
					{
						type: 'text',
						text: 'Extract vehicle registration information from this document image. Return the result as a JSON object.',
					},
				],
			}],
			system: 'Extract vehicle registration information from this German Zulassungsbescheinigung (vehicle registration document). Return a JSON object with these fields: manufacturer, model, vin, licensePlate, firstRegistration (date as YYYY-MM-DD), engineDisplacement (in ccm), power (in kW), fuel (type), mileage. Use empty string for fields that cannot be extracted. Return ONLY the JSON object, no additional text or markdown formatting.',
		})

		const textBlock = message.content.find((block) => block.type === 'text')
		const rawResponse = textBlock ? textBlock.text.trim() : ''

		// Parse the JSON response from Claude
		let ocrData = { ...EMPTY_OCR_RESULT }
		if (rawResponse) {
			try {
				// Strip markdown code fences if present
				const jsonString = rawResponse
					.replace(/^```(?:json)?\s*\n?/i, '')
					.replace(/\n?```\s*$/i, '')
					.trim()
				const parsedJson = JSON.parse(jsonString) as Record<string, unknown>

				// Map extracted fields, defaulting to empty string for missing/invalid values
				for (const key of Object.keys(EMPTY_OCR_RESULT)) {
					const value = parsedJson[key]
					if (typeof value === 'string') {
						ocrData[key as keyof typeof EMPTY_OCR_RESULT] = value
					} else if (typeof value === 'number') {
						ocrData[key as keyof typeof EMPTY_OCR_RESULT] = String(value)
					}
				}
			} catch {
				// If JSON parsing fails, return empty fields rather than erroring
				console.error('Failed to parse OCR response as JSON:', rawResponse)
			}
		}

		setCachedResult(cacheKey, ocrData)

		return NextResponse.json(ocrData)
	} catch (err) {
		console.error('Claude API error (ocr):', err)
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json(
			{ error: `Document OCR failed: ${message}` },
			{ status: 500 },
		)
	}
}

export { POST }
