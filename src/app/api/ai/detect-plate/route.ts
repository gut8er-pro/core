import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { aiPhotoRequestSchema } from '@/lib/validations/ai'
import { getAnthropicClient } from '@/lib/ai/anthropic'
import { getCacheKey, getCachedResult, setCachedResult } from '@/lib/ai/cache'
import { fetchImageAsBase64 } from '@/lib/ai/fetch-image'

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
	const cacheKey = getCacheKey(parsed.data.photoUrl, 'detect-plate')
	const cached = getCachedResult<{ plate: string | null }>(cacheKey)
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
					{
						type: 'text',
						text: 'Extract the license plate number from this vehicle image.',
					},
				],
			}],
			system: "Extract the license plate number from this vehicle image. Return ONLY the plate string if found (e.g., 'HB AB 1234'), or null if not visible. Do not include any other text.",
		})

		const textBlock = message.content.find((block) => block.type === 'text')
		const rawResponse = textBlock ? textBlock.text.trim() : ''

		// Parse the plate from the response
		let plate: string | null = null
		if (rawResponse && rawResponse.toLowerCase() !== 'null') {
			// Clean up the response: remove quotes, extra whitespace
			const cleaned = rawResponse.replace(/['"]/g, '').trim()
			if (cleaned.length > 0 && cleaned.toLowerCase() !== 'null') {
				plate = cleaned
			}
		}

		const result = { plate }
		setCachedResult(cacheKey, result)

		return NextResponse.json(result)
	} catch (err) {
		console.error('Claude API error (detect-plate):', err)
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json(
			{ error: `License plate detection failed: ${message}` },
			{ status: 500 },
		)
	}
}

export { POST }
