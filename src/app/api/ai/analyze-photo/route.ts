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
	const cacheKey = getCacheKey(parsed.data.photoUrl, 'analyze-photo')
	const cached = getCachedResult<{ description: string }>(cacheKey)
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
						text: 'Analyze this vehicle photo and provide a detailed description of any visible damage.',
					},
				],
			}],
			system: 'You are a professional vehicle damage assessor. Analyze this vehicle photo and provide a detailed description of any visible damage. Include: damage location, severity (minor/moderate/severe), type of damage (dent, scratch, crack, deformation), affected parts, and estimated repair approach. Respond in a structured format.',
		})

		const textBlock = message.content.find((block) => block.type === 'text')
		const description = textBlock ? textBlock.text : 'No analysis could be generated.'

		const result = { description }
		setCachedResult(cacheKey, result)

		return NextResponse.json(result)
	} catch (err) {
		console.error('Claude API error (analyze-photo):', err)
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json(
			{ error: `AI analysis failed: ${message}` },
			{ status: 500 },
		)
	}
}

export { POST }
