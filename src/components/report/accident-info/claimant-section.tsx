'use client'

import { useWatch } from 'react-hook-form'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { SelectField } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { LicensePlate } from '@/components/ui/license-plate'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { SectionProps } from './types'

const salutationOptions = [
	{ value: 'mr', label: 'Mr' },
	{ value: 'mrs', label: 'Mrs' },
	{ value: 'dr', label: 'Dr' },
	{ value: 'prof', label: 'Prof' },
	{ value: 'company', label: 'Company' },
]

function ClaimantSection({ register, control, errors, onFieldBlur, className }: SectionProps & { className?: string }) {
	const representedByLawyer = useWatch({ control, name: 'claimantRepresentedByLawyer' })
	const licensePlate = useWatch({ control, name: 'claimantLicensePlate' })

	return (
		<CollapsibleSection title="Claimant Information" defaultOpen className={className}>
			<div className="flex flex-col gap-4">
				<TextField
					label="Company"
					placeholder="Company name"
					error={errors.claimantCompany?.message}
					{...register('claimantCompany')}
					onBlur={() => onFieldBlur?.('claimantCompany')}
				/>

				<SelectField
					label="Salutation"
					options={salutationOptions}
					placeholder="Select salutation"
					error={errors.claimantSalutation?.message}
					onValueChange={(value) => {
						// Trigger form update through control
						const event = { target: { name: 'claimantSalutation', value } }
						register('claimantSalutation').onChange(event)
						onFieldBlur?.('claimantSalutation')
					}}
				/>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<TextField
						label="First Name"
						placeholder="First name"
						error={errors.claimantFirstName?.message}
						{...register('claimantFirstName')}
						onBlur={() => onFieldBlur?.('claimantFirstName')}
					/>
					<TextField
						label="Last Name"
						placeholder="Last name"
						error={errors.claimantLastName?.message}
						{...register('claimantLastName')}
						onBlur={() => onFieldBlur?.('claimantLastName')}
					/>
				</div>

				<TextField
					label="Street"
					placeholder="Street and house number"
					error={errors.claimantStreet?.message}
					{...register('claimantStreet')}
					onBlur={() => onFieldBlur?.('claimantStreet')}
				/>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<TextField
						label="Postcode"
						placeholder="28195"
						error={errors.claimantPostcode?.message}
						{...register('claimantPostcode')}
						onBlur={() => onFieldBlur?.('claimantPostcode')}
					/>
					<TextField
						label="Location"
						placeholder="City"
						error={errors.claimantLocation?.message}
						{...register('claimantLocation')}
						onBlur={() => onFieldBlur?.('claimantLocation')}
					/>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<TextField
						label="Email"
						type="email"
						placeholder="email@example.com"
						error={errors.claimantEmail?.message}
						{...register('claimantEmail')}
						onBlur={() => onFieldBlur?.('claimantEmail')}
					/>
					<TextField
						label="Phone"
						type="tel"
						placeholder="+49"
						error={errors.claimantPhone?.message}
						{...register('claimantPhone')}
						onBlur={() => onFieldBlur?.('claimantPhone')}
					/>
				</div>

				<TextField
					label="Vehicle Make"
					placeholder="e.g. BMW, Mercedes-Benz"
					error={errors.claimantVehicleMake?.message}
					{...register('claimantVehicleMake')}
					onBlur={() => onFieldBlur?.('claimantVehicleMake')}
				/>

				<div className="flex flex-col gap-1">
					<Label>License Plate</Label>
					<div className="flex items-center gap-4">
						<TextField
							placeholder="B AB 1234"
							error={errors.claimantLicensePlate?.message}
							{...register('claimantLicensePlate')}
							onBlur={() => onFieldBlur?.('claimantLicensePlate')}
							className="flex-1"
						/>
						{licensePlate && (
							<LicensePlate plate={licensePlate} />
						)}
					</div>
				</div>

				<div className="flex flex-col gap-2 pt-2">
					<div className="flex items-center gap-2">
						<Checkbox
							id="claimant-eligible-input-tax"
							checked={undefined}
							onCheckedChange={(checked) => {
								const event = { target: { name: 'claimantEligibleForInputTaxDeduction', value: !!checked } }
								register('claimantEligibleForInputTaxDeduction').onChange(event)
								onFieldBlur?.('claimantEligibleForInputTaxDeduction')
							}}
							{...register('claimantEligibleForInputTaxDeduction')}
						/>
						<Label htmlFor="claimant-eligible-input-tax" className="cursor-pointer font-normal">
							Eligible for input tax deduction
						</Label>
					</div>

					<div className="flex items-center gap-2">
						<Checkbox
							id="claimant-is-vehicle-owner"
							defaultChecked
							onCheckedChange={(checked) => {
								const event = { target: { name: 'claimantIsVehicleOwner', value: !!checked } }
								register('claimantIsVehicleOwner').onChange(event)
								onFieldBlur?.('claimantIsVehicleOwner')
							}}
							{...register('claimantIsVehicleOwner')}
						/>
						<Label htmlFor="claimant-is-vehicle-owner" className="cursor-pointer font-normal">
							Is vehicle owner
						</Label>
					</div>

					<div className="flex items-center gap-2">
						<Checkbox
							id="claimant-represented-by-lawyer"
							onCheckedChange={(checked) => {
								const event = { target: { name: 'claimantRepresentedByLawyer', value: !!checked } }
								register('claimantRepresentedByLawyer').onChange(event)
								onFieldBlur?.('claimantRepresentedByLawyer')
							}}
							{...register('claimantRepresentedByLawyer')}
						/>
						<Label htmlFor="claimant-represented-by-lawyer" className="cursor-pointer font-normal">
							Represented by lawyer
						</Label>
					</div>
				</div>

				{representedByLawyer && (
					<TextField
						label="Involved Lawyer"
						placeholder="Lawyer name or firm"
						error={errors.claimantInvolvedLawyer?.message}
						{...register('claimantInvolvedLawyer')}
						onBlur={() => onFieldBlur?.('claimantInvolvedLawyer')}
					/>
				)}
			</div>
		</CollapsibleSection>
	)
}

export { ClaimantSection }
