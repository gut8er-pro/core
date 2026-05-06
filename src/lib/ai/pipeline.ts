// Pipeline orchestrator — coordinates classification, processing, and auto-fill.

import { normalizeConditionValue } from '@/lib/pdf/translations'
import { getAnthropicClient } from './anthropic'
import { getCachedResult, getCacheKey, setCachedResult } from './cache'
import type { CalculationAutoFillResult } from './calculation-extractor'
import { extractCalculationData } from './calculation-extractor'
import { classifyPhoto } from './classifier'
import { analyzeDamage } from './damage-analyzer'
import type { ImageData } from './fetch-image'
import { fetchImageAsBase64 } from './fetch-image'
import { analyzeInterior } from './interior-analyzer'
import { analyzeOverview } from './overview-analyzer'
import { analyzeTire } from './tire-analyzer'
import type {
	ClassificationResult,
	DiagramPosition,
	GenerateEvent,
	GenerationSummary,
	InteriorAnalysisResult,
	OcrExtractionResult,
	OverviewAnalysisResult,
	PhotoProcessingResult,
	TireAnalysisResult,
	VehicleLookupResult,
} from './types'
import { lookupVehicleByVin, mergeVehicleData } from './vehicle-lookup'

type PhotoInput = {
	id: string
	url: string
	aiUrl: string | null
	aiProcessedAt: Date | null
	aiProcessedHash: string | null
}

type PipelineOptions = {
	incrementalOnly?: boolean
	forcePhotoIds?: string[]
}

type EmitFn = (event: GenerateEvent) => void

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/

/**
 * Simple hash for URL change detection.
 */
function hashUrl(url: string): string {
	let hash = 0
	for (let i = 0; i < url.length; i++) {
		const char = url.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash |= 0
	}
	return hash.toString(36)
}

/**
 * Filters photos to only those that need processing.
 */
function filterPhotosForProcessing(
	photos: PhotoInput[],
	options: PipelineOptions,
): { toProcess: PhotoInput[]; skipped: PhotoInput[] } {
	if (!options.incrementalOnly) {
		return { toProcess: photos, skipped: [] }
	}

	const toProcess: PhotoInput[] = []
	const skipped: PhotoInput[] = []

	for (const photo of photos) {
		const forced = options.forcePhotoIds?.includes(photo.id)
		if (forced) {
			toProcess.push(photo)
			continue
		}

		const currentUrl = photo.aiUrl || photo.url
		const currentHash = hashUrl(currentUrl)

		// Skip if already processed and URL hasn't changed
		if (photo.aiProcessedAt && photo.aiProcessedHash === currentHash) {
			skipped.push(photo)
		} else {
			toProcess.push(photo)
		}
	}

	return { toProcess, skipped }
}

/**
 * Runs the full Generate Report pipeline.
 * Emits progress events via the `emit` callback.
 */
