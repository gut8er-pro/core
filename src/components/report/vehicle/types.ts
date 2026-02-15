import type { Control, FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form'

type VehicleFormData = {
	// Identification
	vin: string
	datsCode: string
	marketIndex: string
	manufacturer: string
	mainType: string
	subType: string
	kbaNumber: string
	// Specification
	powerKw: string
	powerHp: string
	engineDesign: string
	cylinders: string
	transmission: string
	displacement: string
	firstRegistration: string
	lastRegistration: string
	// Details
	vehicleType: string
	motorType: string
	axles: number
	drivenAxles: number
	doors: number
	seats: number
	previousOwners: number
}

type VehicleSectionProps = {
	register: UseFormRegister<VehicleFormData>
	control: Control<VehicleFormData>
	errors: FieldErrors<VehicleFormData>
	onFieldBlur?: (field: string) => void
	setValue?: UseFormSetValue<VehicleFormData>
}

export type { VehicleFormData, VehicleSectionProps }
