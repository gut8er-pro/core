// Shared types for the AI report generation pipeline.

type VehiclePosition =
	| 'front-left' | 'front' | 'front-right'
	| 'left' | 'right'
	| 'rear-left' | 'rear' | 'rear-right'
	| 'top' | 'interior' | 'engine'
	| 'wheel-fl' | 'wheel-fr' | 'wheel-rl' | 'wheel-rr'
	| 'undercarriage' | 'other'

type PhotoClassificationType =
	| 'damage' | 'vin' | 'plate' | 'document'
	| 'overview' | 'tire' | 'interior' | 'other'

type ClassificationResult = {
	photoId: string
	type: PhotoClassificationType
	confidence: number
	position: VehiclePosition
	suggestedOrder: number
	damageLocation: string | null
}

type DamageType =
	| 'dent' | 'scratch' | 'crack' | 'deformation'
	| 'paint_damage' | 'broken_part' | 'corrosion'
	| 'glass_damage' | 'plastic_damage' | 'structural'

type BoundingBox = {
	x: number
	y: number
	width: number
	height: number
	label: string
	color: string
}

type DiagramPosition = {
	x: number
	y: number
	comment: string
}

type DamageAnalysisResult = {
	photoId: string
	description: string
	severity: 'minor' | 'moderate' | 'severe'
	damageTypes: DamageType[]
	affectedParts: string[]
	repairApproach: string
	estimatedRepairHours: number | null
	boundingBoxes: BoundingBox[]
	diagramPosition: DiagramPosition
}

type OverviewAnalysisResult = {
	photoId: string
	description: string
	color: string | null
	make: string | null
	model: string | null
	bodyType: string | null
	generalCondition: string | null
}

type TireAnalysisResult = {
	photoId: string
	manufacturer: string | null
	size: string | null
	treadDepth: number | null
	profileLevel: 'good' | 'acceptable' | 'worn' | 'critical' | null
	condition: string | null
	usability: 1 | 2 | 3
	tireType: 'summer' | 'winter' | 'all-season' | null
	dotCode: string | null
	position: 'VL' | 'VR' | 'HL' | 'HR' | null
	confidence: number
}

type InteriorAnalysisResult = {
	photoId: string
	description: string
	condition: string | null
	features: string[]
}

type VinDetectionResult = {
	photoId: string
	vin: string | null
}

type PlateDetectionResult = {
	photoId: string
	plate: string | null
}

type OcrExtractionResult = {
	photoId: string
	manufacturer: string
	model: string
	vin: string
	licensePlate: string
	firstRegistration: string
	engineDisplacement: string
	power: string
	fuel: string
	mileage: string
}

type VehicleLookupResult = {
	source: 'nhtsa' | 'ai-decode' | 'none'
	vin?: string
	manufacturer?: string
	make?: string
	model?: string
	modelYear?: number
	subType?: string
	bodyType?: string
	engineDesign?: string
	engineDisplacement?: number
	cylinders?: number
	powerKw?: number
	fuelType?: string
	transmission?: string
	doors?: number
	seats?: number
	driveType?: string
	confidence: number
	warnings: string[]
}

type PhotoProcessingResult =
	| { type: 'damage'; result: DamageAnalysisResult }
	| { type: 'vin'; result: VinDetectionResult }
	| { type: 'plate'; result: PlateDetectionResult }
	| { type: 'document'; result: OcrExtractionResult }
	| { type: 'overview'; result: OverviewAnalysisResult }
	| { type: 'tire'; result: TireAnalysisResult }
	| { type: 'interior'; result: InteriorAnalysisResult }
	| { type: 'other'; result: null }

type GenerateEvent =
	| { type: 'progress'; step: string; current: number; total: number; message: string }
	| { type: 'photo_classified'; photoId: string; classification: ClassificationResult }
	| { type: 'photo_processed'; photoId: string; result: PhotoProcessingResult }
	| { type: 'auto_fill'; section: string; fields: string[] }
	| { type: 'complete'; summary: GenerationSummary }
	| { type: 'error'; message: string }

type GenerationSummary = {
	photosProcessed: number
	classifications: Record<string, number>
	autoFilledFields: {
		vehicle: string[]
		accident: string[]
		condition: string[]
	}
	totalFieldsFilled: number
	damageMarkersPlaced: number
	warnings: string[]
	photoOrder: string[]
}

export type {
	VehiclePosition,
	PhotoClassificationType,
	ClassificationResult,
	DamageType,
	BoundingBox,
	DiagramPosition,
	DamageAnalysisResult,
	OverviewAnalysisResult,
	TireAnalysisResult,
	InteriorAnalysisResult,
	VinDetectionResult,
	PlateDetectionResult,
	OcrExtractionResult,
	VehicleLookupResult,
	PhotoProcessingResult,
	GenerateEvent,
	GenerationSummary,
}