async function runPipeline(
	_reportId: string,
	photos: PhotoInput[],
	emit: EmitFn,
	options: PipelineOptions = {},
	locale: 'en' | 'de' = 'en',
): Promise<GenerationSummary> {
	const summary: GenerationSummary = {
		photosProcessed: 0,
		classifications: {},
		autoFilledFields: { vehicle: [], accident: [], condition: [] },
		totalFieldsFilled: 0,
		damageMarkersPlaced: 0,
		warnings: [],
		photoOrder: [],
	}

	if (photos.length === 0) {
		emit({ type: 'complete', summary })
		return summary
	}

	// --- Incremental filtering ---
	const { toProcess, skipped } = filterPhotosForProcessing(photos, options)

	if (toProcess.length === 0) {
		summary.warnings.push('All photos already processed — no new photos to analyze')
		emit({ type: 'complete', summary })
		return summary
	}

	if (skipped.length > 0) {
		emit({
			type: 'progress',
			step: 'filter',
			current: skipped.length,
			total: photos.length,
			message: `Skipping ${skipped.length} already-processed photos, analyzing ${toProcess.length} new photos...`,
		})
	}

	// --- Step 1: Fetch images and classify ---
	emit({
		type: 'progress',
		step: 'classify',
		current: 0,
		total: toProcess.length,
		message: 'Classifying photos...',
	})

	const imageDataMap = new Map<string, Awaited<ReturnType<typeof fetchImageAsBase64>>>()
	const classifications: ClassificationResult[] = []

	// Fetch all images as base64 in parallel
	const fetchResults = await Promise.allSettled(
		toProcess.map(async (photo) => {
			const url = photo.aiUrl || photo.url
			const data = await fetchImageAsBase64(url)
			imageDataMap.set(photo.id, data)
			return data
		}),
	)

	for (let i = 0; i < fetchResults.length; i++) {
		const fetchResult = fetchResults[i]
		const photo = toProcess[i]
		if (fetchResult && fetchResult.status === 'rejected' && photo) {
			console.error(`Failed to fetch image for photo ${photo.id}:`, fetchResult.reason)
			summary.warnings.push(`Could not fetch photo ${photo.id}`)
		}
	}

	// Classify all photos in parallel
	const classifyResults = await Promise.allSettled(
		toProcess.map(async (photo, index) => {
			const imageData = imageDataMap.get(photo.id)
			if (!imageData) return null

			const result = await classifyPhoto(photo.id, imageData)
			classifications.push(result)

			emit({
				type: 'photo_classified',
				photoId: photo.id,
				classification: result,
			})
			emit({
				type: 'progress',
				step: 'classify',
				current: index + 1,
				total: toProcess.length,
				message: `Classified ${index + 1}/${toProcess.length} photos...`,
			})

			return result
		}),
	)

	for (const result of classifyResults) {
		if (result.status === 'rejected') {
			console.error('Classification failed:', result.reason)
		}
	}

	// Count classifications
	for (const c of classifications) {
		summary.classifications[c.type] = (summary.classifications[c.type] || 0) + 1
	}

	// --- Step 2: Route and process by type ---
	emit({
		type: 'progress',
		step: 'process',
		current: 0,
		total: classifications.length,
		message: 'Analyzing photos...',
	})

	const processedResults: PhotoProcessingResult[] = []
	let processedCount = 0

	const processPhoto = async (
		classification: ClassificationResult,
	): Promise<PhotoProcessingResult> => {
		const imageData = imageDataMap.get(classification.photoId)
		if (!imageData) return { type: 'other', result: null }

		switch (classification.type) {
			case 'damage': {
				const result = await analyzeDamage(
					classification.photoId,
					imageData,
					classification.position,
					classification.damageLocation,
					locale,
				)
				return { type: 'damage', result }
			}
			case 'vin': {
				const result = await detectVinFromImage(classification.photoId, imageData)
				return { type: 'vin', result }
			}
			case 'plate': {
				const result = await detectPlateFromImage(classification.photoId, imageData)
				return { type: 'plate', result }
			}
			case 'document': {
				const result = await ocrDocument(classification.photoId, imageData)
				return { type: 'document', result }
			}
			case 'overview': {
				const result = await analyzeOverview(classification.photoId, imageData, locale)
				return { type: 'overview', result }
			}
			case 'tire': {
				const result = await analyzeTire(
					classification.photoId,
					imageData,
					classification.position,
					locale,
				)
				return { type: 'tire', result }
			}
			case 'interior': {
				const result = await analyzeInterior(classification.photoId, imageData, locale)
				return { type: 'interior', result }
			}
			default:
				return { type: 'other', result: null }
		}
	}

	// Process all photos in parallel (max 5 concurrent)
	const CONCURRENCY = 5
	for (let i = 0; i < classifications.length; i += CONCURRENCY) {
		const batch = classifications.slice(i, i + CONCURRENCY)
		const results = await Promise.allSettled(batch.map(processPhoto))

		for (let j = 0; j < results.length; j++) {
			processedCount++
			const r = results[j]
			const batchItem = batch[j]
			if (!r || !batchItem) continue

			if (r.status === 'fulfilled') {
				processedResults.push(r.value)
				emit({
					type: 'photo_processed',
					photoId: batchItem.photoId,
					result: r.value,
				})
			} else {
				console.error('Processing failed for photo:', batchItem.photoId, r.reason)
				processedResults.push({ type: 'other', result: null })
			}
			emit({
				type: 'progress',
				step: 'process',
				current: processedCount,
				total: classifications.length,
				message: `Analyzed ${processedCount}/${classifications.length} photos...`,
			})
		}
	}

	summary.photosProcessed = processedCount

	// --- Step 3: Vehicle lookup ---
	const extractedVin = findExtractedVin(processedResults)
	const extractedPlate = findExtractedPlate(processedResults)
	const extractedOcr = findExtractedOcr(processedResults)

	let vehicleLookup: VehicleLookupResult | null = null
	if (extractedVin) {
		emit({
			type: 'progress',
			step: 'lookup',
			current: 0,
			total: 1,
			message: 'Looking up vehicle data...',
		})
		vehicleLookup = await lookupVehicleByVin(extractedVin)
		if (vehicleLookup.warnings.length > 0) {
			summary.warnings.push(...vehicleLookup.warnings)
		}
		emit({
			type: 'progress',
			step: 'lookup',
			current: 1,
			total: 1,
			message: 'Vehicle data retrieved',
		})
	}

	// --- Step 3b: Calculation extraction from damage photos ---
	let calculationData: CalculationAutoFillResult | null = null
	const damageImages = collectDamageImages(classifications, imageDataMap)
	if (damageImages.length > 0) {
		emit({
			type: 'progress',
			step: 'calculation',
			current: 0,
			total: 1,
			message: 'Extracting calculation data...',
		})
		try {
			calculationData = await extractCalculationData(damageImages)
		} catch (err) {
			console.error('Calculation extraction failed:', err)
			summary.warnings.push('Could not extract calculation data from damage photos')
		}
		emit({
			type: 'progress',
			step: 'calculation',
			current: 1,
			total: 1,
			message: 'Calculation data extracted',
		})
	}

	// --- Step 4: Build auto-fill payloads ---
	emit({
		type: 'progress',
		step: 'autofill',
		current: 0,
		total: 5,
		message: 'Auto-filling report sections...',
	})

	// 4a: Vehicle tab
	const vehicleData = mergeVehicleData(vehicleLookup, extractedOcr)
	if (Object.keys(vehicleData).length > 0) {
		summary.autoFilledFields.vehicle = Object.keys(vehicleData)
		emit({ type: 'auto_fill', section: 'vehicle', fields: Object.keys(vehicleData) })
	}
	emit({ type: 'progress', step: 'autofill', current: 1, total: 5, message: 'Vehicle data filled' })

	// 4b: Accident info (license plate + owner from registration document)
	const accidentFields: string[] = []
	if (extractedPlate || extractedOcr?.licensePlate) accidentFields.push('claimantLicensePlate')
	if (extractedOcr) {
		if (extractedOcr.ownerFirstName) accidentFields.push('claimantFirstName')
		if (extractedOcr.ownerLastName) accidentFields.push('claimantLastName')
		if (extractedOcr.ownerStreet) accidentFields.push('claimantStreet')
		if (extractedOcr.ownerPostcode) accidentFields.push('claimantPostcode')
		if (extractedOcr.ownerCity) accidentFields.push('claimantLocation')
	}
	if (accidentFields.length > 0) {
		summary.autoFilledFields.accident = accidentFields
		emit({ type: 'auto_fill', section: 'accident', fields: accidentFields })
	}
	emit({
		type: 'progress',
		step: 'autofill',
		current: 2,
		total: 5,
		message: 'Accident info filled',
	})

	// 4c: Condition tab (damage markers + tire data + overview/interior data)
	const damageMarkers = collectDamageMarkers(processedResults)
	const tireResults = collectTireResults(processedResults)
	const overviewResults = collectOverviewResults(processedResults)
	const interiorResults = collectInteriorResults(processedResults)

	if (damageMarkers.length > 0) {
		summary.autoFilledFields.condition.push('damageMarkers')
		summary.damageMarkersPlaced = damageMarkers.length
	}
	if (tireResults.length > 0) {
		summary.autoFilledFields.condition.push('tireData')
	}
	if (overviewResults.length > 0) {
		summary.autoFilledFields.condition.push(
			'vehicleColor',
			'generalCondition',
			'bodyCondition',
			'paintType',
			'paintCondition',
			'drivingAbility',
		)
	}
	if (interiorResults.length > 0) {
		summary.autoFilledFields.condition.push('interiorCondition', 'specialFeatures')
		if (interiorResults.some((r) => r.mileage !== null))
			summary.autoFilledFields.condition.push('mileageRead')
		if (interiorResults.some((r) => r.parkingSensors !== null))
			summary.autoFilledFields.condition.push('parkingSensors')
		if (interiorResults.some((r) => r.airbagsDeployed !== null))
			summary.autoFilledFields.condition.push('airbagsDeployed')
	}
	emit({ type: 'auto_fill', section: 'condition', fields: summary.autoFilledFields.condition })
	emit({
		type: 'progress',
		step: 'autofill',
		current: 3,
		total: 5,
		message: 'Condition data filled',
	})

	// 4d: Calculation tab
	const calculationFields: string[] = []
	if (calculationData) {
		if (calculationData.damageClass) calculationFields.push('damageClass')
		if (calculationData.repairMethod) calculationFields.push('repairMethod')
		if (calculationData.risks) calculationFields.push('risks')
		if (calculationData.wheelAlignment) calculationFields.push('wheelAlignment')
		if (calculationData.bodyMeasurements) calculationFields.push('bodyMeasurements')
		if (calculationData.bodyPaint) calculationFields.push('bodyPaint')
		if (calculationData.plasticRepair !== null) calculationFields.push('plasticRepair')
		if (calculationData.estimatedRepairDays) calculationFields.push('repairTimeDays')
	}
	if (calculationFields.length > 0) {
		emit({ type: 'auto_fill', section: 'calculation', fields: calculationFields })
	}
	emit({
		type: 'progress',
		step: 'autofill',
		current: 4,
		total: 5,
		message: 'Calculation data filled',
	})

	// 4e: Photo descriptions and ordering
	const photoOrder = buildPhotoOrder(classifications)
	summary.photoOrder = photoOrder
	emit({ type: 'progress', step: 'autofill', current: 5, total: 5, message: 'Photos reordered' })

	// Calculate total fields filled
	summary.totalFieldsFilled =
		summary.autoFilledFields.vehicle.length +
		summary.autoFilledFields.accident.length +
		summary.autoFilledFields.condition.length +
		calculationFields.length

	// Owner data extracted from the registration certificate (Halter). The
	// route handler will only fill claimant fields that are currently empty —
	// it must never overwrite user-entered values.
	const ownerData = extractedOcr
		? {
				firstName: extractedOcr.ownerFirstName?.trim() || null,
				lastName: extractedOcr.ownerLastName?.trim() || null,
				street: extractedOcr.ownerStreet?.trim() || null,
				postcode: extractedOcr.ownerPostcode?.trim() || null,
				location: extractedOcr.ownerCity?.trim() || null,
			}
		: null

	// Build the auto-fill payloads for the caller to persist
	const autoFillPayloads = {
		vehicleData,
		accidentData: {
			claimantLicensePlate: extractedPlate || extractedOcr?.licensePlate || null,
		},
		conditionData: {
			damageMarkers: deduplicateMarkers(damageMarkers),
			tireResults,
			overviewResults,
			interiorResults,
		},
		ownerData,
		calculationData,
		photoUpdates: buildPhotoUpdates(classifications, processedResults),
		photoOrder,
		processedPhotoIds: toProcess.map((p) => ({
			id: p.id,
			hash: hashUrl(p.aiUrl || p.url),
		})),
	}

	// Attach payloads to summary for the route handler to use
	;(summary as GenerationSummary & { _payloads: typeof autoFillPayloads })._payloads =
		autoFillPayloads

	emit({ type: 'complete', summary })
	return summary
}

