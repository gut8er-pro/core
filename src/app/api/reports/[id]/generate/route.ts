// POST /api/reports/:id/generate — SSE endpoint that runs the AI pipeline.
// Streams progress events to the client as Server-Sent Events.

import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { runPipeline } from '@/lib/ai/pipeline'
import type { GenerateEvent, GenerationSummary } from '@/lib/ai/types'

type RouteContext = {
	params: Promise<{ id: string }>
}

async function POST(request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id: reportId } = await context.params

	// Validate report exists and belongs to user
	const report = await prisma.report.findFirst({
		where: { id: reportId, userId: user!.id },
	})

	if (!report) {
		return new Response(JSON.stringify({ error: 'Report not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	if (report.isLocked) {
		return new Response(JSON.stringify({ error: 'Report is locked' }), {
			status: 403,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	if (!process.env.ANTHROPIC_API_KEY) {
		return new Response(JSON.stringify({ error: 'AI service is not configured' }), {
			status: 503,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	// Fetch all photos for this report
	const photos = await prisma.photo.findMany({
		where: { reportId },
		orderBy: { order: 'asc' },
	})

	if (photos.length === 0) {
		return new Response(JSON.stringify({ error: 'No photos to process' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	// Set up SSE stream
	const encoder = new TextEncoder()
	const stream = new ReadableStream({
		async start(controller) {
			const emit = (event: GenerateEvent) => {
				try {
					const data = `data: ${JSON.stringify(event)}\n\n`
					controller.enqueue(encoder.encode(data))
				} catch {
					// Stream may be closed by client
				}
			}

			try {
				const photoInputs = photos.map((p) => ({
					id: p.id,
					url: p.url,
					aiUrl: p.aiUrl,
				}))

				// Run the pipeline
				const summary = await runPipeline(reportId, photoInputs, emit)

				// Persist auto-fill results to database
				await persistResults(reportId, summary)
			} catch (err) {
				console.error('Generate pipeline error:', err)
				const message = err instanceof Error ? err.message : 'Pipeline failed'
				emit({ type: 'error', message })
			} finally {
				controller.close()
			}
		},
	})

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
		},
	})
}

/**
 * Maps AI classification strings to the Prisma PhotoType enum.
 */
function mapClassificationToPhotoType(classification: string): 'VEHICLE_DIAGONAL' | 'DAMAGE_OVERVIEW' | 'DOCUMENT' | 'OTHER' {
	switch (classification) {
		case 'overview': return 'VEHICLE_DIAGONAL'
		case 'damage': return 'DAMAGE_OVERVIEW'
		case 'document': return 'DOCUMENT'
		case 'vin': return 'DOCUMENT'
		default: return 'OTHER'
	}
}

/**
 * Persists all auto-fill results from the pipeline to the database.
 */
async function persistResults(
	reportId: string,
	summary: GenerationSummary,
): Promise<void> {
	// Access the internal payloads attached by the pipeline
	const payloads = (summary as GenerationSummary & {
		_payloads?: {
			vehicleData: Record<string, unknown>
			accidentData: { claimantLicensePlate: string | null }
			conditionData: {
				damageMarkers: Array<{ x: number; y: number; comment: string }>
				tireResults: Array<{
					manufacturer: string | null
					size: string | null
					position: string | null
					usability: number
					profileLevel: string | null
				}>
			}
			photoUpdates: Array<{
				photoId: string
				aiDescription: string | null
				classification: string
				boundingBoxes: Array<{ x: number; y: number; width: number; height: number; label: string; color: string }>
			}>
			photoOrder: string[]
		}
	})._payloads

	if (!payloads) return

	// 1. Update vehicle info
	if (Object.keys(payloads.vehicleData).length > 0) {
		const dbData: Record<string, unknown> = {}

		// String fields (must match Prisma schema field names exactly)
		const stringFields = ['vin', 'manufacturer', 'mainType', 'subtype', 'engineDesign', 'transmission', 'vehicleType', 'motorType'] as const
		for (const field of stringFields) {
			if (payloads.vehicleData[field] !== undefined) {
				dbData[field] = payloads.vehicleData[field]
			}
		}

		// Numeric fields (must match Prisma schema field names exactly)
		const numericFields = ['powerKw', 'cylinders', 'engineDisplacementCcm', 'doors', 'seats'] as const
		for (const field of numericFields) {
			if (payloads.vehicleData[field] !== undefined) {
				const val = Number(payloads.vehicleData[field])
				dbData[field] = Number.isNaN(val) ? null : val
			}
		}

		// Auto-calculate HP from kW
		if (dbData.powerKw && typeof dbData.powerKw === 'number') {
			dbData.powerHp = Math.round(dbData.powerKw * 1.36)
		}

		// Date fields
		if (payloads.vehicleData.firstRegistration) {
			dbData.firstRegistration = new Date(payloads.vehicleData.firstRegistration as string)
		}

		try {
			await prisma.vehicleInfo.upsert({
				where: { reportId },
				create: { reportId, ...dbData },
				update: dbData,
			})
		} catch (err) {
			console.error('Failed to update vehicle info:', err)
		}
	}

	// 2. Update accident info (license plate)
	if (payloads.accidentData.claimantLicensePlate) {
		try {
			const existing = await prisma.claimantInfo.findUnique({ where: { reportId } })
			if (existing) {
				await prisma.claimantInfo.update({
					where: { reportId },
					data: { licensePlate: payloads.accidentData.claimantLicensePlate },
				})
			} else {
				await prisma.claimantInfo.create({
					data: {
						reportId,
						licensePlate: payloads.accidentData.claimantLicensePlate,
					},
				})
			}
		} catch (err) {
			console.error('Failed to update claimant info:', err)
		}
	}

	// 3. Update condition (damage markers) — DamageMarker uses conditionId, not reportId
	if (payloads.conditionData.damageMarkers.length > 0) {
		try {
			const condition = await prisma.vehicleCondition.upsert({
				where: { reportId },
				create: { reportId, manualSetup: true },
				update: { manualSetup: true },
			})

			for (const marker of payloads.conditionData.damageMarkers) {
				await prisma.damageMarker.create({
					data: {
						conditionId: condition.id,
						x: marker.x,
						y: marker.y,
						comment: marker.comment,
					},
				})
			}
		} catch (err) {
			console.error('Failed to create damage markers:', err)
		}
	}

	// 4. Update tire data — TireSet uses conditionId, not reportId
	if (payloads.conditionData.tireResults.length > 0) {
		try {
			const condition = await prisma.vehicleCondition.upsert({
				where: { reportId },
				create: { reportId },
				update: {},
			})

			// Find or create tire set 1 for this condition
			let tireSet = await prisma.tireSet.findFirst({
				where: { conditionId: condition.id, setNumber: 1 },
			})
			if (!tireSet) {
				tireSet = await prisma.tireSet.create({
					data: { conditionId: condition.id, setNumber: 1 },
				})
			}

			for (const tire of payloads.conditionData.tireResults) {
				if (tire.position) {
					// Find existing tire by tireSetId + position
					const existingTire = await prisma.tire.findFirst({
						where: { tireSetId: tireSet.id, position: tire.position },
					})

					if (existingTire) {
						await prisma.tire.update({
							where: { id: existingTire.id },
							data: {
								size: tire.size || undefined,
								profileLevel: tire.profileLevel || undefined,
								manufacturer: tire.manufacturer || undefined,
								usability: tire.usability,
							},
						})
					} else {
						await prisma.tire.create({
							data: {
								tireSetId: tireSet.id,
								position: tire.position,
								size: tire.size || '',
								profileLevel: tire.profileLevel || '',
								manufacturer: tire.manufacturer || '',
								usability: tire.usability,
							},
						})
					}
				}
			}
		} catch (err) {
			console.error('Failed to update tire data:', err)
		}
	}

	// 5. Update photo descriptions, classifications, and order
	for (const update of payloads.photoUpdates) {
		try {
			await prisma.photo.update({
				where: { id: update.photoId },
				data: {
					aiDescription: update.aiDescription,
					type: mapClassificationToPhotoType(update.classification),
				},
			})

			// Save AI bounding box annotations
			if (update.boundingBoxes.length > 0) {
				await prisma.annotation.create({
					data: {
						photoId: update.photoId,
						type: 'ai-bounding-box',
						color: '#16A34A',
						coordinates: {},
						fabricJson: {
							objects: update.boundingBoxes.map((box) => ({
								type: 'rect',
								left: box.x,
								top: box.y,
								width: box.width,
								height: box.height,
								fill: 'transparent',
								stroke: box.color,
								strokeWidth: 3,
								label: box.label,
							})),
						},
					},
				})
			}
		} catch (err) {
			console.error('Failed to update photo:', update.photoId, err)
		}
	}

	// 6. Reorder photos
	for (let i = 0; i < payloads.photoOrder.length; i++) {
		const photoId = payloads.photoOrder[i]
		if (!photoId) continue
		try {
			await prisma.photo.update({
				where: { id: photoId },
				data: { order: i },
			})
		} catch (err) {
			console.error('Failed to reorder photo:', photoId, err)
		}
	}

	// 7. Touch report's updatedAt
	try {
		await prisma.report.update({
			where: { id: reportId },
			data: { updatedAt: new Date() },
		})
	} catch (err) {
		console.error('Failed to touch report:', err)
	}
}

export { POST }
