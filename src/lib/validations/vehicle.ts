import { z } from 'zod'

const vehicleInfoSchema = z.object({
	// Identification
	vin: z.string().max(17, 'VIN must be at most 17 characters').nullable().optional(),
	datsCode: z.string().max(200).nullable().optional(),
	marketIndex: z.string().max(200).nullable().optional(),
	manufacturer: z.string().max(200).nullable().optional(),
	mainType: z.string().max(200).nullable().optional(),
	subType: z.string().max(200).nullable().optional(),
	kbaNumber: z.string().max(10, 'KBA number must be at most 10 characters').nullable().optional(),
	// Specification
	powerKw: z.number().min(0).nullable().optional(),
	powerHp: z.number().min(0).nullable().optional(),
	engineDesign: z.string().max(100).nullable().optional(),
	cylinders: z.number().int().min(0).nullable().optional(),
	transmission: z.string().max(100).nullable().optional(),
	displacement: z.number().int().min(0).nullable().optional(),
	firstRegistration: z.string().nullable().optional(),
	lastRegistration: z.string().nullable().optional(),
	// Details
	vehicleType: z.string().max(100).nullable().optional(),
	motorType: z.string().max(100).nullable().optional(),
	axles: z.number().int().min(1).max(10).nullable().optional(),
	drivenAxles: z.number().int().min(1).max(10).nullable().optional(),
	doors: z.number().int().min(1).max(10).nullable().optional(),
	seats: z.number().int().min(1).max(20).nullable().optional(),
	previousOwners: z.number().int().min(0).nullable().optional(),
})

type VehicleInfoInput = z.infer<typeof vehicleInfoSchema>

export { vehicleInfoSchema }
export type { VehicleInfoInput }
