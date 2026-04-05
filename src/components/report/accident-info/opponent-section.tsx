'use client'

import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'
import type { SectionProps } from './types'

const salutationOptions = [
	{ value: 'mr', label: 'Mr' },
	{ value: 'mrs', label: 'Mrs' },
	{ value: 'dr', label: 'Dr' },
	{ value: 'prof', label: 'Prof' },
	{ value: 'company', label: 'Company' },
]

function OpponentSection({
	register,
	errors,
	onFieldBlur,
	className,
}: SectionProps & { className?: string }) {
	return (
		<CollapsibleSection title="Opponent in Accident" info className={className}>
			<div className="flex flex-col gap-4">
				<TextField
					label="Company"
					placeholder="Company name"
					error={errors.opponentCompany?.message}
					{...register('opponentCompany')}
					onBlur={() => onFieldBlur?.('opponentCompany')}
				/>

				{/* Salutation / First Name / Last Name — 3 columns */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<SelectField
						label="Salutation"
						options={salutationOptions}
						placeholder="Select"
						error={errors.opponentSalutation?.message}
						onValueChange={(value) => {
							const event = { target: { name: 'opponentSalutation', value } }
							register('opponentSalutation').onChange(event)
							onFieldBlur?.('opponentSalutation')
						}}
					/>
					<TextField
						label="First Name"
						placeholder="First name"
						error={errors.opponentFirstName?.message}
						{...register('opponentFirstName')}
						onBlur={() => onFieldBlur?.('opponentFirstName')}
					/>
					<TextField
						label="Last Name"
						placeholder="Last name"
						error={errors.opponentLastName?.message}
						{...register('opponentLastName')}
						onBlur={() => onFieldBlur?.('opponentLastName')}
					/>
				</div>

				{/* Street / Postcode / Location — 3 columns */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<TextField
						label="Street & house number or PO box"
						placeholder="Street address or p.o. box"
						error={errors.opponentStreet?.message}
						{...register('opponentStreet')}
						onBlur={() => onFieldBlur?.('opponentStreet')}
					/>
					<TextField
						label="Postcode"
						placeholder="eg 0565012"
						error={errors.opponentPostcode?.message}
						{...register('opponentPostcode')}
						onBlur={() => onFieldBlur?.('opponentPostcode')}
					/>
					<TextField
						label="Location"
						placeholder="Berlin"
						error={errors.opponentLocation?.message}
						{...register('opponentLocation')}
						onBlur={() => onFieldBlur?.('opponentLocation')}
					/>
				</div>

				{/* Email / BAN / Phone — 3 columns */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<TextField
						label="Email"
						type="email"
						placeholder="email@example.com"
						error={errors.opponentEmail?.message}
						{...register('opponentEmail')}
						onBlur={() => onFieldBlur?.('opponentEmail')}
					/>
					<TextField
						label="IBAN"
						placeholder="123/456/78901"
						error={errors.opponentIban?.message}
						{...register('opponentIban')}
						onBlur={() => onFieldBlur?.('opponentIban')}
					/>
					<TextField
						label="Phone Number"
						type="tel"
						placeholder="+49523568410"
						error={errors.opponentPhone?.message}
						{...register('opponentPhone')}
						onBlur={() => onFieldBlur?.('opponentPhone')}
					/>
				</div>

				{/* Insurance company */}
				<TextField
					label="Insurance company"
					placeholder="Insurance company name"
					error={errors.opponentInsuranceCompany?.message}
					{...register('opponentInsuranceCompany')}
					onBlur={() => onFieldBlur?.('opponentInsuranceCompany')}
				/>

				{/* Insurance number / Claim number — 2 columns */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<TextField
						label="Insurance number"
						placeholder="Policy number"
						error={errors.opponentInsuranceNumber?.message}
						{...register('opponentInsuranceNumber')}
						onBlur={() => onFieldBlur?.('opponentInsuranceNumber')}
					/>
					<TextField
						label="Claim number"
						placeholder="Claim reference"
						error={errors.opponentClaimNumber?.message}
						{...register('opponentClaimNumber')}
						onBlur={() => onFieldBlur?.('opponentClaimNumber')}
					/>
				</div>
			</div>
		</CollapsibleSection>
	)
}

export { OpponentSection }
