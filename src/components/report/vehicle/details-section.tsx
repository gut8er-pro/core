'use client'

import { useController } from 'react-hook-form'
import { Car, Truck, Bus, Fuel, Zap, Leaf, Plus } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { IconSelector } from '@/components/ui/icon-selector'
import { NumberChipSelector } from '@/components/ui/number-chip-selector'
import { Label } from '@/components/ui/label'
import type { VehicleSectionProps } from './types'

const VEHICLE_TYPE_OPTIONS = [
	{ value: 'sedan', label: 'Sedan', icon: Car },
	{ value: 'compact', label: 'Compact Car', icon: Car },
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
	{ value: 'gas', label: 'Gas', icon: Fuel },
]

const AXLE_OPTIONS = [
	{ value: '1', label: '1' },
	{ value: '2', label: '2' },
	{ value: '3', label: '3' },
	{ value: '4', label: '4' },
	{ value: '5', label: '5' },
]

const DRIVEN_AXLE_OPTIONS = [
	{ value: '1', label: '1' },
	{ value: '2', label: '2' },
	{ value: '3', label: '3' },
	{ value: '4', label: '4' },
	{ value: '5', label: '5' },
]

const DOOR_OPTIONS = [
	{ value: '0', label: '0' },
	{ value: '1', label: '1' },
	{ value: '2', label: '2' },
	{ value: '3', label: '3' },
	{ value: '4', label: '4' },
]

const SEAT_OPTIONS = [
	{ value: '0', label: '0' },
	{ value: '1', label: '1' },
	{ value: '2', label: '2' },
	{ value: '3', label: '3' },
	{ value: '4', label: '4' },
]

const PREVIOUS_OWNER_OPTIONS = [
	{ value: '0', label: 'New' },
	{ value: '1', label: '1' },
	{ value: '2', label: '2' },
	{ value: '3', label: '3' },
	{ value: '4', label: '4' },
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
		<CollapsibleSection title="Vehicle Details" info className={className}>
			<div className="flex flex-col gap-6">
				{/* Vehicle Type row */}
				<div className="flex items-center justify-between">
					<Label className="min-w-35">Vehicle Type</Label>
					<div className="flex items-center gap-2">
						<IconSelector
							options={VEHICLE_TYPE_OPTIONS}
							selected={vehicleType.field.value}
							onChange={(value) => {
								vehicleType.field.onChange(value)
								onFieldBlur?.('vehicleType')
							}}
						/>
						<button
							type="button"
							className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-white text-grey-100 transition-colors hover:bg-grey-25"
							aria-label="Add vehicle type"
						>
							<Plus className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Motor Type row */}
				<div className="flex items-center justify-between">
					<Label className="min-w-35">Motor Type</Label>
					<div className="flex items-center gap-2">
						<IconSelector
							options={MOTOR_TYPE_OPTIONS}
							selected={motorType.field.value}
							onChange={(value) => {
								motorType.field.onChange(value)
								onFieldBlur?.('motorType')
							}}
						/>
						<button
							type="button"
							className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-white text-grey-100 transition-colors hover:bg-grey-25"
							aria-label="Add motor type"
						>
							<Plus className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Axles row */}
				<div className="flex items-center justify-between">
					<Label className="min-w-35">Axles</Label>
					<div className="flex items-center gap-2">
						<NumberChipSelector
							options={AXLE_OPTIONS}
							selected={String(axles.field.value)}
							onChange={(value) => {
								axles.field.onChange(Number(value))
								onFieldBlur?.('axles')
							}}
						/>
						<button
							type="button"
							className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-grey-100 transition-colors hover:bg-grey-25"
							aria-label="Add axle option"
						>
							<Plus className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Driven by this row */}
				<div className="flex items-center justify-between">
					<Label className="min-w-35">Driven by this</Label>
					<div className="flex items-center gap-2">
						<NumberChipSelector
							options={DRIVEN_AXLE_OPTIONS}
							selected={String(drivenAxles.field.value)}
							onChange={(value) => {
								drivenAxles.field.onChange(Number(value))
								onFieldBlur?.('drivenAxles')
							}}
						/>
						<button
							type="button"
							className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-grey-100 transition-colors hover:bg-grey-25"
							aria-label="Add driven option"
						>
							<Plus className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Doors row */}
				<div className="flex items-center justify-between">
					<Label className="min-w-35">Doors</Label>
					<div className="flex items-center gap-2">
						<NumberChipSelector
							options={DOOR_OPTIONS}
							selected={String(doors.field.value)}
							onChange={(value) => {
								doors.field.onChange(Number(value))
								onFieldBlur?.('doors')
							}}
						/>
						<button
							type="button"
							className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-grey-100 transition-colors hover:bg-grey-25"
							aria-label="Add door option"
						>
							<Plus className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Seats row */}
				<div className="flex items-center justify-between">
					<Label className="min-w-35">Seats</Label>
					<div className="flex items-center gap-2">
						<NumberChipSelector
							options={SEAT_OPTIONS}
							selected={String(seats.field.value)}
							onChange={(value) => {
								seats.field.onChange(Number(value))
								onFieldBlur?.('seats')
							}}
						/>
						<button
							type="button"
							className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-grey-100 transition-colors hover:bg-grey-25"
							aria-label="Add seat option"
						>
							<Plus className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Previous Owners row */}
				<div className="flex items-center justify-between">
					<Label className="min-w-35">Previous Owners</Label>
					<div className="flex items-center gap-2">
						<NumberChipSelector
							options={PREVIOUS_OWNER_OPTIONS}
							selected={String(previousOwners.field.value)}
							onChange={(value) => {
								previousOwners.field.onChange(Number(value))
								onFieldBlur?.('previousOwners')
							}}
						/>
						<button
							type="button"
							className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-grey-100 transition-colors hover:bg-grey-25"
							aria-label="Add previous owner option"
						>
							<Plus className="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>
		</CollapsibleSection>
	)
}

export { DetailsSection }
