// Pipeline orchestrator — coordinates classification, processing, and auto-fill.

import { getServerTranslations, type TranslateFn } from '@/i18n/translator'
import { normalizeConditionValue } from '@/lib/pdf/translations'
import { getAnthropicClient } from './anthropic'
import {
	getCachedResult,
	getCacheKey,
	persistResultsToDb,
	prewarmFromDb,
	setCachedResult,
} from './cache'
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
	PlateDetectionResult,
	TireAnalysisResult,
	VehicleLookupResult,
} from './types'
import { lookupVehicleByVin, mergeVehicleData, normalizeVehicleType } from './vehicle-lookup'

type PhotoInput = {
	id: string
	url: string
	aiUrl: string | null
	previewUrl: string | null
	contentHash: string | null
	aiProcessedAt: Date | null
	aiProcessedHash: string | null
}

/**
 * Prompt versions per analyzer. Bump when the prompt body or JSON schema
 * changes — invalidates persisted cache rows for that operation. Increment
 * is local to each analyzer; mismatches are independent.
 */
const PROMPT_VERSIONS = {
	classify: 1,
	// v2 — bumped when locale-strict instruction was added to the prompt's EN
	// branch. Old v1 cache entries had no "respond strictly in English" line
	// and the model was leaking German into EN runs (visible in the post-
	// Talas-A real-photo PDFs). Bumping invalidates those entries so today's
	// stricter prompt actually runs.
	'damage-analysis': 2,
	// v3 — bumped when the DE branch started asking for a German colour name
	// and a German interior feature list. Cached v2 rows answer "Light Green"
	// and "panoramic sunroof", which land in a German Gutachten verbatim.
	'overview-analysis': 3,
	// v4 — "condition" now answers with the Condition tab's own option values
	// ("Minor wear") instead of the Excellent/Good/Fair/Poor grades, which
	// matched no option. v3 rows hold the old vocabulary.
	'interior-analysis': 4,
	'tire-analysis': 2,
	'detect-vin': 1,
	// v3 — the plate pass now also reads the HU-Plakette (next MOT) and the
	// result shape gained `nextMot`. v2 rows have no such key.
	'detect-plate': 3,
	// v3 — the prompt now names the Zulassungsbescheinigung box labels (P.2
	// kW, P.1 ccm, B Erstzulassung, D.1/D.2, E, HSN/TSN) instead of asking
	// generically, and adds nextMot + a constrained vehicleType. v2 rows hold
	// the values read from the wrong boxes on the demo car.
	'ocr-document': 3,
} as const

