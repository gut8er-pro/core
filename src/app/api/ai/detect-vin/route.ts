import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { aiPhotoRequestSchema } from '@/lib/validations/ai'
import { getAnthropicClient } from '@/lib/ai/anthropic'
import { getCacheKey, getCachedResult, setCachedResult } from '@/lib/ai/cache'
import { fetchImageAsBase64 } from '@/lib/ai/fetch-image'

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/

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
	const cacheKey = getCacheKey(parsed.data.photoUrl, 'detect-vin')
	const cached = getCachedResult<{ vin: string | null }>(cacheKey)
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
						text: 'Extract the VIN from this image.',
					},
				],
			}],
			system: 'Extract the Vehicle Identification Number (VIN) from this image. A VIN is a 17-character alphanumeric code. Return ONLY the VIN string if found, or null if not visible. Do not include any other text.',
		})

		const textBlock = message.content.find((block) => block.type === 'text')
		const rawResponse = textBlock ? textBlock.text.trim() : ''

		// Parse and validate the VIN from the response
		let vin: string | null = null
		if (rawResponse && rawResponse.toLowerCase() !== 'null') {
			// Extract a 17-character alphanumeric sequence from the response
			const match = rawResponse.match(/[A-HJ-NPR-Z0-9]{17}/i)
			if (match) {
				const candidate = match[0].toUpperCase()
				if (VIN_PATTERN.test(candidate)) {
					vin = candidate
				}
			}
		}

		const result = { vin }
		setCachedResult(cacheKey, result)

		return NextResponse.json(result)
	} catch (err) {
		console.error('Claude API error (detect-vin):', err)
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json(
			{ error: `VIN detection failed: ${message}` },
			{ status: 500 },
		)
	}
}

export { POST }
