// POST /api/reports/:id/generate — SSE endpoint that runs the AI pipeline.
// Streams progress events to the client as Server-Sent Events.

import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { runPipeline } from '@/lib/ai/pipeline'
import { normalizeVehicleType } from '@/lib/ai/vehicle-lookup'
import type { GenerateEvent, GenerationSummary, OverviewAnalysisResult, InteriorAnalysisResult, TireAnalysisResult } from '@/lib/ai/types'
import type { CalculationAutoFillResult } from '@/lib/ai/calculation-extractor'

type RouteContext = {
	params: Promise<{ id: string }>
}

async function POST(request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id: reportId } = await context.params

	// Read incremental flag from request body
	let incremental = false
	try {
		const body = await request.json() as { incremental?: boolean }
		incremental = body.incremental === true
	} catch {
		// No body or invalid JSON — default to non-incremental
	}

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

	// Fetch all photos for this report (including AI tracking fields)
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
					aiProcessedAt: p.aiProcessedAt,
					aiProcessedHash: p.aiProcessedHash,
				}))

				// Run the pipeline with incremental option
				const summary = await runPipeline(reportId, photoInputs, emit, {
					incrementalOnly: incremental,
				})

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
 * Payload type extracted from the pipeline summary.
 */
type PipelinePayloads = {
	vehicleData: Record<string, unknown>
	accidentData: { claimantLicensePlate: string | null }
	conditionData: {
		damageMarkers: Array<{ x: number; y: number; comment: string }>
		tireResults: TireAnalysisResult[]
		overviewResults: OverviewAnalysisResult[]
		interiorResults: InteriorAnalysisResult[]
	}
	calculationData: CalculationAutoFillResult | null
	photoUpdates: Array<{
		photoId: string
		aiDescription: string | null
		classification: string
		boundingBoxes: Array<{ x: number; y: number; width: number; height: number; label: string; color: string }>
	}>
	photoOrder: string[]
	processedPhotoIds: Array<{ id: string; hash: string }>
}

/**
 * Persists all auto-fill results from the pipeline to the database.
 */
