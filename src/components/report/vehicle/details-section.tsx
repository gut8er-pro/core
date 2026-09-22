'use client'

import { Bus, Car, Fuel, Leaf, Truck, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useController } from 'react-hook-form'
import { useMissingProps, useSectionBadge } from '@/components/report/missing-info'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { IconSelector } from '@/components/ui/icon-selector'
import { Label } from '@/components/ui/label'
import { NumberChipSelector } from '@/components/ui/number-chip-selector'
import { SECTION } from '@/lib/completeness'
import { CustomValuePill } from './custom-value-pill'
import type { VehicleSectionProps } from './types'

const numberOptions = (from: number, to: number) =>
	Array.from({ length: to - from + 1 }, (_, index) => {
		const value = String(from + index)
		return { value, label: value }
	})

const AXLE_OPTIONS = numberOptions(1, 5)
const DRIVEN_AXLE_OPTIONS = numberOptions(1, 5)
const DOOR_OPTIONS = numberOptions(1, 4)
const SEAT_OPTIONS = numberOptions(1, 5)

function DetailsSection({
	control,
	onFieldBlur,
	disabled,
	className,
}: VehicleSectionProps & { className?: string }) {
	const t = useTranslations('report')
	const missing = useMissingProps()
	const badge = useSectionBadge(SECTION.vehicleDetails)

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
		...numberOptions(1, 4),
	]

	const numberPlaceholder = t('vehicle.details.customNumberPlaceholder')
	const labelPlaceholder = t('vehicle.details.customLabelPlaceholder')
	const confirmLabel = t('vehicle.details.confirmCustomValue')

	const vehicleType = useController({ control, name: 'vehicleType' })
	const motorType = useController({ control, name: 'motorType' })
	const axles = useController({ control, name: 'axles' })
	const drivenAxles = useController({ control, name: 'drivenAxles' })
	const doors = useController({ control, name: 'doors' })
	const seats = useController({ control, name: 'seats' })
	const previousOwners = useController({ control, name: 'previousOwners' })

	const chipValue = (value: number | null | undefined) => (value == null ? '' : String(value))

	const isCustom = (value: number | null | undefined, options: { value: string }[]) =>
		value != null && !options.some((option) => option.value === String(value))

	const isCustomLabel = (value: string, options: { value: string }[]) =>
		!!value && !options.some((option) => option.value === value)

	return (
		<CollapsibleSection title={t('vehicle.details.heading')} info className={className} {...badge}>
			<fieldset disabled={disabled} className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<Label className="min-w-35">{t('vehicle.details.vehicleType')}</Label>
					<div className="flex items-center gap-2">
						<IconSelector
							options={
								isCustomLabel(vehicleType.field.value, VEHICLE_TYPE_OPTIONS)
									? [
											...VEHICLE_TYPE_OPTIONS,
											{ value: vehicleType.field.value, label: vehicleType.field.value, icon: Car },
										]
									: VEHICLE_TYPE_OPTIONS
							}
							selected={vehicleType.field.value}
							onChange={(value) => {
								vehicleType.field.onChange(value)
								onFieldBlur?.('vehicleType')
							}}
							{...missing('vehicleType')}
						/>
						<CustomValuePill
							mode="label"
							addLabel={t('vehicle.details.addVehicleType')}
							confirmLabel={confirmLabel}
							placeholder={labelPlaceholder}
							value={vehicleType.field.value}
							selected={false}
							disabled={disabled}
							onCommit={(value) => {
								vehicleType.field.onChange(value)
								onFieldBlur?.('vehicleType')
							}}
						/>
					</div>
				</div>

				<div className="flex items-center justify-between">
					<Label className="min-w-35">{t('vehicle.details.motorType')}</Label>
					<div className="flex items-center gap-2">
						<IconSelector
							options={
								isCustomLabel(motorType.field.value, MOTOR_TYPE_OPTIONS)
									? [
											...MOTOR_TYPE_OPTIONS,
											{ value: motorType.field.value, label: motorType.field.value, icon: Fuel },
										]
									: MOTOR_TYPE_OPTIONS
							}
							selected={motorType.field.value}
							onChange={(value) => {
								motorType.field.onChange(value)
								onFieldBlur?.('motorType')
							}}
							{...missing('motorType')}
						/>
						<CustomValuePill
							mode="label"
							addLabel={t('vehicle.details.addMotorType')}
							confirmLabel={confirmLabel}
							placeholder={labelPlaceholder}
							value={motorType.field.value}
							selected={false}
							disabled={disabled}
							onCommit={(value) => {
								motorType.field.onChange(value)
								onFieldBlur?.('motorType')
							}}
						/>
					</div>
				</div>

				<div className="flex items-center justify-between">
					<Label className="min-w-35">{t('vehicle.details.axles')}</Label>
					<div className="flex items-center gap-2">
						<NumberChipSelector
							options={AXLE_OPTIONS}
							selected={chipValue(axles.field.value)}
							onChange={(value) => {
								axles.field.onChange(Number(value))
								onFieldBlur?.('axles')
							}}
						/>
						<CustomValuePill
							mode="numeric"
							addLabel={t('vehicle.details.addAxleOption')}
							confirmLabel={confirmLabel}
							placeholder={numberPlaceholder}
							value={chipValue(axles.field.value)}
							selected={isCustom(axles.field.value, AXLE_OPTIONS)}
							disabled={disabled}
							onCommit={(value) => {
								axles.field.onChange(Number(value))
								onFieldBlur?.('axles')
							}}
						/>
					</div>
				</div>

				<div className="flex items-center justify-between">
					<Label className="min-w-35">{t('vehicle.details.drivenBy')}</Label>
					<div className="flex items-center gap-2">
						<NumberChipSelector
							options={DRIVEN_AXLE_OPTIONS}
							selected={chipValue(drivenAxles.field.value)}
							onChange={(value) => {
								drivenAxles.field.onChange(Number(value))
								onFieldBlur?.('drivenAxles')
							}}
						/>
						<CustomValuePill
							mode="numeric"
							addLabel={t('vehicle.details.addDrivenOption')}
							confirmLabel={confirmLabel}
							placeholder={numberPlaceholder}
							value={chipValue(drivenAxles.field.value)}
							selected={isCustom(drivenAxles.field.value, DRIVEN_AXLE_OPTIONS)}
							disabled={disabled}
							onCommit={(value) => {
								drivenAxles.field.onChange(Number(value))
								onFieldBlur?.('drivenAxles')
							}}
						/>
					</div>
				</div>

				<div className="flex items-center justify-between">
					<Label className="min-w-35">{t('vehicle.details.doors')}</Label>
					<div className="flex items-center gap-2">
						<NumberChipSelector
							options={DOOR_OPTIONS}
							selected={chipValue(doors.field.value)}
							onChange={(value) => {
								doors.field.onChange(Number(value))
								onFieldBlur?.('doors')
							}}
						/>
						<CustomValuePill
							mode="numeric"
							addLabel={t('vehicle.details.addDoorOption')}
							confirmLabel={confirmLabel}
							placeholder={numberPlaceholder}
							value={chipValue(doors.field.value)}
							selected={isCustom(doors.field.value, DOOR_OPTIONS)}
							disabled={disabled}
							onCommit={(value) => {
								doors.field.onChange(Number(value))
								onFieldBlur?.('doors')
							}}
						/>
					</div>
				</div>

				<div className="flex items-center justify-between">
					<Label className="min-w-35">{t('vehicle.details.seats')}</Label>
					<div className="flex items-center gap-2">
						<NumberChipSelector
							options={SEAT_OPTIONS}
							selected={chipValue(seats.field.value)}
							onChange={(value) => {
								seats.field.onChange(Number(value))
								onFieldBlur?.('seats')
							}}
						/>
						<CustomValuePill
							mode="numeric"
							addLabel={t('vehicle.details.addSeatOption')}
							confirmLabel={confirmLabel}
							placeholder={numberPlaceholder}
							value={chipValue(seats.field.value)}
							selected={isCustom(seats.field.value, SEAT_OPTIONS)}
							disabled={disabled}
							onCommit={(value) => {
								seats.field.onChange(Number(value))
								onFieldBlur?.('seats')
							}}
						/>
					</div>
				</div>

				<div className="flex items-center justify-between">
					<Label className="min-w-35">{t('vehicle.details.previousOwners')}</Label>
					<div className="flex items-center gap-2">
						<NumberChipSelector
							options={PREVIOUS_OWNER_OPTIONS}
							selected={chipValue(previousOwners.field.value)}
							onChange={(value) => {
								const next = previousOwners.field.value === Number(value) ? null : Number(value)
								previousOwners.field.onChange(next)
								onFieldBlur?.('previousOwners')
							}}
						/>
						<CustomValuePill
							mode="numeric"
							addLabel={t('vehicle.details.addPreviousOwnerOption')}
							confirmLabel={confirmLabel}
							placeholder={numberPlaceholder}
							value={chipValue(previousOwners.field.value)}
							selected={isCustom(previousOwners.field.value, PREVIOUS_OWNER_OPTIONS)}
							disabled={disabled}
							onCommit={(value) => {
								previousOwners.field.onChange(Number(value))
								onFieldBlur?.('previousOwners')
							}}
						/>
					</div>
				</div>
			</fieldset>
		</CollapsibleSection>
	)
}

export { DetailsSection }