// --- Helper functions ---

function findExtractedVin(results: PhotoProcessingResult[]): string | null {
	for (const r of results) {
		if (r.type === 'vin' && r.result?.vin) return r.result.vin
		if (r.type === 'document' && r.result?.vin) {
			const match = r.result.vin.match(/[A-HJ-NPR-Z0-9]{17}/i)
			if (match && VIN_PATTERN.test(match[0].toUpperCase())) {
				return match[0].toUpperCase()
			}
		}
	}
	return null
}

function findExtractedPlate(results: PhotoProcessingResult[]): string | null {
	for (const r of results) {
		if (r.type === 'plate' && r.result?.plate) return r.result.plate
	}
	return null
}

function findExtractedOcr(results: PhotoProcessingResult[]): OcrExtractionResult | null {
	for (const r of results) {
		if (r.type === 'document' && r.result) return r.result
	}
	return null
}

function collectDamageMarkers(results: PhotoProcessingResult[]): DiagramPosition[] {
	const markers: DiagramPosition[] = []
	for (const r of results) {
		// Skip when the analyzer explicitly reported no visible damage, or
		// failed to localize damage on the diagram. This prevents hallucinated
		// fallback markers (e.g. centre marker for clean overview shots).
		if (r.type !== 'damage' || !r.result) continue
		if (r.result.noDamageVisible) continue
		if (!r.result.diagramPosition) continue

		// Enrich marker comment with severity and repair approach
		const enrichedComment = [
			r.result.diagramPosition.comment,
			r.result.severity ? `Severity: ${r.result.severity}` : null,
			r.result.repairApproach ? `Repair: ${r.result.repairApproach}` : null,
		]
			.filter(Boolean)
			.join(' | ')

		markers.push({
			...r.result.diagramPosition,
			comment: enrichedComment || r.result.diagramPosition.comment,
		})
	}
	return markers
}

