// Deep damage analysis using Sonnet 4.5 — returns description, severity,
// bounding boxes for photo annotation, and diagram position for SVG marker.

import { getAnthropicClient } from './anthropic'
import { getCachedResult, getCacheKey, setCachedResult } from './cache'
import type { ImageData } from './fetch-image'
import type { DamageAnalysisResult, VehiclePosition } from './types'

function buildDamagePrompt(
	position: VehiclePosition,
	damageLocation: string | null,
	locale: 'en' | 'de' = 'en',
): string {
	const localeSuffix =
		locale === 'de'
			? '\n\nAntworte ausschließlich auf Deutsch (Beschreibungen, Reparaturhinweis und Marker-Kommentar). Enums (severity, damageTypes) bleiben Englisch.'
			: ''

	return `You are a professional German vehicle damage assessor (Kfz-Sachverständiger). Analyze this vehicle damage photo in detail.

The photo was taken from position: ${position}
${damageLocation ? `Preliminary damage location: ${damageLocation}` : ''}

CRITICAL: Report ONLY damage clearly visible in this exact photo. If no damage is visible (clean panel, overview shot, dashboard, document), set "noDamageVisible": true and "diagramPosition": null. Do NOT invent damage from context.

At most ONE diagramPosition per photo (the primary damage location).

Provide your analysis as JSON with these fields:

1. "noDamageVisible": boolean — true when no damage is visible in this photo, false otherwise.

2. "description": Detailed, professional damage description for an insurance report (Gutachten). 2-4 sentences. Empty string if no damage visible.

3. "severity": "minor" (cosmetic only, paint touch-up), "moderate" (requires body work/part replacement), or "severe" (structural damage, safety-critical). Use "minor" if no damage visible.

4. "damageTypes": Array of damage type codes. Use: "dent", "scratch", "crack", "deformation", "paint_damage", "broken_part", "corrosion", "glass_damage", "plastic_damage", "structural". Empty array if no damage.

5. "affectedParts": Array of specific car parts affected, e.g. ["rear bumper", "right taillight assembly"]. Empty array if no damage.

6. "repairApproach": Brief repair recommendation. Empty string if no damage.

7. "estimatedRepairHours": Rough estimate of repair labor hours (number or null).

8. "boundingBoxes": Array of bounding boxes around each visible damage area. Each box:
   - "x", "y": top-left corner as 0.0-1.0 fraction of image width/height
   - "width", "height": as 0.0-1.0 fraction of image dimensions
   - "label": short description
   - "color": "#FF0000" for severe, "#FF8C00" for moderate, "#FFD700" for minor
   Empty array if no damage.

9. "diagramPosition": Where to place a marker on a top-down car diagram (bird's eye view), 0-100 scale, OR null if noDamageVisible is true:
   - x: 0=left side of car, 100=right side. Center=50.
   - y: 0=front of car, 100=rear of car.
   - Examples: front bumper center={x:50,y:5}, left front door={x:12,y:35}, right rear quarter={x:85,y:70}, rear bumper={x:50,y:95}
   - "comment": short marker text for the tooltip

Return ONLY valid JSON.${localeSuffix}`
}

async function analyzeDamage(
	photoId: string,
	imageData: ImageData,
	position: VehiclePosition,
	damageLocation: string | null,
	locale: 'en' | 'de' = 'en',
): Promise<DamageAnalysisResult> {
	const cacheKey = getCacheKey(photoId, `damage-analysis:${locale}`)
	const cached = getCachedResult<DamageAnalysisResult>(cacheKey)
	if (cached) return cached

	const client = getAnthropicClient()

	const message = await client.messages.create({
		model: 'claude-sonnet-4-5-20250929',
		max_tokens: 2048,
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
					{ type: 'text', text: buildDamagePrompt(position, damageLocation, locale) },
				],
			},
		],
	})

	const textBlock = message.content.find((block) => block.type === 'text')
	const rawResponse = textBlock ? textBlock.text.trim() : ''

	const result = parseDamageResponse(photoId, rawResponse)
	setCachedResult(cacheKey, result)
	return result
}

function parseDamageResponse(photoId: string, rawResponse: string): DamageAnalysisResult {
	// Fallback when the AI response is unparsable. Default to "no damage visible"
	// (and a null diagramPosition) so we never invent a marker — the caller
	// filters out markers with `noDamageVisible || diagramPosition === null`.
	const fallback: DamageAnalysisResult = {
		photoId,
		description: '',
		severity: 'minor',
		damageTypes: [],
		affectedParts: [],
		repairApproach: '',
		estimatedRepairHours: null,
		boundingBoxes: [],
		diagramPosition: null,
		noDamageVisible: true,
	}

	try {
		const jsonString = rawResponse
			.replace(/^```(?:json)?\s*\n?/i, '')
			.replace(/\n?```\s*$/i, '')
			.trim()
		const parsed = JSON.parse(jsonString) as Record<string, unknown>

		const noDamageVisible = parsed.noDamageVisible === true

		const severity = ['minor', 'moderate', 'severe'].includes(parsed.severity as string)
			? (parsed.severity as 'minor' | 'moderate' | 'severe')
			: 'moderate'

		const boundingBoxes = Array.isArray(parsed.boundingBoxes)
			? (parsed.boundingBoxes as Array<Record<string, unknown>>)
					.filter((b) => typeof b.x === 'number' && typeof b.y === 'number')
					.map((b) => ({
						x: clamp(b.x as number, 0, 1),
						y: clamp(b.y as number, 0, 1),
						width: clamp((b.width as number) || 0.1, 0, 1),
						height: clamp((b.height as number) || 0.1, 0, 1),
						label: typeof b.label === 'string' ? b.label : 'Damage',
						color: typeof b.color === 'string' ? b.color : '#FF0000',
					}))
			: []

		const diagramRaw = parsed.diagramPosition as Record<string, unknown> | null | undefined
		const diagramPosition =
			!noDamageVisible && diagramRaw && typeof diagramRaw.x === 'number'
				? {
						x: clamp(diagramRaw.x as number, 0, 100),
						y: clamp(diagramRaw.y as number, 0, 100),
						comment: typeof diagramRaw.comment === 'string' ? diagramRaw.comment : 'Damage',
					}
				: null

		return {
			photoId,
			description: typeof parsed.description === 'string' ? parsed.description : '',
			severity,
			damageTypes: Array.isArray(parsed.damageTypes)
				? (parsed.damageTypes as DamageAnalysisResult['damageTypes'])
				: [],
			affectedParts: Array.isArray(parsed.affectedParts) ? (parsed.affectedParts as string[]) : [],
			repairApproach: typeof parsed.repairApproach === 'string' ? parsed.repairApproach : '',
			estimatedRepairHours:
				typeof parsed.estimatedRepairHours === 'number' ? parsed.estimatedRepairHours : null,
			boundingBoxes,
			diagramPosition,
			noDamageVisible,
		}
	} catch {
		console.error('Failed to parse damage analysis response:', rawResponse)
		return fallback
	}
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value))
}

export { analyzeDamage }
