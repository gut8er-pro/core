'use client'

import { Bus, Car, Fuel, Leaf, Plus, Truck, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useController } from 'react-hook-form'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { IconSelector } from '@/components/ui/icon-selector'
import { Label } from '@/components/ui/label'
import { NumberChipSelector } from '@/components/ui/number-chip-selector'
import type { VehicleSectionProps } from './types'

// Options defined inside component to access translations

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

function DetailsSection({
	control,
	onFieldBlur,
	className,
}: VehicleSectionProps & { className?: string }) {
	const t = useTranslations('report')

	const VEHICLE_TYPE_OPTIONS = [
		{ value: 'sedan', label: t('vehicle.details.vehicleTypeOptions.sedan'), icon: Car },
		{ value: 'compact', label: t('vehicle.details.vehicleTypeOptions.compactCar'), icon: Car },
		{ value: 'suv', label: t('vehicle.details.vehicleTypeOptions.suv'), icon: Truck },
		{ value: 'wagon', label: t('vehicle.details.vehicleTypeOptions.wagon'), icon: Bus },
		{ value: 'coupe', label: t('vehicle.details.vehicleTypeOptions.coupe'), icon: Car },
		{ value: 'convertible', label: t('vehicle.details.vehicleTypeOptions.convertible'), icon: Car },
		{ value: 'van', label: t('vehicle.details.vehicleTypeOptions.van'), icon: Truck },
	]

	const MOTOR_TYPE_OPTIONS = [
		{ value: 'petrol', label: t('vehicle.details.motorTypeOptions.petrol'), icon: Fuel },
		{ value: 'diesel', label: t('vehicle.details.motorTypeOptions.diesel'), icon: Fuel },
		{ value: 'electric', label: t('vehicle.details.motorTypeOptions.electric'), icon: Zap },
		{ value: 'hybrid', label: t('vehicle.details.motorTypeOptions.hybrid'), icon: Leaf },
		{ value: 'gas', label: t('vehicle.details.motorTypeOptions.gas'), icon: Fuel },
	]

	const PREVIOUS_OWNER_OPTIONS = [
		{ value: '0', label: t('vehicle.details.new') },
		{ value: '1', label: '1' },
		{ value: '2', label: '2' },
		{ value: '3', label: '3' },
		{ value: '4', label: '4' },
	]
	const vehicleType = useController({ control, name: 'vehicleType' })
	const motorType = useController({ control, name: 'motorType' })
	const axles = useController({ control, name: 'axles' })
	const drivenAxles = useController({ control, name: 'drivenAxles' })
	const doors = useController({ control, name: 'doors' })
	const seats = useController({ control, name: 'seats' })
	const previousOwners = useController({ control, name: 'previousOwners' })

	return (
		<CollapsibleSection title={t('vehicle.details.heading')} info className={className}>
			<div className="flex flex-col gap-6">
				{/* Vehicle Type row */}
				<div className="flex items-center justify-between">
					<Label className="min-w-35">{t('vehicle.details.vehicleType')}</Label>
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
							aria-label={t('vehicle.details.addVehicleType')}
						>
							<Plus className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Motor Type row */}
				<div className="flex items-center justify-between">
					<Label className="min-w-35">{t('vehicle.details.motorType')}</Label>
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
							aria-label={t('vehicle.details.addMotorType')}
						>
							<Plus className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Axles row */}
				<div className="flex items-center justify-between">
					<Label className="min-w-35">{t('vehicle.details.axles')}</Label>
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
							aria-label={t('vehicle.details.addAxleOption')}
						>
							<Plus className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Driven by this row */}
				<div className="flex items-center justify-between">
					<Label className="min-w-35">{t('vehicle.details.drivenBy')}</Label>
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
							aria-label={t('vehicle.details.addDrivenOption')}
						>
							<Plus className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Doors row */}
				<div className="flex items-center justify-between">
					<Label className="min-w-35">{t('vehicle.details.doors')}</Label>
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
							aria-label={t('vehicle.details.addDoorOption')}
						>
							<Plus className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Seats row */}
				<div className="flex items-center justify-between">
					<Label className="min-w-35">{t('vehicle.details.seats')}</Label>
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
							aria-label={t('vehicle.details.addSeatOption')}
						>
							<Plus className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Previous Owners row */}
				<div className="flex items-center justify-between">
					<Label className="min-w-35">{t('vehicle.details.previousOwners')}</Label>
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
							aria-label={t('vehicle.details.addPreviousOwnerOption')}
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