function collectTireResults(results: PhotoProcessingResult[]): TireAnalysisResult[] {
	const tires: TireAnalysisResult[] = []
	for (const r of results) {
		if (r.type === 'tire' && r.result) {
			tires.push(r.result)
		}
	}
	return tires
}

function collectOverviewResults(results: PhotoProcessingResult[]): OverviewAnalysisResult[] {
	const overviews: OverviewAnalysisResult[] = []
	for (const r of results) {
		if (r.type === 'overview' && r.result) {
			// Normalize string-enum values to canonical title-case keys that match
			// `valueTranslations` in src/lib/pdf/translations.ts. The analyzer's
			// parser already validates against an allowed list, so this is mostly
			// a defensive pass for any pre-existing/cached entries.
			overviews.push({
				...r.result,
				generalCondition: normalizeConditionValue(r.result.generalCondition),
				bodyCondition: normalizeConditionValue(r.result.bodyCondition),
				paintType: normalizeConditionValue(r.result.paintType),
				paintCondition: normalizeConditionValue(r.result.paintCondition),
				drivingAbility: normalizeConditionValue(r.result.drivingAbility),
			})
		}
	}
	return overviews
}

function collectInteriorResults(results: PhotoProcessingResult[]): InteriorAnalysisResult[] {
	const interiors: InteriorAnalysisResult[] = []
	for (const r of results) {
		if (r.type === 'interior' && r.result) {
			// Normalize "good" → "Good" so PDF translateValue() finds the key.
			interiors.push({
				...r.result,
				condition: normalizeConditionValue(r.result.condition),
			})
		}
	}
	return interiors
}

