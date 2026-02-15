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

export {
	calculationSchema,
	additionalCostSchema,
	calculationPatchSchema,
}
export type {
	CalculationInput,
	AdditionalCostInput,
	CalculationPatchInput,
}
