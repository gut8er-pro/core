// Calculation auto-fill — extracts repair-relevant data from damage photos.

import { getAnthropicClient } from './anthropic'
import type { ImageData } from './fetch-image'
import { normalizeBodyPaint, normalizeRepairOperation } from './option-values'

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
4. "wheelAlignment": EXACTLY one of "required" | "not_required" | "completed", based on damage location
5. "bodyMeasurements": EXACTLY one of "required" | "not_required" | "completed", based on structural damage indicators
6. "bodyPaint": paint repair scope, EXACTLY one of "not_required" | "partial" (spot or single-panel repaint) | "full" (full section or full vehicle repaint)
7. "plasticRepair": true if plastic parts need repair, false otherwise
8. "estimatedRepairDays": Estimated repair duration in working days (integer)

The values for "wheelAlignment", "bodyMeasurements" and "bodyPaint" are stored identifiers, not prose — emit them exactly as spelled above, in lowercase with the underscore, in every language.

Return ONLY valid JSON. Use null for fields you cannot determine.`

function buildCalculationPrompt(locale: 'en' | 'de'): string {
	// The free text lands in the Gutachten unchanged — nothing downstream
	// translates it — so the language has to be decided here.
	const localeSuffix =
		locale === 'de'
			? '\n\nDie Freitextfelder "repairMethod" und "risks" müssen auf Deutsch verfasst sein (z. B. "Ausbeulen ohne Lackieren (PDR)", "Konventionelle Karosserieinstandsetzung", "Teileersatz"). Die Kennungen für "wheelAlignment", "bodyMeasurements" und "bodyPaint" bleiben exakt wie oben angegeben auf Englisch.'
			: '\n\nWrite "repairMethod" and "risks" strictly in English. Do not switch to German even though the vehicle context is German.'

	return `${CALCULATION_PROMPT}${localeSuffix}`
}

async function extractCalculationData(
	images: ImageData[],
	locale: 'en' | 'de' = 'en',
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
		messages: [
			{
				role: 'user',
				content: [...imageContent, { type: 'text', text: buildCalculationPrompt(locale) }],
			},
		],
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
			wheelAlignment: normalizeRepairOperation(parsed.wheelAlignment),
			bodyMeasurements: normalizeRepairOperation(parsed.bodyMeasurements),
			bodyPaint: normalizeBodyPaint(parsed.bodyPaint),
			plasticRepair: typeof parsed.plasticRepair === 'boolean' ? parsed.plasticRepair : null,
			estimatedRepairDays:
				typeof parsed.estimatedRepairDays === 'number'
					? Math.round(parsed.estimatedRepairDays)
					: null,
		}
	} catch {
		console.error('Failed to parse calculation response:', rawResponse)
		return fallback
	}
}

export type { CalculationAutoFillResult }
export { extractCalculationData, parseCalculationResponse }