function collectDamageImages(
	classifications: ClassificationResult[],
	imageDataMap: Map<string, ImageData>,
): ImageData[] {
	const images: ImageData[] = []
	for (const c of classifications) {
		if (c.type === 'damage') {
			const img = imageDataMap.get(c.photoId)
			if (img) images.push(img)
		}
	}
	// Limit to 5 images to control cost/tokens
	return images.slice(0, 5)
}

function deduplicateMarkers(markers: DiagramPosition[], threshold: number = 10): DiagramPosition[] {
	const result: DiagramPosition[] = []

	for (const marker of markers) {
		const nearby = result.find(
			(existing) =>
				Math.abs(existing.x - marker.x) < threshold && Math.abs(existing.y - marker.y) < threshold,
		)

		if (!nearby) {
			result.push({ ...marker })
		} else if (marker.comment) {
			nearby.comment += `; ${marker.comment}`
		}
	}

	return result
}

function buildPhotoOrder(classifications: ClassificationResult[]): string[] {
	return [...classifications]
		.sort((a, b) => a.suggestedOrder - b.suggestedOrder)
		.map((c) => c.photoId)
}

type PhotoUpdate = {
	photoId: string
	aiDescription: string | null
	classification: string
	boundingBoxes: Array<{
		x: number
		y: number
		width: number
		height: number
		label: string
		color: string
	}>
}

