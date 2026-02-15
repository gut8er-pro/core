'use client'

import { useController } from 'react-hook-form'
import { Car, Truck, Bus, Fuel, Zap, Leaf } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { IconSelector } from '@/components/ui/icon-selector'
import { NumberChipSelector } from '@/components/ui/number-chip-selector'
import { Label } from '@/components/ui/label'
import type { VehicleSectionProps } from './types'

const VEHICLE_TYPE_OPTIONS = [
	{ value: 'sedan', label: 'Sedan', icon: Car },
	{ value: 'suv', label: 'SUV', icon: Truck },
	{ value: 'wagon', label: 'Wagon', icon: Bus },
	{ value: 'coupe', label: 'Coupe', icon: Car },
	{ value: 'convertible', label: 'Convertible', icon: Car },
	{ value: 'van', label: 'Van', icon: Truck },
]

const MOTOR_TYPE_OPTIONS = [
	{ value: 'petrol', label: 'Petrol', icon: Fuel },
	{ value: 'diesel', label: 'Diesel', icon: Fuel },
	{ value: 'electric', label: 'Electric', icon: Zap },
	{ value: 'hybrid', label: 'Hybrid', icon: Leaf },
]

const AXLE_OPTIONS = [
	{ value: '2', label: '2' },
	{ value: '3', label: '3' },
	{ value: '4', label: '4' },
]

const DRIVEN_AXLE_OPTIONS = [
	{ value: '1', label: '1' },
	{ value: '2', label: '2' },
	{ value: '3', label: '3' },
	{ value: '4', label: '4' },
]

const DOOR_OPTIONS = [
	{ value: '2', label: '2' },
	{ value: '3', label: '3' },
	{ value: '4', label: '4' },
	{ value: '5', label: '5' },
]

const SEAT_OPTIONS = [
	{ value: '2', label: '2' },
	{ value: '4', label: '4' },
	{ value: '5', label: '5' },
	{ value: '6', label: '6' },
	{ value: '7', label: '7' },
	{ value: '8', label: '8' },
	{ value: '9', label: '9' },
]

const PREVIOUS_OWNER_OPTIONS = [
	{ value: '1', label: '1' },
	{ value: '2', label: '2' },
	{ value: '3', label: '3' },
	{ value: '4', label: '4' },
	{ value: '5', label: '5' },
]

function DetailsSection({
	control,
	onFieldBlur,
	className,
}: VehicleSectionProps & { className?: string }) {
	const vehicleType = useController({ control, name: 'vehicleType' })
	const motorType = useController({ control, name: 'motorType' })
	const axles = useController({ control, name: 'axles' })
	const drivenAxles = useController({ control, name: 'drivenAxles' })
	const doors = useController({ control, name: 'doors' })
	const seats = useController({ control, name: 'seats' })
	const previousOwners = useController({ control, name: 'previousOwners' })

	return (
		<CollapsibleSection title="Vehicle Details" className={className}>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-1">
					<Label>Vehicle Type</Label>
					<IconSelector
						options={VEHICLE_TYPE_OPTIONS}
						selected={vehicleType.field.value}
						onChange={(value) => {
							vehicleType.field.onChange(value)
							onFieldBlur?.('vehicleType')
						}}
					/>
				</div>

				<div className="flex flex-col gap-1">
					<Label>Motor Type</Label>
					<IconSelector
						options={MOTOR_TYPE_OPTIONS}
						selected={motorType.field.value}
						onChange={(value) => {
							motorType.field.onChange(value)
							onFieldBlur?.('motorType')
						}}
					/>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					<div className="flex flex-col gap-1">
						<Label>Axles</Label>
						<NumberChipSelector
							options={AXLE_OPTIONS}
							selected={String(axles.field.value)}
							onChange={(value) => {
								axles.field.onChange(Number(value))
								onFieldBlur?.('axles')
							}}
						/>
					</div>

					<div className="flex flex-col gap-1">
						<Label>Driven Axles</Label>
						<NumberChipSelector
							options={DRIVEN_AXLE_OPTIONS}
							selected={String(drivenAxles.field.value)}
							onChange={(value) => {
								drivenAxles.field.onChange(Number(value))
								onFieldBlur?.('drivenAxles')
							}}
						/>
					</div>

					<div className="flex flex-col gap-1">
						<Label>Doors</Label>
						<NumberChipSelector
							options={DOOR_OPTIONS}
							selected={String(doors.field.value)}
							onChange={(value) => {
								doors.field.onChange(Number(value))
								onFieldBlur?.('doors')
							}}
						/>
					</div>

					<div className="flex flex-col gap-1">
						<Label>Seats</Label>
						<NumberChipSelector
							options={SEAT_OPTIONS}
							selected={String(seats.field.value)}
							onChange={(value) => {
								seats.field.onChange(Number(value))
								onFieldBlur?.('seats')
							}}
						/>
					</div>

					<div className="flex flex-col gap-1">
						<Label>Previous Owners</Label>
						<NumberChipSelector
							options={PREVIOUS_OWNER_OPTIONS}
							selected={String(previousOwners.field.value)}
							onChange={(value) => {
								previousOwners.field.onChange(Number(value))
								onFieldBlur?.('previousOwners')
							}}
						/>
					</div>
				</div>
			</div>
		</CollapsibleSection>
	)
}

export { DetailsSection }
