import { z } from 'zod'

const conditionSchema = z.object({
	paintType: z.string().max(100).nullable().optional(),
	hard: z.string().max(100).nullable().optional(),
	paintCondition: z.string().max(100).nullable().optional(),
	generalCondition: z.string().max(100).nullable().optional(),
	bodyCondition: z.string().max(100).nullable().optional(),
	interiorCondition: z.string().max(100).nullable().optional(),
	drivingAbility: z.string().max(200).nullable().optional(),
	specialFeatures: z.string().max(500).nullable().optional(),
	parkingSensors: z.boolean().optional(),
	mileageRead: z.number().int().nonnegative().nullable().optional(),
	estimateMileage: z.number().int().nonnegative().nullable().optional(),
	unit: z.enum(['km', 'miles']).optional(),
	nextMot: z.string().datetime({ offset: true }).nullable().optional(),
	fullServiceHistory: z.boolean().optional(),
	testDrivePerformed: z.boolean().optional(),
	errorMemoryRead: z.boolean().optional(),
	airbagsDeployed: z.boolean().optional(),
	notes: z.string().max(2000).nullable().optional(),
	manualSetup: z.boolean().optional(),
	previousDamageReported: z.string().max(2000).nullable().optional(),
	existingDamageNotReported: z.string().max(2000).nullable().optional(),
	subsequentDamage: z.string().max(2000).nullable().optional(),
})

const damageMarkerSchema = z.object({
	id: z.string().uuid().optional(),
	x: z.number().min(0).max(100),
	y: z.number().min(0).max(100),
	comment: z.string().max(500).nullable().optional(),
})

const paintMarkerSchema = z.object({
	id: z.string().uuid().optional(),
	x: z.number().min(0).max(100),
	y: z.number().min(0).max(100),
	thickness: z.number().nonnegative(),
	color: z.string().max(20).nullable().optional(),
	position: z.string().max(50).nullable().optional(),
})

const tireSchema = z.object({
	id: z.string().uuid().optional(),
	position: z.string().min(1).max(10),
	size: z.string().max(50).nullable().optional(),
	profileLevel: z.string().max(50).nullable().optional(),
	manufacturer: z.string().max(100).nullable().optional(),
	usability: z.number().int().min(1).max(3).optional(),
})

const tireSetSchema = z.object({
	id: z.string().uuid().optional(),
	setNumber: z.number().int().min(1).max(4),
	matchAndAlloy: z.boolean().optional(),
	tires: z.array(tireSchema).max(4).optional(),
})

const conditionPatchSchema = z.object({
	condition: conditionSchema.optional(),
	damageMarkers: z.array(damageMarkerSchema).optional(),
	paintMarkers: z.array(paintMarkerSchema).optional(),
	tireSets: z.array(tireSetSchema).optional(),
	deleteDamageMarkerIds: z.array(z.string().uuid()).optional(),
	deletePaintMarkerIds: z.array(z.string().uuid()).optional(),
	deleteTireSetIds: z.array(z.string().uuid()).optional(),
})

function getPaintColor(thickness: number): string {
	if (thickness >= 700) return '#EF4444' // Red
	if (thickness > 300) return '#F97316' // Orange
	if (thickness > 160) return '#EAB308' // Yellow
	if (thickness >= 70) return '#22C55E' // Green
	return '#3B82F6' // Blue
}

type ConditionInput = z.infer<typeof conditionSchema>
type DamageMarkerInput = z.infer<typeof damageMarkerSchema>
type PaintMarkerInput = z.infer<typeof paintMarkerSchema>
type TireInput = z.infer<typeof tireSchema>
type TireSetInput = z.infer<typeof tireSetSchema>
type ConditionPatchInput = z.infer<typeof conditionPatchSchema>

export {
	conditionSchema,
	damageMarkerSchema,
	paintMarkerSchema,
	tireSchema,
	tireSetSchema,
	conditionPatchSchema,
	getPaintColor,
}
export type {
	ConditionInput,
	DamageMarkerInput,
	PaintMarkerInput,
	TireInput,
	TireSetInput,
	ConditionPatchInput,
}