type LocaleAwareOp = 'damage-analysis' | 'overview-analysis' | 'interior-analysis' | 'tire-analysis'
const LOCALE_AWARE_OPS: ReadonlySet<string> = new Set<LocaleAwareOp>([
	'damage-analysis',
	'overview-analysis',
	'interior-analysis',
	'tire-analysis',
])

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

	const t = await getServerTranslations(locale, 'report.ai')

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
			message: t('progress.skippingProcessed', {
				skipped: skipped.length,
				remaining: toProcess.length,
			}),
		})
	}

	// --- Step 1: Fetch images and classify ---
	emit({
		type: 'progress',
		step: 'classify',
		current: 0,
		total: toProcess.length,
		message: t('progress.classifying'),
	})

	// Two image-data caches — one per variant. Most analyzers will pick the
	// preview variant (smaller, ~70% cheaper in tokens) where detail isn't
	// critical; OCR-style analyzers stick with the AI variant.
	const imageDataAi = new Map<string, Awaited<ReturnType<typeof fetchImageAsBase64>>>()
	const imageDataPreview = new Map<string, Awaited<ReturnType<typeof fetchImageAsBase64>>>()
	const classifications: ClassificationResult[] = []

	function pickImage(
		photo: PhotoInput,
		task: 'classify' | 'overview' | 'calculation' | 'highdetail',
	) {
		if (task === 'highdetail') {
			return imageDataAi.get(photo.id)
		}
		// preview-friendly tasks — fall through to AI variant if preview missing
		return imageDataPreview.get(photo.id) ?? imageDataAi.get(photo.id)
	}

	// Fetch each photo's preferred variant in parallel. Pre-loading both lets
	// downstream analyzers route per-task without re-fetching.
	const fetchResults = await Promise.allSettled(
		toProcess.flatMap((photo) => {
			const aiUrl = photo.aiUrl || photo.url
			const previewUrl = photo.previewUrl
			const tasks: Array<Promise<unknown>> = [
				fetchImageAsBase64(aiUrl).then((data) => imageDataAi.set(photo.id, data)),
			]
			if (previewUrl && previewUrl !== aiUrl) {
				tasks.push(
					fetchImageAsBase64(previewUrl).then((data) => imageDataPreview.set(photo.id, data)),
				)
			}
			return tasks
		}),
	)

	// Photos that ended up without an AI variant (the high-detail one) are
	// problematic — they can't run any analyzer. Preview-only failures are
	// recoverable (we fall back to AI variant in pickImage).
	for (const photo of toProcess) {
		if (!imageDataAi.has(photo.id)) {
			console.error(`Failed to fetch AI variant for photo ${photo.id}`)
			summary.warnings.push(`Could not fetch photo ${photo.id}`)
		}
	}
	// Surface preview-fetch failures as a warning only (analyzer falls back).
	for (const r of fetchResults) {
		if (r.status === 'rejected') {
			console.warn('[pipeline] image variant fetch rejected (will fall back):', r.reason)
		}
	}

	// Pre-warm the in-memory AI cache from the persistent DB layer so
	// analyzers transparently skip API calls for photos whose content hash
	// matches a previously-analyzed image (any report, any session).
	{
		const prewarmEntries: Parameters<typeof prewarmFromDb>[0] = []
		for (const photo of toProcess) {
			if (!photo.contentHash) continue
			for (const [op, version] of Object.entries(PROMPT_VERSIONS)) {
				if (LOCALE_AWARE_OPS.has(op)) {
					prewarmEntries.push({
						photoId: photo.id,
						contentHash: photo.contentHash,
						operation: op,
						locale,
						promptVersion: version,
					})
				} else {
					prewarmEntries.push({
						photoId: photo.id,
						contentHash: photo.contentHash,
						operation: op,
						locale: '',
						promptVersion: version,
					})
				}
			}
		}
		try {
			const loaded = await prewarmFromDb(prewarmEntries)
			if (loaded > 0) {
				console.log(`[pipeline] AI cache pre-warmed: ${loaded} entries from DB`)
			}
		} catch (err) {
			console.warn('[pipeline] AI cache pre-warm failed:', err)
		}
	}

	// Classify all photos in parallel — uses the preview variant since
	// classification is a coarse routing decision (8 buckets).
	const classifyResults = await Promise.allSettled(
		toProcess.map(async (photo, index) => {
			const imageData = pickImage(photo, 'classify')
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
				message: t('progress.classified', { current: index + 1, total: toProcess.length }),
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
		message: t('progress.analyzing'),
	})

	const processedResults: PhotoProcessingResult[] = []
	let processedCount = 0

	// Lookup so processPhoto can resolve per-task image variants from the
	// classification (which only carries photoId, not the full PhotoInput).
	const photoById = new Map(toProcess.map((p) => [p.id, p]))

	const processPhoto = async (
		classification: ClassificationResult,
	): Promise<PhotoProcessingResult> => {
		const photo = photoById.get(classification.photoId)
		if (!photo) return { type: 'other', result: null }

		switch (classification.type) {
			case 'damage': {
				const imageData = pickImage(photo, 'highdetail')
				if (!imageData) return { type: 'other', result: null }
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
				const imageData = pickImage(photo, 'highdetail')
				if (!imageData) return { type: 'other', result: null }
				const result = await detectVinFromImage(classification.photoId, imageData)
				return { type: 'vin', result }
			}
			case 'plate': {
				const imageData = pickImage(photo, 'highdetail')
				if (!imageData) return { type: 'other', result: null }
				const result = await detectPlateFromImage(classification.photoId, imageData)
				return { type: 'plate', result }
			}
			case 'document': {
				const imageData = pickImage(photo, 'highdetail')
				if (!imageData) return { type: 'other', result: null }
				const result = await ocrDocument(classification.photoId, imageData)
				return { type: 'document', result }
			}
			case 'overview': {
				// Overview is a coarse describe-the-vehicle pass — preview is enough.
				const imageData = pickImage(photo, 'overview')
				if (!imageData) return { type: 'other', result: null }
				const result = await analyzeOverview(classification.photoId, imageData, locale)
				return { type: 'overview', result }
			}
			case 'tire': {
				// Sidewall markings (size, manufacturer, DOT) need fine detail.
				const imageData = pickImage(photo, 'highdetail')
				if (!imageData) return { type: 'other', result: null }
				const result = await analyzeTire(
					classification.photoId,
					imageData,
					classification.position,
					locale,
				)
				return { type: 'tire', result }
			}
			case 'interior': {
				// Odometer reading needs the AI variant.
				const imageData = pickImage(photo, 'highdetail')
				if (!imageData) return { type: 'other', result: null }
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
				message: t('progress.analyzed', {
					current: processedCount,
					total: classifications.length,
				}),
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
			message: t('progress.lookingUpVehicle'),
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
			message: t('progress.vehicleRetrieved'),
		})
	}

	// --- Step 3b: Calculation extraction from damage photos ---
	let calculationData: CalculationAutoFillResult | null = null
	// Use the AI (1568 px) variant for calculation extraction. Parts /
	// repair-method identification from damage photos benefits from the full
	// detail — small surface cues (cracks, fasteners, panel edges) matter for
	// repair-method decisions. Costs ~$0.028 more per report vs the preview
	// variant we used during the Talas A cost-optimization pass; the quality
	// trade-off was not worth it.
	const damageImages = collectDamageImages(classifications, (photoId) => imageDataAi.get(photoId))
	if (damageImages.length > 0) {
		emit({
			type: 'progress',
			step: 'calculation',
			current: 0,
			total: 1,
			message: t('progress.extractingCalculation'),
		})
		try {
			calculationData = await extractCalculationData(damageImages, locale)
		} catch (err) {
			console.error('Calculation extraction failed:', err)
			summary.warnings.push('Could not extract calculation data from damage photos')
		}
		emit({
			type: 'progress',
			step: 'calculation',
			current: 1,
			total: 1,
			message: t('progress.calculationExtracted'),
		})
	}

	// --- Step 4: Build auto-fill payloads ---
	emit({
		type: 'progress',
		step: 'autofill',
		current: 0,
		total: 5,
		message: t('progress.autoFilling'),
	})

	// 4a: Vehicle tab
	const vehicleData = mergeVehicleData(vehicleLookup, extractedOcr)
	if (Object.keys(vehicleData).length > 0) {
		summary.autoFilledFields.vehicle = Object.keys(vehicleData)
		emit({ type: 'auto_fill', section: 'vehicle', fields: Object.keys(vehicleData) })
	}
	emit({
		type: 'progress',
		step: 'autofill',
		current: 1,
		total: 5,
		message: t('progress.vehicleFilled'),
	})

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
		message: t('progress.accidentFilled'),
	})

	// 4c: Condition tab (damage markers + tire data + overview/interior data)
	const damageMarkers = collectDamageMarkers(processedResults, t)
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
	const nextMot = findNextMot(processedResults, extractedOcr)
	if (nextMot) {
		summary.autoFilledFields.condition.push('nextMot')
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
		message: t('progress.conditionFilled'),
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
		message: t('progress.calculationFilled'),
	})

	// 4e: Photo descriptions and ordering
	const photoOrder = buildPhotoOrder(classifications)
	summary.photoOrder = photoOrder
	emit({
		type: 'progress',
		step: 'autofill',
		current: 5,
		total: 5,
		message: t('progress.photosReordered'),
	})

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
			nextMot,
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

	// Persist fresh AI results to the DB so future runs (different reports,
	// same image) skip the API call entirely. Best-effort — failures don't
	// affect the user-visible result. Cache hits are upserted as no-ops.
	{
		const persistEntries: Parameters<typeof persistResultsToDb>[0] = []

		for (const c of classifications) {
			const photo = photoById.get(c.photoId)
			if (!photo?.contentHash) continue
			persistEntries.push({
				contentHash: photo.contentHash,
				operation: 'classify',
				locale: '',
				promptVersion: PROMPT_VERSIONS.classify,
				result: c,
			})
		}

		for (const r of processedResults) {
			if (!r.result) continue
			// Most analyzer results carry their photoId; OCR/VIN/plate too.
			const photoId =
				'photoId' in r.result && typeof r.result.photoId === 'string' ? r.result.photoId : null
			if (!photoId) continue
			const photo = photoById.get(photoId)
			if (!photo?.contentHash) continue

			let op: keyof typeof PROMPT_VERSIONS | null = null
			let isLocaleAware = false
			switch (r.type) {
				case 'damage':
					op = 'damage-analysis'
					isLocaleAware = true
					break
				case 'overview':
					op = 'overview-analysis'
					isLocaleAware = true
					break
				case 'interior':
					op = 'interior-analysis'
					isLocaleAware = true
					break
				case 'tire':
					op = 'tire-analysis'
					isLocaleAware = true
					break
				case 'vin':
					op = 'detect-vin'
					break
				case 'plate':
					op = 'detect-plate'
					break
				case 'document':
					op = 'ocr-document'
					break
				default:
					op = null
			}
			if (!op) continue

			persistEntries.push({
				contentHash: photo.contentHash,
				operation: op,
				locale: isLocaleAware ? locale : '',
				promptVersion: PROMPT_VERSIONS[op],
				result: r.result,
			})
		}

		try {
			const saved = await persistResultsToDb(persistEntries)
			if (saved > 0) {
				console.log(`[pipeline] AI cache persisted: ${saved} entries to DB`)
			}
		} catch (err) {
			console.warn('[pipeline] AI cache persist failed:', err)
		}
	}

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