async function persistResults(
	reportId: string,
	summary: GenerationSummary,
): Promise<void> {
	const payloads = (summary as GenerationSummary & { _payloads?: PipelinePayloads })._payloads
	if (!payloads) return

	// 1. Update vehicle info
	{
		const dbData: Record<string, unknown> = {}

		const stringFields = ['vin', 'manufacturer', 'mainType', 'subtype', 'engineDesign', 'transmission', 'vehicleType', 'motorType', 'kbaNumber'] as const
		for (const field of stringFields) {
			if (payloads.vehicleData[field] !== undefined) {
				dbData[field] = payloads.vehicleData[field]
			}
		}

		const numericFields = ['powerKw', 'cylinders', 'engineDisplacementCcm', 'doors', 'seats', 'previousOwners'] as const
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
		if (payloads.vehicleData.lastRegistration) {
			dbData.lastRegistration = new Date(payloads.vehicleData.lastRegistration as string)
		}

		// Enrich vehicleType and motorType from overview photos if VIN/OCR didn't provide them
		if (!dbData.vehicleType) {
			for (const overview of payloads.conditionData.overviewResults) {
				if (overview.bodyType) {
					dbData.vehicleType = normalizeVehicleType(overview.bodyType)
					break
				}
			}
		}

		// Auto-set manufacturer from overview if not from VIN/OCR
		if (!dbData.manufacturer) {
			for (const overview of payloads.conditionData.overviewResults) {
				if (overview.make) {
					dbData.manufacturer = overview.make
					break
				}
			}
		}
		if (!dbData.mainType) {
			for (const overview of payloads.conditionData.overviewResults) {
				if (overview.model) {
					dbData.mainType = overview.model
					break
				}
			}
		}

		if (Object.keys(dbData).length > 0) {
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
	}

	// 2. Update accident info (license plate)
	if (payloads.accidentData.claimantLicensePlate) {
		try {
			await prisma.claimantInfo.upsert({
				where: { reportId },
				create: {
					reportId,
					licensePlate: payloads.accidentData.claimantLicensePlate,
				},
				update: { licensePlate: payloads.accidentData.claimantLicensePlate },
			})
		} catch (err) {
			console.error('Failed to update claimant info:', err)
		}
	}

	// 3. Update condition — damage markers, overview data, interior data
	const hasConditionData =
		payloads.conditionData.damageMarkers.length > 0 ||
		payloads.conditionData.overviewResults.length > 0 ||
		payloads.conditionData.interiorResults.length > 0

	if (hasConditionData) {
		try {
			const conditionUpdateData: Record<string, unknown> = {}

			// Extract data from overview results
			for (const overview of payloads.conditionData.overviewResults) {
				if (overview.color) conditionUpdateData.vehicleColor = overview.color
				if (overview.generalCondition) conditionUpdateData.generalCondition = overview.generalCondition
				if (overview.bodyCondition) conditionUpdateData.bodyCondition = overview.bodyCondition
			}

			// Extract data from interior results
			for (const interior of payloads.conditionData.interiorResults) {
				if (interior.condition) conditionUpdateData.interiorCondition = interior.condition
				if (interior.features.length > 0) conditionUpdateData.specialFeatures = interior.features.join(', ')
				if (interior.mileage !== null) conditionUpdateData.mileageRead = interior.mileage
				if (interior.parkingSensors !== null) conditionUpdateData.parkingSensors = interior.parkingSensors
				if (interior.airbagsDeployed !== null) conditionUpdateData.airbagsDeployed = interior.airbagsDeployed
			}

			if (payloads.conditionData.damageMarkers.length > 0) {
				conditionUpdateData.manualSetup = true
			}

			const condition = await prisma.vehicleCondition.upsert({
				where: { reportId },
				create: { reportId, ...conditionUpdateData },
				update: conditionUpdateData,
			})

			// Create new damage markers (additive — don't delete existing)
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
			console.error('Failed to update condition data:', err)
		}
	}

	// 4. Update tire data — including dotCode and tireType
	console.log(`[Generate] Tire results: ${payloads.conditionData.tireResults.length}`)
	for (const t of payloads.conditionData.tireResults) {
		console.log(`[Generate] Tire: pos=${t.position} size=${t.size} mfr=${t.manufacturer} tread=${t.treadDepth} profile=${t.profileLevel}`)
	}
	if (payloads.conditionData.tireResults.length > 0) {
		try {
			const condition = await prisma.vehicleCondition.upsert({
				where: { reportId },
				create: { reportId },
				update: {},
			})

			let tireSet = await prisma.tireSet.findFirst({
				where: { conditionId: condition.id, setNumber: 1 },
			})
			if (!tireSet) {
				tireSet = await prisma.tireSet.create({
					data: { conditionId: condition.id, setNumber: 1 },
				})
			}

			// Convert treadDepth to mm string; map qualitative labels to estimated mm values
			function profileToMm(tire: TireAnalysisResult): string {
				if (tire.treadDepth !== null) return `${tire.treadDepth}mm`
				// Map qualitative labels to approximate mm values
				switch (tire.profileLevel) {
					case 'good': return '6mm'
					case 'acceptable': return '3mm'
					case 'worn': return '2mm'
					case 'critical': return '1.5mm'
					default: return ''
				}
			}

			// Build tire data from the best result (first with most data)
			const bestTire = payloads.conditionData.tireResults.reduce((best, current) => {
				const bestScore = (best.size ? 1 : 0) + (best.manufacturer ? 1 : 0) + (best.treadDepth !== null ? 1 : 0)
				const currentScore = (current.size ? 1 : 0) + (current.manufacturer ? 1 : 0) + (current.treadDepth !== null ? 1 : 0)
				return currentScore > bestScore ? current : best
			})

			const allPositions = ['VL', 'VR', 'HL', 'HR'] as const

			// If only 1 tire result, fill all 4 positions with same data
			if (payloads.conditionData.tireResults.length === 1) {
				const tire = payloads.conditionData.tireResults[0]!
				const profile = profileToMm(tire)
				for (const position of allPositions) {
					const existingTire = await prisma.tire.findFirst({
						where: { tireSetId: tireSet.id, position },
					})
					const tireData = {
						size: tire.size || undefined,
						profileLevel: profile || undefined,
						manufacturer: tire.manufacturer || undefined,
						usability: tire.usability,
						dotCode: tire.dotCode || undefined,
						tireType: tire.tireType || undefined,
					}
					if (existingTire) {
						await prisma.tire.update({ where: { id: existingTire.id }, data: tireData })
					} else {
						await prisma.tire.create({
							data: {
								tireSetId: tireSet.id,
								position,
								size: tire.size || '',
								profileLevel: profile || '',
								manufacturer: tire.manufacturer || '',
								usability: tire.usability,
								dotCode: tire.dotCode || null,
								tireType: tire.tireType || null,
							},
						})
					}
				}
			} else {
				// Multiple tire results — assign to positions, fill gaps with best data
				const usedPositions = new Set(
					payloads.conditionData.tireResults
						.filter((t) => t.position)
						.map((t) => t.position),
				)
				let nextDefaultIdx = 0

				// First pass: persist tires that have explicit or assigned positions
				const assignedPositions = new Set<string>()
				for (const tire of payloads.conditionData.tireResults) {
					let position = tire.position
					if (!position) {
						while (nextDefaultIdx < allPositions.length && usedPositions.has(allPositions[nextDefaultIdx]!)) {
							nextDefaultIdx++
						}
						if (nextDefaultIdx < allPositions.length) {
							position = allPositions[nextDefaultIdx]!
							usedPositions.add(position)
							nextDefaultIdx++
						} else {
							continue
						}
					}
					assignedPositions.add(position)
					const profile = profileToMm(tire)
					const existingTire = await prisma.tire.findFirst({
						where: { tireSetId: tireSet.id, position },
					})
					const tireData = {
						size: tire.size || undefined,
						profileLevel: profile || undefined,
						manufacturer: tire.manufacturer || undefined,
						usability: tire.usability,
						dotCode: tire.dotCode || undefined,
						tireType: tire.tireType || undefined,
					}
					if (existingTire) {
						await prisma.tire.update({ where: { id: existingTire.id }, data: tireData })
					} else {
						await prisma.tire.create({
							data: {
								tireSetId: tireSet.id,
								position,
								size: tire.size || '',
								profileLevel: profile || '',
								manufacturer: tire.manufacturer || '',
								usability: tire.usability,
								dotCode: tire.dotCode || null,
								tireType: tire.tireType || null,
							},
						})
					}
				}

				// Second pass: fill remaining positions with best tire data
				const bestProfile = profileToMm(bestTire)
				for (const position of allPositions) {
					if (assignedPositions.has(position)) continue
					const existingTire = await prisma.tire.findFirst({
						where: { tireSetId: tireSet.id, position },
					})
					if (existingTire && existingTire.size) continue // don't overwrite existing user data
					const fillData = {
						size: bestTire.size || undefined,
						profileLevel: bestProfile || undefined,
						manufacturer: bestTire.manufacturer || undefined,
						usability: bestTire.usability,
						dotCode: bestTire.dotCode || undefined,
						tireType: bestTire.tireType || undefined,
					}
					if (existingTire) {
						await prisma.tire.update({ where: { id: existingTire.id }, data: fillData })
					} else {
						await prisma.tire.create({
							data: {
								tireSetId: tireSet.id,
								position,
								size: bestTire.size || '',
								profileLevel: bestProfile || '',
								manufacturer: bestTire.manufacturer || '',
								usability: bestTire.usability,
								dotCode: bestTire.dotCode || null,
								tireType: bestTire.tireType || null,
							},
						})
					}
				}
			}
		} catch (err) {
			console.error('Failed to update tire data:', err)
		}
	}

	// 5. Persist calculation data
	if (payloads.calculationData) {
		const calc = payloads.calculationData
		const calcData: Record<string, unknown> = {}
		if (calc.damageClass) calcData.damageClass = calc.damageClass
		if (calc.repairMethod) calcData.repairMethod = calc.repairMethod
		if (calc.risks) calcData.risks = calc.risks
		if (calc.wheelAlignment) calcData.wheelAlignment = calc.wheelAlignment
		if (calc.bodyMeasurements) calcData.bodyMeasurements = calc.bodyMeasurements
		if (calc.bodyPaint) calcData.bodyPaint = calc.bodyPaint
		if (calc.plasticRepair !== null) calcData.plasticRepair = calc.plasticRepair
		if (calc.estimatedRepairDays) calcData.repairTimeDays = calc.estimatedRepairDays

		if (Object.keys(calcData).length > 0) {
			try {
				await prisma.calculation.upsert({
					where: { reportId },
					create: { reportId, ...calcData },
					update: calcData,
				})
			} catch (err) {
				console.error('Failed to update calculation data:', err)
			}
		}
	}

	// 6. Update photo descriptions, classifications, and bounding boxes
	for (const update of payloads.photoUpdates) {
		try {
			await prisma.photo.update({
				where: { id: update.photoId },
				data: {
					aiDescription: update.aiDescription,
					aiClassification: update.classification,
					type: mapClassificationToPhotoType(update.classification),
				},
			})

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

	// 7. Reorder photos
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

	// 8. Stamp processed photos with aiProcessedAt and aiProcessedHash
	const now = new Date()
	for (const processed of payloads.processedPhotoIds) {
		try {
			await prisma.photo.update({
				where: { id: processed.id },
				data: {
					aiProcessedAt: now,
					aiProcessedHash: processed.hash,
				},
			})
		} catch (err) {
			console.error('Failed to stamp photo:', processed.id, err)
		}
	}

	// 9. Persist generation summary + auto-title + touch updatedAt
	try {
		const reportUpdateData: Record<string, unknown> = {
			updatedAt: new Date(),
			aiGenerationSummary: {
				totalFieldsFilled: summary.totalFieldsFilled,
				damageMarkersPlaced: summary.damageMarkersPlaced,
				photosProcessed: summary.photosProcessed,
				classifications: summary.classifications,
				warnings: summary.warnings,
				generatedAt: new Date().toISOString(),
			},
		}

		// Auto-generate a meaningful title from extracted data if still "Untitled Report"
		const currentReport = await prisma.report.findUnique({ where: { id: reportId }, select: { title: true } })
		if (currentReport?.title === 'Untitled Report') {
			const parts: string[] = []
			const manufacturer = payloads.vehicleData.manufacturer as string | undefined
			const model = payloads.vehicleData.mainType as string | undefined
			if (manufacturer) parts.push(manufacturer)
			if (model) parts.push(model)
			// Check overview results if VIN/OCR didn't have make/model
			if (parts.length === 0) {
				for (const o of payloads.conditionData.overviewResults) {
					if (o.make) { parts.push(o.make); break }
				}
				for (const o of payloads.conditionData.overviewResults) {
					if (o.model) { parts.push(o.model); break }
				}
			}
			if (parts.length > 0) {
				const plate = payloads.accidentData.claimantLicensePlate
				const title = plate ? `${parts.join(' ')} - ${plate}` : parts.join(' ')
				reportUpdateData.title = title
			}
		}

		await prisma.report.update({
			where: { id: reportId },
			data: reportUpdateData,
		})
	} catch (err) {
		console.error('Failed to update report summary:', err)
	}
}

export { POST }
