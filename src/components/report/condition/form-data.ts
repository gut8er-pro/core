import type { ConditionValues } from '@/lib/completeness'
import type { ConditionFormData, ConditionResponse } from './types'

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
	errorMemoryRead: false,
	airbagsDeployed: false,
	notes: '',
	manualSetup: false,
	previousDamageReported: '',
	existingDamageNotReported: '',
	subsequentDamage: '',
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
		errorMemoryRead: condition.errorMemoryRead ?? CONDITION_DEFAULTS.errorMemoryRead,
		airbagsDeployed: condition.airbagsDeployed ?? CONDITION_DEFAULTS.airbagsDeployed,
		notes: condition.notes ?? '',
		manualSetup: condition.manualSetup ?? CONDITION_DEFAULTS.manualSetup,
		previousDamageReported: condition.previousDamageReported ?? '',
		existingDamageNotReported: condition.existingDamageNotReported ?? '',
		subsequentDamage: condition.subsequentDamage ?? '',
	}
}

/** Form values plus the diagram markers and tyre sets the form does not own. */
function conditionValuesFromApi(data: ConditionResponse | undefined | null): ConditionValues {
	return {
		...conditionFromApi(data),
		damageMarkers: data?.damageMarkers ?? [],
		paintMarkers: data?.paintMarkers ?? [],
		tireSets: data?.tireSets ?? [],
	}
}

export { CONDITION_DEFAULTS, conditionFromApi, conditionValuesFromApi }