function buildPhotoUpdates(
	classifications: ClassificationResult[],
	results: PhotoProcessingResult[],
): PhotoUpdate[] {
	return classifications.map((c) => {
		const processed = results.find((r) => {
			if (r.result && 'photoId' in r.result) return r.result.photoId === c.photoId
			return false
		})

		let aiDescription: string | null = null
		let boundingBoxes: PhotoUpdate['boundingBoxes'] = []

		if (processed?.type === 'damage' && processed.result) {
			aiDescription = processed.result.description
			boundingBoxes = processed.result.boundingBoxes
		} else if (processed?.type === 'overview' && processed.result) {
			aiDescription = processed.result.description
		} else if (processed?.type === 'interior' && processed.result) {
			aiDescription = processed.result.description
		} else if (processed?.type === 'tire' && processed.result) {
			const tire = processed.result
			aiDescription =
				[tire.manufacturer, tire.size, tire.condition].filter(Boolean).join(' — ') || null
		}

		return {
			photoId: c.photoId,
			aiDescription,
			classification: c.type,
			boundingBoxes,
		}
	})
}

export type { EmitFn, PhotoInput, PhotoUpdate, PipelineOptions }
export { hashUrl, runPipeline }

// --- Inline VIN/Plate/OCR detection (reuses logic from existing routes) ---

async function detectVinFromImage(
	photoId: string,
	imageData: ImageData,
): Promise<{ photoId: string; vin: string | null }> {
	const cacheKey = getCacheKey(photoId, 'detect-vin')
	const cached = getCachedResult<{ photoId: string; vin: string | null }>(cacheKey)
	if (cached) return cached

	const client = getAnthropicClient()
	const message = await client.messages.create({
		model: 'claude-haiku-4-5-20251001',
		max_tokens: 256,
		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'image',
						source: { type: 'base64', media_type: imageData.mediaType, data: imageData.base64 },
					},
					{
						type: 'text',
						text: 'Extract the Vehicle Identification Number (VIN) from this image. A VIN is a 17-character alphanumeric code (no I, O, or Q). Return ONLY the VIN string if found, or "null" if not visible.',
					},
				],
			},
		],
	})

	const textBlock = message.content.find((b) => b.type === 'text')
	const raw = textBlock ? textBlock.text.trim() : ''

	let vin: string | null = null
	if (raw && raw.toLowerCase() !== 'null') {
		const match = raw.match(/[A-HJ-NPR-Z0-9]{17}/i)
		if (match && VIN_PATTERN.test(match[0].toUpperCase())) {
			vin = match[0].toUpperCase()
		}
	}

	const result = { photoId, vin }
	setCachedResult(cacheKey, result)
	return result
}

// German license plates: 1-3 city-code letters (allowing umlauts), 1-2 letters,
// 1-4 digits, optional E (electric) or H (historic) suffix.
// Examples: "FÜ BP 147", "B AB 1234", "M-XX-9999E", "HH-WK 1H".
const GERMAN_PLATE_RE = /^[A-ZÄÖÜ]{1,3}[ -][A-Z]{1,2}[ -]\d{1,4}[EH]?$/

const PLATE_PROMPT_BASIC =
	'Extract the COMPLETE license plate from this vehicle photo. German plate format: 1-3 city letters (umlauts ok like Ü, Ä, Ö), space or dash, 1-2 letters, space or dash, 1-4 digits, optional E or H suffix. Examples: "FÜ BP 147", "B AB 1234", "M-XX-9999E". Read the ENTIRE plate including all letters and digits — do not abbreviate. Return ONLY the plate as written, or "null" if not visible.'

const PLATE_PROMPT_RETRY =
	"The plate must match exactly this regex: ^[A-ZÄÖÜ]{1,3}[ -][A-Z]{1,2}[ -]\\d{1,4}[EH]?$. Re-read the plate carefully. Return ONLY the full plate string (e.g., 'FÜ BP 147') or 'null' if not visible. Do NOT truncate or abbreviate."

function cleanPlate(raw: string): string {
	return raw.replace(/['"`]/g, '').trim().toUpperCase()
}

async function callPlateModel(
	client: ReturnType<typeof getAnthropicClient>,
	imageData: ImageData,
	prompt: string,
) {
	const message = await client.messages.create({
		model: 'claude-haiku-4-5-20251001',
		max_tokens: 256,
		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'image',
						source: { type: 'base64', media_type: imageData.mediaType, data: imageData.base64 },
					},
					{ type: 'text', text: prompt },
				],
			},
		],
	})
	const textBlock = message.content.find((b) => b.type === 'text')
	return textBlock ? textBlock.text.trim() : ''
}

