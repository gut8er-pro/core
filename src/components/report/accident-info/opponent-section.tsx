'use client'

import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { SelectField } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { SectionProps } from './types'

const salutationOptions = [
	{ value: 'mr', label: 'Mr' },
	{ value: 'mrs', label: 'Mrs' },
	{ value: 'dr', label: 'Dr' },
	{ value: 'prof', label: 'Prof' },
	{ value: 'company', label: 'Company' },
]

function OpponentSection({ register, control, errors, onFieldBlur, className }: SectionProps & { className?: string }) {
	return (
		<CollapsibleSection title="Opponent in Accident" className={className}>
			<div className="flex flex-col gap-4">
				<TextField
					label="Company"
					placeholder="Company name"
					error={errors.opponentCompany?.message}
					{...register('opponentCompany')}
					onBlur={() => onFieldBlur?.('opponentCompany')}
				/>

				<SelectField
					label="Salutation"
					options={salutationOptions}
					placeholder="Select salutation"
					error={errors.opponentSalutation?.message}
					onValueChange={(value) => {
						const event = { target: { name: 'opponentSalutation', value } }
						register('opponentSalutation').onChange(event)
						onFieldBlur?.('opponentSalutation')
					}}
				/>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

				<TextField
					label="Street"
					placeholder="Street and house number"
					error={errors.opponentStreet?.message}
					{...register('opponentStreet')}
					onBlur={() => onFieldBlur?.('opponentStreet')}
				/>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<TextField
						label="Postcode"
						placeholder="28195"
						error={errors.opponentPostcode?.message}
						{...register('opponentPostcode')}
						onBlur={() => onFieldBlur?.('opponentPostcode')}
					/>
					<TextField
						label="Location"
						placeholder="City"
						error={errors.opponentLocation?.message}
						{...register('opponentLocation')}
						onBlur={() => onFieldBlur?.('opponentLocation')}
					/>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<TextField
						label="Email"
						type="email"
						placeholder="email@example.com"
						error={errors.opponentEmail?.message}
						{...register('opponentEmail')}
						onBlur={() => onFieldBlur?.('opponentEmail')}
					/>
					<TextField
						label="Phone"
						type="tel"
						placeholder="+49"
						error={errors.opponentPhone?.message}
						{...register('opponentPhone')}
						onBlur={() => onFieldBlur?.('opponentPhone')}
					/>
				</div>

				<TextField
					label="Insurance Company"
					placeholder="Insurance company name"
					error={errors.opponentInsuranceCompany?.message}
					{...register('opponentInsuranceCompany')}
					onBlur={() => onFieldBlur?.('opponentInsuranceCompany')}
				/>

				<TextField
					label="Insurance Number"
					placeholder="Policy number"
					error={errors.opponentInsuranceNumber?.message}
					{...register('opponentInsuranceNumber')}
					onBlur={() => onFieldBlur?.('opponentInsuranceNumber')}
				/>
			</div>
		</CollapsibleSection>
	)
}

export { OpponentSection }
