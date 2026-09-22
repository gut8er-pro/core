import type { ConditionValues } from '@/lib/completeness'
import type {
	ConditionFormData,
	ConditionResponse,
	EmissionGroup,
	OldtimerDetailsApi,
	OldtimerDetailsData,
} from './types'
import { EMISSION_GROUPS } from './types'

function toEmissionGroup(value: string | null | undefined): EmissionGroup | null {
	return EMISSION_GROUPS.find((group) => group === value) ?? null
}

const CONDITION_DEFAULTS: ConditionFormData = {
	paintType: '',
	hard: '',
	paintCondition: '',
	generalCondition: '',
	bodyCondition: '',
	interiorCondition: '',
	drivingAbility: '',
	vehicleColor: '',
	specialFeatures: '',
	parkingSensors: false,
	mileageRead: '',
	estimateMileage: '',
	unit: 'km',
	nextMot: '',
	fullServiceHistory: false,
	testDrivePerformed: false,
	// Unanswered, not "no" — a report must not record a finding nobody made.
	errorMemoryRead: null,
	airbagsDeployed: null,
	emissionGroup: null,
	notes: '',
	manualSetup: false,
	previousDamageReported: '',
	existingDamageNotReported: '',
	subsequentDamage: '',
	damageDescription: '',
}

/** The saved condition as the Condition form holds it. */
function conditionFromApi(data: ConditionResponse | undefined | null): ConditionFormData {
	const condition = data?.condition
	if (!condition) return { ...CONDITION_DEFAULTS }

	return {
		...CONDITION_DEFAULTS,
		paintType: condition.paintType ?? '',
		hard: condition.hard ?? '',
		paintCondition: condition.paintCondition ?? '',
		generalCondition: condition.generalCondition ?? '',
		bodyCondition: condition.bodyCondition ?? '',
		interiorCondition: condition.interiorCondition ?? '',
		drivingAbility: condition.drivingAbility ?? '',
		vehicleColor: condition.vehicleColor ?? '',
		specialFeatures: condition.specialFeatures ?? '',
		parkingSensors: condition.parkingSensors ?? CONDITION_DEFAULTS.parkingSensors,
		mileageRead: condition.mileageRead?.toString() ?? '',
		estimateMileage: condition.estimateMileage?.toString() ?? '',
		unit: condition.unit ?? CONDITION_DEFAULTS.unit,
		nextMot: condition.nextMot?.split('T')[0] ?? '',
		fullServiceHistory: condition.fullServiceHistory ?? CONDITION_DEFAULTS.fullServiceHistory,
		testDrivePerformed: condition.testDrivePerformed ?? CONDITION_DEFAULTS.testDrivePerformed,
		errorMemoryRead: condition.errorMemoryRead,
		airbagsDeployed: condition.airbagsDeployed,
		emissionGroup: toEmissionGroup(condition.emissionGroup),
		notes: condition.notes ?? '',
		manualSetup: condition.manualSetup ?? CONDITION_DEFAULTS.manualSetup,
		previousDamageReported: condition.previousDamageReported ?? '',
		damageDescription: condition.damageDescription ?? '',
		existingDamageNotReported: condition.existingDamageNotReported ?? '',
		subsequentDamage: condition.subsequentDamage ?? '',
	}
}

const OLDTIMER_DEFAULTS: OldtimerDetailsData = {
	// No pre-filled grades: a score nobody entered is not a score.
	gradingBodywork: '',
	gradingTires: '',
	gradingPaint: '',
	gradingInterior: '',
	gradingChrome: '',
	gradingEngineBay: '',
	gradingSeals: '',
	gradingEngine: '',
	gradingGlass: '',
	gradingTrunk: '',
	gradingOverall: '',
	autoCalculateGrade: true,
	originality: '',
	rareEquipment: [],
	conditionNotes: [],
	technicalFeatures: [],
	mileageNotes: [],
	historyDocumentation: [],
	rarityMarketDemand: [],
	particulars: '',
	marketReputation: '',
}

/** The saved Oldtimer sections as their controls hold them. */
function oldtimerFromApi(data: OldtimerDetailsApi | undefined | null): OldtimerDetailsData {
	if (!data) return { ...OLDTIMER_DEFAULTS }

	return {
		gradingBodywork: data.gradingBodywork ?? '',
		gradingTires: data.gradingTires ?? '',
		gradingPaint: data.gradingPaint ?? '',
		gradingInterior: data.gradingInterior ?? '',
		gradingChrome: data.gradingChrome ?? '',
		gradingEngineBay: data.gradingEngineBay ?? '',
		gradingSeals: data.gradingSeals ?? '',
		gradingEngine: data.gradingEngine ?? '',
		gradingGlass: data.gradingGlass ?? '',
		gradingTrunk: data.gradingTrunk ?? '',
		gradingOverall: data.gradingOverall ?? '',
		autoCalculateGrade: data.autoCalculateGrade ?? OLDTIMER_DEFAULTS.autoCalculateGrade,
		originality: data.originality ?? '',
		rareEquipment: data.rareEquipment ?? [],
		conditionNotes: data.conditionNotes ?? [],
		technicalFeatures: data.technicalFeatures ?? [],
		mileageNotes: data.mileageNotes ?? [],
		historyDocumentation: data.historyDocumentation ?? [],
		rarityMarketDemand: data.rarityMarketDemand ?? [],
		particulars: data.particulars ?? '',
		marketReputation: data.marketReputation ?? '',
	}
}

/**
 * Form values plus the diagram markers, tyre sets and Oldtimer sections the form
 * does not own.
 */
function conditionValuesFromApi(data: ConditionResponse | undefined | null): ConditionValues {
	return {
		...conditionFromApi(data),
		...oldtimerFromApi(data?.oldtimerDetails),
		damageMarkers: data?.damageMarkers ?? [],
		paintMarkers: data?.paintMarkers ?? [],
		tireSets: data?.tireSets ?? [],
	}
}

export {
	CONDITION_DEFAULTS,
	conditionFromApi,
	conditionValuesFromApi,
	OLDTIMER_DEFAULTS,
	oldtimerFromApi,
}
