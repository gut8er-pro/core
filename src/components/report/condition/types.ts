import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form'

/** The four Schadstoffgruppen; group 1 is the "keine Plakette" case. */
const EMISSION_GROUPS = ['1', '2', '3', '4'] as const

type EmissionGroup = (typeof EMISSION_GROUPS)[number]

/** The odometer units, shared by the picker and the schema that stores them. */
const MILEAGE_UNITS = ['km', 'miles'] as const

type ConditionFormData = {
	// Paint & condition
	paintType: string
	hard: string
	paintCondition: string
	generalCondition: string
	bodyCondition: string
	interiorCondition: string
	drivingAbility: string
	vehicleColor: string
	specialFeatures: string
	parkingSensors: boolean
	mileageRead: string
	estimateMileage: string
	unit: string
	nextMot: string
	fullServiceHistory: boolean
	testDrivePerformed: boolean
	errorMemoryRead: boolean | null
	airbagsDeployed: boolean | null
	emissionGroup: EmissionGroup | null
	notes: string
	manualSetup: boolean
	// Prior damage
	previousDamageReported: string
	existingDamageNotReported: string
	subsequentDamage: string
	/** Not yet a column — held in the form so a tab switch does not discard it. */
	damageDescription: string
}

/**
 * The two sections an Oldtimer valuation adds to the Condition tab. Flat keys,
 * because a completeness rule can only name a top-level key of a tab's values.
 */
type OldtimerDetailsData = {
	// Vehicle grading — ten categories plus the overall score
	gradingBodywork: string
	gradingTires: string
	gradingPaint: string
	gradingInterior: string
	gradingChrome: string
	gradingEngineBay: string
	gradingSeals: string
	gradingEngine: string
	gradingGlass: string
	gradingTrunk: string
	gradingOverall: string
	autoCalculateGrade: boolean
	// Value-increasing features
	originality: string
	rareEquipment: string[]
	conditionNotes: string[]
	technicalFeatures: string[]
	mileageNotes: string[]
	historyDocumentation: string[]
	rarityMarketDemand: string[]
	particulars: string
	marketReputation: string
}

/** Every category the `grading*` columns cover, paint included. */
const GRADING_CATEGORIES = [
	'bodywork',
	'tires',
	'paint',
	'interior',
	'chrome',
	'engineBay',
	'seals',
	'engine',
	'glass',
	'trunk',
] as const

type GradingCategory = (typeof GRADING_CATEGORIES)[number]

/**
 * The categories the grading tab actually asks for, in render order. Paint is
 * assessed once, on the Visual Accident Details paint layer; its column stays so
 * reports graded before the split keep their value.
 */
const GRADED_CATEGORIES = GRADING_CATEGORIES.filter(
	(category) => category !== 'paint',
) as readonly Exclude<GradingCategory, 'paint'>[]

/** Every column that holds a grade — the ten categories plus the overall score. */
type GradingField = `grading${Capitalize<GradingCategory>}` | 'gradingOverall'

/** `bodywork` → `gradingBodywork`, the key both the form and the column use. */
function gradingKey(category: GradingCategory): GradingField {
	return `grading${category.charAt(0).toUpperCase()}${category.slice(1)}` as GradingField
}

type ConditionSectionProps = {
	register: UseFormRegister<ConditionFormData>
	control: Control<ConditionFormData>
	errors: FieldErrors<ConditionFormData>
	onFieldBlur?: (field: string) => void
	disabled?: boolean
	className?: string
}

type DamageMarkerData = {
	id: string
	x: number
	y: number
	comment: string | null
}

type PaintMarkerData = {
	id: string
	x: number
	y: number
	thickness: number
	color: string | null
	position: string | null
}

type TireData = {
	id?: string
	position: string
	size: string
	profileLevel: string
	manufacturer: string
	usability: number
	dotCode?: string
	tireType?: string
}

type TireSetData = {
	id?: string
	setNumber: number
	matchAndAlloy: boolean
	tires: TireData[]
}

type ConditionResponse = {
	condition: {
		id: string
		reportId: string
		paintType: string | null
		hard: string | null
		paintCondition: string | null
		generalCondition: string | null
		bodyCondition: string | null
		interiorCondition: string | null
		drivingAbility: string | null
		vehicleColor: string | null
		specialFeatures: string | null
		parkingSensors: boolean
		mileageRead: number | null
		estimateMileage: number | null
		unit: string
		nextMot: string | null
		fullServiceHistory: boolean
		testDrivePerformed: boolean
		errorMemoryRead: boolean | null
		airbagsDeployed: boolean | null
		emissionGroup: string | null
		notes: string | null
		manualSetup: boolean
		previousDamageReported: string | null
		damageDescription: string | null
		existingDamageNotReported: string | null
		subsequentDamage: string | null
	} | null
	damageMarkers: DamageMarkerData[]
	paintMarkers: PaintMarkerData[]
	tireSets: (TireSetData & { id: string })[]
	oldtimerDetails: OldtimerDetailsApi | null
}

/** `OldtimerDetails` as the API serialises it — every column nullable. */
type OldtimerDetailsApi = {
	[K in keyof OldtimerDetailsData]: OldtimerDetailsData[K] extends string[]
		? string[]
		: OldtimerDetailsData[K] extends boolean
			? boolean
			: string | null
}

export type {
	ConditionFormData,
	ConditionResponse,
	ConditionSectionProps,
	DamageMarkerData,
	EmissionGroup,
	GradingCategory,
	GradingField,
	OldtimerDetailsApi,
	OldtimerDetailsData,
	PaintMarkerData,
	TireData,
	TireSetData,
}
export { EMISSION_GROUPS, GRADED_CATEGORIES, GRADING_CATEGORIES, gradingKey, MILEAGE_UNITS }