async function detectPlateFromImage(
	photoId: string,
	imageData: ImageData,
): Promise<{ photoId: string; plate: string | null }> {
	const cacheKey = getCacheKey(photoId, 'detect-plate-v2')
	const cached = getCachedResult<{ photoId: string; plate: string | null }>(cacheKey)
	if (cached) return cached

	const client = getAnthropicClient()

	// First attempt — generic prompt with format hints.
	const firstRaw = await callPlateModel(client, imageData, PLATE_PROMPT_BASIC)
	let plate: string | null = null
	if (firstRaw && firstRaw.toLowerCase() !== 'null') {
		const cleaned = cleanPlate(firstRaw)
		if (cleaned && GERMAN_PLATE_RE.test(cleaned)) {
			plate = cleaned
		}
	}

	// Retry once with stricter prompt if first attempt failed validation.
	if (!plate && firstRaw && firstRaw.toLowerCase() !== 'null') {
		const retryRaw = await callPlateModel(client, imageData, PLATE_PROMPT_RETRY)
		if (retryRaw && retryRaw.toLowerCase() !== 'null') {
			const cleaned = cleanPlate(retryRaw)
			if (cleaned && GERMAN_PLATE_RE.test(cleaned)) {
				plate = cleaned
			}
		}
	}

	// If still invalid, return null rather than a malformed plate. No plate
	// is better than a wrong one — the user can fill it manually.
	const result = { photoId, plate }
	setCachedResult(cacheKey, result)
	return result
}

async function ocrDocument(photoId: string, imageData: ImageData): Promise<OcrExtractionResult> {
	// v2 cache key — schema gained owner fields, old cache entries lack them.
	const cacheKey = getCacheKey(photoId, 'ocr-document-v2')
	const cached = getCachedResult<OcrExtractionResult>(cacheKey)
	if (cached) return cached

	const client = getAnthropicClient()
	const message = await client.messages.create({
		model: 'claude-sonnet-4-5-20250929',
		max_tokens: 1024,
		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'image',
						source: { type: 'base64', media_type: imageData.mediaType, data: imageData.base64 },
					},
					{
						type: 'text',
						text: 'Extract data from this German Zulassungsbescheinigung (vehicle registration certificate). Return JSON with: {"manufacturer":"","model":"","vin":"","licensePlate":"","firstRegistration":"YYYY-MM-DD","engineDisplacement":"ccm","power":"kW","fuel":"","mileage":"","kbaNumber":"","previousOwners":"","lastRegistration":"YYYY-MM-DD","vehicleType":"","color":"","seats":"","transmission":"","ownerFirstName":"","ownerLastName":"","ownerStreet":"","ownerPostcode":"","ownerCity":""}. The owner fields refer to the registered Halter (vehicle holder) printed on the document — Vorname (firstName), Nachname or Firma (lastName), Straße + Hausnummer (street), PLZ (postcode, 5 digits), Ort (city). Use empty string for fields not found.',
					},
				],
			},
		],
	})

	const textBlock = message.content.find((b) => b.type === 'text')
	const raw = textBlock ? textBlock.text.trim() : ''

	const empty: OcrExtractionResult = {
		photoId,
		manufacturer: '',
		model: '',
		vin: '',
		licensePlate: '',
		firstRegistration: '',
		engineDisplacement: '',
		power: '',
		fuel: '',
		mileage: '',
		kbaNumber: '',
		previousOwners: '',
		lastRegistration: '',
		vehicleType: '',
		color: '',
		seats: '',
		transmission: '',
		ownerFirstName: '',
		ownerLastName: '',
		ownerStreet: '',
		ownerPostcode: '',
		ownerCity: '',
	}

	try {
		const jsonString = raw
			.replace(/^```(?:json)?\s*\n?/i, '')
			.replace(/\n?```\s*$/i, '')
			.trim()
		const parsed = JSON.parse(jsonString) as Record<string, unknown>

		const result: OcrExtractionResult = { ...empty }
		for (const key of Object.keys(empty) as (keyof OcrExtractionResult)[]) {
			if (key === 'photoId') continue
			const val = parsed[key]
			if (typeof val === 'string') result[key] = val
			else if (typeof val === 'number') result[key] = String(val)
		}

		setCachedResult(cacheKey, result)
		return result
	} catch {
		console.error('Failed to parse OCR response:', raw)
		setCachedResult(cacheKey, empty)
		return empty
	}
}