/**
 * Next HU date. The registration document wins over the rear-plate Plakette:
 * a printed date beats a sticker read at an angle.
 */
function findNextMot(
	results: PhotoProcessingResult[],
	ocr: OcrExtractionResult | null,
): string | null {
	if (ocr?.nextMot) return ocr.nextMot
	for (const r of results) {
		if (r.type === 'plate' && r.result?.nextMot) return r.result.nextMot
	}
	return null
}

function findExtractedOcr(results: PhotoProcessingResult[]): OcrExtractionResult | null {
	for (const r of results) {
		if (r.type === 'document' && r.result) return r.result
	}
	return null
}

function collectDamageMarkers(results: PhotoProcessingResult[], t: TranslateFn): DiagramPosition[] {
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
			r.result.severity ? `${t('marker.severity')}: ${t(`severity.${r.result.severity}`)}` : null,
			r.result.repairApproach ? `${t('marker.repair')}: ${r.result.repairApproach}` : null,
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
	resolve: (photoId: string) => ImageData | undefined,
): ImageData[] {
	const images: ImageData[] = []
	for (const c of classifications) {
		if (c.type === 'damage') {
			const img = resolve(c.photoId)
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
export {
	collectDamageMarkers,
	hashUrl,
	normalizeKbaNumber,
	normalizeOcrDate,
	parseOcrResponse,
	parsePlateResponse,
	runPipeline,
}

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

const PLATE_PROMPT_BASIC = `Read this German vehicle plate photo and return ONLY valid JSON: {"plate":"","nextMot":""}.

"plate": the COMPLETE license plate. Format: 1-3 city letters (umlauts ok like Ü, Ä, Ö), space or dash, 1-2 letters, space or dash, 1-4 digits, optional E or H suffix. Examples: "FÜ BP 147", "B AB 1234", "M-XX-9999E". Read the ENTIRE plate including all letters and digits — do not abbreviate. Use "" if not visible.

"nextMot": the date of the next Hauptuntersuchung, read from the round HU-Plakette sticker on the REAR plate. The sticker shows a two-digit year in its centre; the month is the number printed at the 12-o'clock position (the top), which is rotated so the due month sits at the top. Return YYYY-MM-01. Use "" for a front plate, a missing sticker, or whenever the digits are not sharp enough to read with certainty — a guessed inspection date is worse than none.`

const PLATE_PROMPT_RETRY = `The plate must match exactly this regex: ^[A-ZÄÖÜ]{1,3}[ -][A-Z]{1,2}[ -]\\d{1,4}[EH]?$. Re-read the plate carefully — do NOT truncate or abbreviate. Return ONLY valid JSON: {"plate":"","nextMot":""}, with "nextMot" as YYYY-MM-01 from the HU-Plakette (year in the centre, month at the 12-o'clock position) or "" if unreadable.`

function cleanPlate(raw: string): string {
	return raw.replace(/['"`]/g, '').trim().toUpperCase()
}

/**
 * The plate pass answers JSON, but older cached rows and the occasional
 * conversational reply are bare strings — treat those as the plate.
 */
function parsePlateResponse(raw: string): { plate: string | null; nextMot: string | null } {
	const trimmed = raw.trim()
	if (!trimmed || trimmed.toLowerCase() === 'null') return { plate: null, nextMot: null }

	const jsonString = trimmed
		.replace(/^```(?:json)?\s*\n?/i, '')
		.replace(/\n?```\s*$/i, '')
		.trim()

	let plateRaw = jsonString
	let motRaw = ''
	try {
		const parsed = JSON.parse(jsonString) as Record<string, unknown>
		plateRaw = typeof parsed.plate === 'string' ? parsed.plate : ''
		motRaw = typeof parsed.nextMot === 'string' ? parsed.nextMot : ''
	} catch {
		// bare-string answer — plateRaw already holds it
	}

	const cleaned = cleanPlate(plateRaw)
	const plate = cleaned && GERMAN_PLATE_RE.test(cleaned) ? cleaned : null
	const nextMot = normalizeOcrDate(motRaw) || null
	return { plate, nextMot }
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
): Promise<PlateDetectionResult> {
	const cacheKey = getCacheKey(photoId, 'detect-plate')
	const cached = getCachedResult<PlateDetectionResult>(cacheKey)
	if (cached) return cached

	const client = getAnthropicClient()

	// First attempt — generic prompt with format hints.
	const firstRaw = await callPlateModel(client, imageData, PLATE_PROMPT_BASIC)
	const first = parsePlateResponse(firstRaw)
	let plate = first.plate
	let nextMot = first.nextMot

	// Retry once with stricter prompt if first attempt failed validation.
	if (!plate && firstRaw && firstRaw.toLowerCase() !== 'null') {
		const retry = parsePlateResponse(await callPlateModel(client, imageData, PLATE_PROMPT_RETRY))
		if (retry.plate) plate = retry.plate
		if (!nextMot) nextMot = retry.nextMot
	}

	// If still invalid, return null rather than a malformed plate. No plate
	// is better than a wrong one — the user can fill it manually.
	const result: PlateDetectionResult = { photoId, plate, nextMot }
	setCachedResult(cacheKey, result)
	return result
}

// The Zulassungsbescheinigung Teil I is a fixed form: every value sits in a
// box carrying a letter/number code. Asking for "power" or "displacement"
// generically made the model pick whichever nearby number looked plausible —
// on the KIA Ceed demo document it read the wrong kW box and reported 1482 ccm
// for a 1.6 CRDi. Naming the box is the whole fix.
const OCR_DOCUMENT_PROMPT = `You are reading a German vehicle registration certificate (Zulassungsbescheinigung Teil I, or the older Fahrzeugschein). Every value sits in a numbered/lettered box. Read STRICTLY BY BOX LABEL — never infer a value from a nearby number.

Box map:
- B → Datum der Erstzulassung → "firstRegistration" (YYYY-MM-DD)
- I → Datum der Zulassung auf den aktuellen Halter → "lastRegistration" (YYYY-MM-DD)
- D.1 (older forms: 2.1) → Hersteller / Marke → "manufacturer"
- D.2 (older forms: 2.2) → Typ / Handelsbezeichnung → "model"
- D.3 → Handelsbezeichnung, use for "model" only if D.2 is unreadable
- E → Fahrzeug-Identifizierungsnummer (17 characters) → "vin"
- P.1 → Hubraum in cm³ → "engineDisplacement" (digits only, no unit)
- P.2 → Nennleistung in kW → "power" (digits only, no unit). P.2 is the ONLY kW field. Do NOT read P.4 (Nenndrehzahl, rpm) or any other number.
- P.3 → Kraftstoffart → "fuel"
- S.1 → Anzahl der Sitzplätze → "seats"
- R → Farbe → "color"
- J → Fahrzeugklasse, and 4 / "zu 2" → Fahrzeug-/Aufbauart → source for "vehicleType"
- "zu 2.1" + "zu 2.2" (HSN 4 digits + TSN 3 alphanumerics) → "kbaNumber", joined as "HSN/TSN"
- Kennzeichen (top of the document) → "licensePlate"
- Halter block (C.1.1 Vorname, C.1.2 Name oder Firma, C.1.3 Anschrift) → "ownerFirstName", "ownerLastName", "ownerStreet" (Straße + Hausnummer), "ownerPostcode" (5 digits), "ownerCity"

Also extract, if the document shows it:
- "nextMot": date of the next Hauptuntersuchung (HU / TÜV), printed as "Nächste HU" or on an inspection report attached to the certificate. Format YYYY-MM-DD; use the first day of the month when only month/year are given.
- "previousOwners": Zahl der Vorhalter, if stated.
- "transmission": Getriebeart, if stated.
- "mileage": Kilometerstand, if stated.

"vehicleType" must be EXACTLY one of: sedan | compact | suv | wagon | coupe | convertible | van. Map the German term: Limousine→sedan, Schräghecklimousine/Kleinwagen→compact, Geländewagen/SUV→suv, Kombi/Kombilimousine/Caravan/Variant/Estate/Sportswagon/Sportstourer→wagon, Coupé→coupe, Cabriolet/Roadster→convertible, Kleinbus/Van/Transporter/Hochdachkombi→van. Use "" if the document does not state the body style — do NOT guess from the photo of the car.

Rules:
- Return "" for any box you cannot read with certainty. An empty value is correct; a guessed value is a defect.
- Never copy a value from one box into another.
- Numeric fields ("power", "engineDisplacement", "seats", "previousOwners", "mileage") are digits only.

Return ONLY valid JSON with exactly these keys: {"manufacturer":"","model":"","vin":"","licensePlate":"","firstRegistration":"","lastRegistration":"","nextMot":"","engineDisplacement":"","power":"","fuel":"","mileage":"","kbaNumber":"","previousOwners":"","vehicleType":"","color":"","seats":"","transmission":"","ownerFirstName":"","ownerLastName":"","ownerStreet":"","ownerPostcode":"","ownerCity":""}`

function emptyOcrResult(photoId: string): OcrExtractionResult {
	return {
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
		nextMot: '',
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
}

const NUMERIC_OCR_FIELDS = [
	'power',
	'engineDisplacement',
	'seats',
	'previousOwners',
	'mileage',
] as const

const DATE_OCR_FIELDS = ['firstRegistration', 'lastRegistration', 'nextMot'] as const

/**
 * Strips the unit the model sometimes keeps despite the prompt ("1582 cm³",
 * "94 kW"). Returns '' when the value carries no digits at all, so a box the
 * model narrated instead of read ("nicht lesbar") does not reach the column.
 */
function digitsOnly(raw: string): string {
	const match = raw.match(/\d[\d.,]*/)
	if (!match) return ''
	return match[0].replace(/[.,]/g, '')
}

/**
 * Accepts YYYY-MM-DD, and normalizes the German forms the model falls back to
 * (DD.MM.YYYY, MM/YYYY, MM.YYYY). Anything else is dropped — a malformed date
 * becomes an Invalid Date in the route's `new Date(...)` and poisons the row.
 */
function normalizeOcrDate(raw: string): string {
	const trimmed = raw.trim()
	if (!trimmed) return ''

	const pad = (part: string | undefined) => (part ?? '').padStart(2, '0')

	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

	const isoMonth = trimmed.match(/^(\d{4})-(\d{2})$/)
	if (isoMonth) return `${isoMonth[1]}-${isoMonth[2]}-01`

	const german = trimmed.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)
	if (german) return `${german[3]}-${pad(german[2])}-${pad(german[1])}`

	const monthYear = trimmed.match(/^(\d{1,2})[./](\d{4})$/)
	if (monthYear) return `${monthYear[2]}-${pad(monthYear[1])}-01`

	return ''
}

const KBA_PATTERN = /^\d{4}\/?[A-Z0-9]{3}$/i

/**
 * HSN (4 digits) + TSN (3 alphanumerics). Anything that does not have that
 * shape is not a KBA number — the model used to answer with the plain
 * Fahrzeugklasse when the boxes were cropped off.
 */
function normalizeKbaNumber(raw: string): string {
	const cleaned = raw.replace(/\s+/g, '').toUpperCase()
	if (!cleaned) return ''
	const compact = cleaned.replace(/\//g, '')
	if (!/^\d{4}[A-Z0-9]{3}$/.test(compact)) {
		return KBA_PATTERN.test(cleaned) ? cleaned : ''
	}
	return `${compact.slice(0, 4)}/${compact.slice(4)}`
}

function parseOcrResponse(photoId: string, rawResponse: string): OcrExtractionResult {
	const empty = emptyOcrResult(photoId)

	try {
		const jsonString = rawResponse
			.replace(/^```(?:json)?\s*\n?/i, '')
			.replace(/\n?```\s*$/i, '')
			.trim()
		const parsed = JSON.parse(jsonString) as Record<string, unknown>

		const result: OcrExtractionResult = { ...empty }
		for (const key of Object.keys(empty) as (keyof OcrExtractionResult)[]) {
			if (key === 'photoId') continue
			const val = parsed[key]
			if (typeof val === 'string') result[key] = val.trim()
			else if (typeof val === 'number') result[key] = String(val)
		}

		for (const key of NUMERIC_OCR_FIELDS) {
			result[key] = digitsOnly(result[key])
		}
		for (const key of DATE_OCR_FIELDS) {
			result[key] = normalizeOcrDate(result[key])
		}
		result.kbaNumber = normalizeKbaNumber(result.kbaNumber)
		result.vehicleType = normalizeVehicleType(result.vehicleType) ?? ''

		const vinMatch = result.vin.toUpperCase().match(/[A-HJ-NPR-Z0-9]{17}/)
		result.vin = vinMatch && VIN_PATTERN.test(vinMatch[0]) ? vinMatch[0] : ''

		return result
	} catch {
		console.error('Failed to parse OCR response:', rawResponse)
		return empty
	}
}

async function ocrDocument(photoId: string, imageData: ImageData): Promise<OcrExtractionResult> {
	const cacheKey = getCacheKey(photoId, 'ocr-document')
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
					{ type: 'text', text: OCR_DOCUMENT_PROMPT },
				],
			},
		],
	})

	const textBlock = message.content.find((b) => b.type === 'text')
	const raw = textBlock ? textBlock.text.trim() : ''

	const result = parseOcrResponse(photoId, raw)
	setCachedResult(cacheKey, result)
	return result
}
