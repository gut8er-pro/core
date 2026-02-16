// Deep damage analysis using Sonnet 4.5 — returns description, severity,
// bounding boxes for photo annotation, and diagram position for SVG marker.

import { getAnthropicClient } from './anthropic'
import { getCacheKey, getCachedResult, setCachedResult } from './cache'
import type { DamageAnalysisResult, VehiclePosition } from './types'
import type { ImageData } from './fetch-image'

function buildDamagePrompt(position: VehiclePosition, damageLocation: string | null): string {
	return `You are a professional German vehicle damage assessor (Kfz-Sachverständiger). Analyze this vehicle damage photo in detail.

The photo was taken from position: ${position}
${damageLocation ? `Preliminary damage location: ${damageLocation}` : ''}

Provide a comprehensive analysis as JSON with these fields:

1. "description": Write a detailed, professional damage description suitable for an insurance report (Gutachten). Be specific about damage location, extent, and type. Write 2-4 sentences.

2. "severity": Rate as "minor" (cosmetic only, paint touch-up), "moderate" (requires body work/part replacement), or "severe" (structural damage, safety-critical)

3. "damageTypes": Array of damage type codes found. Use: "dent", "scratch", "crack", "deformation", "paint_damage", "broken_part", "corrosion", "glass_damage", "plastic_damage", "structural"

4. "affectedParts": Array of specific car parts affected, e.g. ["rear bumper", "right taillight assembly", "rear quarter panel"]

5. "repairApproach": Brief repair recommendation

6. "estimatedRepairHours": Rough estimate of repair labor hours (number or null)

7. "boundingBoxes": Array of bounding boxes around each visible damage area. Each box:
   - "x", "y": top-left corner as 0.0-1.0 fraction of image width/height
   - "width", "height": as 0.0-1.0 fraction of image dimensions
   - "label": short description
   - "color": "#FF0000" for severe, "#FF8C00" for moderate, "#FFD700" for minor

8. "diagramPosition": Where to place a marker on a top-down car diagram (bird's eye view), 0-100 scale:
   - x: 0=left side of car, 100=right side. Center=50.
   - y: 0=front of car, 100=rear of car.
   - Examples: front bumper center={x:50,y:5}, left front door={x:12,y:35}, right rear quarter={x:85,y:70}, rear bumper={x:50,y:95}
   - "comment": short marker text for the tooltip

Return ONLY valid JSON.`
}

async function analyzeDamage(
	photoId: string,
	imageData: ImageData,
	position: VehiclePosition,
	damageLocation: string | null,
): Promise<DamageAnalysisResult> {
	const cacheKey = getCacheKey(photoId, 'damage-analysis')
	const cached = getCachedResult<DamageAnalysisResult>(cacheKey)
	if (cached) return cached

	const client = getAnthropicClient()

	const message = await client.messages.create({
		model: 'claude-sonnet-4-5-20250929',
		max_tokens: 2048,
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
				{ type: 'text', text: buildDamagePrompt(position, damageLocation) },
			],
		}],
	})

	const textBlock = message.content.find((block) => block.type === 'text')
	const rawResponse = textBlock ? textBlock.text.trim() : ''

	const result = parseDamageResponse(photoId, rawResponse)
	setCachedResult(cacheKey, result)
	return result
}

function parseDamageResponse(photoId: string, rawResponse: string): DamageAnalysisResult {
	const fallback: DamageAnalysisResult = {
		photoId,
		description: 'Damage detected but could not be analyzed in detail.',
		severity: 'moderate',
		damageTypes: [],
		affectedParts: [],
		repairApproach: '',
		estimatedRepairHours: null,
		boundingBoxes: [],
		diagramPosition: { x: 50, y: 50, comment: 'Damage detected' },
	}

	try {
		const jsonString = rawResponse
			.replace(/^```(?:json)?\s*\n?/i, '')
			.replace(/\n?```\s*$/i, '')
			.trim()
		const parsed = JSON.parse(jsonString) as Record<string, unknown>

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

		const diagramRaw = parsed.diagramPosition as Record<string, unknown> | undefined
		const diagramPosition = diagramRaw && typeof diagramRaw.x === 'number'
			? {
				x: clamp(diagramRaw.x as number, 0, 100),
				y: clamp(diagramRaw.y as number, 0, 100),
				comment: typeof diagramRaw.comment === 'string' ? diagramRaw.comment : 'Damage',
			}
			: fallback.diagramPosition

		return {
			photoId,
			description: typeof parsed.description === 'string' ? parsed.description : fallback.description,
			severity,
			damageTypes: Array.isArray(parsed.damageTypes) ? parsed.damageTypes as DamageAnalysisResult['damageTypes'] : [],
			affectedParts: Array.isArray(parsed.affectedParts) ? parsed.affectedParts as string[] : [],
			repairApproach: typeof parsed.repairApproach === 'string' ? parsed.repairApproach : '',
			estimatedRepairHours: typeof parsed.estimatedRepairHours === 'number' ? parsed.estimatedRepairHours : null,
			boundingBoxes,
			diagramPosition,
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
