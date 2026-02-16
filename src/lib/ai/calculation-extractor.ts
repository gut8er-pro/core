// Calculation auto-fill — extracts repair-relevant data from damage photos.

import { getAnthropicClient } from './anthropic'
import type { ImageData } from './fetch-image'

type CalculationAutoFillResult = {
	damageClass: string | null
	repairMethod: string | null
	risks: string | null
	wheelAlignment: string | null
	bodyMeasurements: string | null
	bodyPaint: string | null
	plasticRepair: boolean | null
	estimatedRepairDays: number | null
}

const CALCULATION_PROMPT = `You are a German vehicle damage assessor calculating repair costs. Analyze these damage photos and provide repair-relevant information.

Based on the visible damage, determine:
1. "damageClass": German damage classification (I = minor cosmetic, II = moderate, III = significant, IV = severe structural). Use Roman numerals.
2. "repairMethod": Recommended repair method (e.g., "Conventional body repair", "PDR (Paintless Dent Repair)", "Part replacement")
3. "risks": Any repair risks or hidden damage concerns
4. "wheelAlignment": "Required" or "Not required" based on damage location
5. "bodyMeasurements": "Required" or "Not required" based on structural damage indicators
6. "bodyPaint": Paint repair scope (e.g., "Spot repair", "Panel repaint", "Full section repaint")
7. "plasticRepair": true if plastic parts need repair, false otherwise
8. "estimatedRepairDays": Estimated repair duration in working days (integer)

Return ONLY valid JSON. Use null for fields you cannot determine.`

async function extractCalculationData(
	images: ImageData[],
): Promise<CalculationAutoFillResult> {
	const client = getAnthropicClient()

	const imageContent = images.map((img) => ({
		type: 'image' as const,
		source: {
			type: 'base64' as const,
			media_type: img.mediaType,
			data: img.base64,
		},
	}))

	const message = await client.messages.create({
		model: 'claude-sonnet-4-5-20250929',
		max_tokens: 512,
		messages: [{
			role: 'user',
			content: [
				...imageContent,
				{ type: 'text', text: CALCULATION_PROMPT },
			],
		}],
	})

	const textBlock = message.content.find((block) => block.type === 'text')
	const rawResponse = textBlock ? textBlock.text.trim() : ''

	return parseCalculationResponse(rawResponse)
}

function parseCalculationResponse(rawResponse: string): CalculationAutoFillResult {
	const fallback: CalculationAutoFillResult = {
		damageClass: null,
		repairMethod: null,
		risks: null,
		wheelAlignment: null,
		bodyMeasurements: null,
		bodyPaint: null,
		plasticRepair: null,
		estimatedRepairDays: null,
	}

	try {
		const jsonString = rawResponse
			.replace(/^```(?:json)?\s*\n?/i, '')
			.replace(/\n?```\s*$/i, '')
			.trim()
		const parsed = JSON.parse(jsonString) as Record<string, unknown>

		return {
			damageClass: typeof parsed.damageClass === 'string' ? parsed.damageClass : null,
			repairMethod: typeof parsed.repairMethod === 'string' ? parsed.repairMethod : null,
			risks: typeof parsed.risks === 'string' ? parsed.risks : null,
			wheelAlignment: typeof parsed.wheelAlignment === 'string' ? parsed.wheelAlignment : null,
			bodyMeasurements: typeof parsed.bodyMeasurements === 'string' ? parsed.bodyMeasurements : null,
			bodyPaint: typeof parsed.bodyPaint === 'string' ? parsed.bodyPaint : null,
			plasticRepair: typeof parsed.plasticRepair === 'boolean' ? parsed.plasticRepair : null,
			estimatedRepairDays: typeof parsed.estimatedRepairDays === 'number' ? Math.round(parsed.estimatedRepairDays) : null,
		}
	} catch {
		console.error('Failed to parse calculation response:', rawResponse)
		return fallback
	}
}

export { extractCalculationData }
export type { CalculationAutoFillResult }
