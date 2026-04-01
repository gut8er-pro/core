import { z } from 'zod'

const calculationSchema = z.object({
	replacementValue: z.number().nonnegative().nullable().optional(),
	taxRate: z.string().max(20).nullable().optional(),
	residualValue: z.number().nonnegative().nullable().optional(),
	diminutionInValue: z.number().nonnegative().nullable().optional(),
	wheelAlignment: z.string().max(50).nullable().optional(),
	bodyMeasurements: z.string().max(50).nullable().optional(),
	bodyPaint: z.string().max(50).nullable().optional(),
	plasticRepair: z.boolean().optional(),
	repairMethod: z.string().max(50).nullable().optional(),
	risks: z.string().max(2000).nullable().optional(),
	damageClass: z.string().max(50).nullable().optional(),
	dropoutGroup: z.string().max(10).nullable().optional(),
	costPerDay: z.number().nonnegative().nullable().optional(),
	rentalCarClass: z.string().max(10).nullable().optional(),
	repairTimeDays: z.number().int().nonnegative().nullable().optional(),
	replacementTimeDays: z.number().int().nonnegative().nullable().optional(),
	datCalculationResult: z.record(z.string(), z.unknown()).nullable().optional(),
	// BE valuation
	generalCondition: z.string().max(50).nullable().optional(),
	taxation: z.string().max(20).nullable().optional(),
	dataSource: z.string().max(100).nullable().optional(),
	valuationMax: z.number().nonnegative().nullable().optional(),
	valuationAvg: z.number().nonnegative().nullable().optional(),
	valuationMin: z.number().nonnegative().nullable().optional(),
	valuationDate: z.string().max(20).nullable().optional(),
	// OT valuation
	marketValue: z.number().nonnegative().nullable().optional(),
	baseVehicleValue: z.number().nonnegative().nullable().optional(),
	restorationValue: z.number().nonnegative().nullable().optional(),
})

const additionalCostSchema = z.object({
	id: z.string().uuid().optional(),
	description: z.string().min(1).max(500),
	amount: z.number().nonnegative(),
})

const calculationPatchSchema = z.object({
	calculation: calculationSchema.optional(),
	additionalCosts: z.array(additionalCostSchema).optional(),
	deleteAdditionalCostIds: z.array(z.string().uuid()).optional(),
})

type CalculationInput = z.infer<typeof calculationSchema>
type AdditionalCostInput = z.infer<typeof additionalCostSchema>
type CalculationPatchInput = z.infer<typeof calculationPatchSchema>

export type { AdditionalCostInput, CalculationInput, CalculationPatchInput }
export { additionalCostSchema, calculationPatchSchema, calculationSchema }
