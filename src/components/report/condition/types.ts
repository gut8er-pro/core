import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form'

type ConditionFormData = {
	// Paint & condition
	paintType: string
	hard: string
	paintCondition: string
	generalCondition: string
	bodyCondition: string
	interiorCondition: string
	drivingAbility: string
	specialFeatures: string
	parkingSensors: boolean
	mileageRead: string
	estimateMileage: string
	unit: string
	nextMot: string
	fullServiceHistory: boolean
	testDrivePerformed: boolean
	errorMemoryRead: boolean
	airbagsDeployed: boolean
	notes: string
	manualSetup: boolean
	// Prior damage
	previousDamageReported: string
	existingDamageNotReported: string
	subsequentDamage: string
}

type ConditionSectionProps = {
	register: UseFormRegister<ConditionFormData>
	control: Control<ConditionFormData>
	errors: FieldErrors<ConditionFormData>
	onFieldBlur?: (field: string) => void
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
		specialFeatures: string | null
		parkingSensors: boolean
		mileageRead: number | null
		estimateMileage: number | null
		unit: string
		nextMot: string | null
		fullServiceHistory: boolean
		testDrivePerformed: boolean
		errorMemoryRead: boolean
		airbagsDeployed: boolean
		notes: string | null
		manualSetup: boolean
		previousDamageReported: string | null
		existingDamageNotReported: string | null
		subsequentDamage: string | null
	} | null
	damageMarkers: DamageMarkerData[]
	paintMarkers: PaintMarkerData[]
	tireSets: (TireSetData & { id: string })[]
}

export type {
	ConditionFormData,
	ConditionSectionProps,
	DamageMarkerData,
	PaintMarkerData,
	TireData,
	TireSetData,
	ConditionResponse,
}
