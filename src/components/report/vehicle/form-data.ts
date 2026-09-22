import type { VehicleInfoResponse } from '@/hooks/use-vehicle-info'
import type { VehicleFormData } from './types'

const VEHICLE_DEFAULTS: VehicleFormData = {
	vin: '',
	datsCode: '',
	marketIndex: '',
	manufacturer: '',
	mainType: '',
	subType: '',
	kbaNumber: '',
	powerKw: '',
	powerHp: '',
	engineDesign: '',
	cylinders: '',
	transmission: '',
	displacement: '',
	firstRegistration: '',
	lastRegistration: '',
	sourceOfTechnicalData: '',
	vehicleType: '',
	motorType: '',
	axles: 2,
	drivenAxles: 1,
	doors: 4,
	seats: 5,
	previousOwners: null,
}

const numberToInput = (value: number | null | undefined): string =>
	value != null ? String(value) : ''

/** The saved vehicle as the Vehicle form holds it. */
function vehicleFromApi(data: VehicleInfoResponse | undefined | null): VehicleFormData {
	if (!data) return { ...VEHICLE_DEFAULTS }

	return {
		...VEHICLE_DEFAULTS,
		vin: data.vin ?? '',
		datsCode: data.datsCode ?? '',
		marketIndex: data.marketIndex ?? '',
		manufacturer: data.manufacturer ?? '',
		mainType: data.mainType ?? '',
		subType: data.subType ?? '',
		kbaNumber: data.kbaNumber ?? '',
		powerKw: numberToInput(data.powerKw),
		powerHp: numberToInput(data.powerHp),
		engineDesign: data.engineDesign ?? '',
		cylinders: numberToInput(data.cylinders),
		transmission: data.transmission ?? '',
		displacement: numberToInput(data.displacement),
		firstRegistration: data.firstRegistration?.split('T')[0] ?? '',
		lastRegistration: data.lastRegistration?.split('T')[0] ?? '',
		sourceOfTechnicalData: data.sourceOfTechnicalData ?? '',
		vehicleType: data.vehicleType ?? '',
		motorType: data.motorType ?? '',
		axles: data.axles ?? VEHICLE_DEFAULTS.axles,
		drivenAxles: data.drivenAxles ?? VEHICLE_DEFAULTS.drivenAxles,
		doors: data.doors ?? VEHICLE_DEFAULTS.doors,
		seats: data.seats ?? VEHICLE_DEFAULTS.seats,
		previousOwners: data.previousOwners ?? null,
	}
}

export { VEHICLE_DEFAULTS, vehicleFromApi }
