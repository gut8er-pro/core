'use client'

import { useTranslations } from 'next-intl'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'
import type { SectionProps } from './types'

function OpponentSection({
	register,
	errors,
	onFieldBlur,
	className,
}: SectionProps & { className?: string }) {
	const t = useTranslations('report')

	const salutationOptions = [
		{ value: 'mr', label: t('accidentInfo.salutationOptions.mr') },
		{ value: 'mrs', label: t('accidentInfo.salutationOptions.mrs') },
		{ value: 'dr', label: t('accidentInfo.salutationOptions.dr') },
		{ value: 'prof', label: t('accidentInfo.salutationOptions.prof') },
		{ value: 'company', label: t('accidentInfo.company') },
	]

	return (
		<CollapsibleSection title={t('accidentInfo.opponent.title')} info className={className}>
			<div className="flex flex-col gap-4">
				<TextField
					label={t('accidentInfo.company')}
					placeholder={t('accidentInfo.companyPlaceholder')}
					error={errors.opponentCompany?.message}
					{...register('opponentCompany')}
					onBlur={() => onFieldBlur?.('opponentCompany')}
				/>

				{/* Salutation / First Name / Last Name — 3 columns */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<SelectField
						label={t('accidentInfo.salutation')}
						options={salutationOptions}
						placeholder={t('accidentInfo.salutationPlaceholder')}
						error={errors.opponentSalutation?.message}
						onValueChange={(value) => {
							const event = { target: { name: 'opponentSalutation', value } }
							register('opponentSalutation').onChange(event)
							onFieldBlur?.('opponentSalutation')
						}}
					/>
					<TextField
						label={t('accidentInfo.firstName')}
						placeholder={t('accidentInfo.firstName')}
						error={errors.opponentFirstName?.message}
						{...register('opponentFirstName')}
						onBlur={() => onFieldBlur?.('opponentFirstName')}
					/>
					<TextField
						label={t('accidentInfo.lastName')}
						placeholder={t('accidentInfo.lastName')}
						error={errors.opponentLastName?.message}
						{...register('opponentLastName')}
						onBlur={() => onFieldBlur?.('opponentLastName')}
					/>
				</div>

				{/* Street / Postcode / Location — 3 columns */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<TextField
						label={t('accidentInfo.street')}
						placeholder="Street address or p.o. box"
						error={errors.opponentStreet?.message}
						{...register('opponentStreet')}
						onBlur={() => onFieldBlur?.('opponentStreet')}
					/>
					<TextField
						label={t('accidentInfo.postcode')}
						placeholder="eg 0565012"
						error={errors.opponentPostcode?.message}
						{...register('opponentPostcode')}
						onBlur={() => onFieldBlur?.('opponentPostcode')}
					/>
					<TextField
						label={t('accidentInfo.location')}
						placeholder="Berlin"
						error={errors.opponentLocation?.message}
						{...register('opponentLocation')}
						onBlur={() => onFieldBlur?.('opponentLocation')}
					/>
				</div>

				{/* Email / BAN / Phone — 3 columns */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<TextField
						label={t('accidentInfo.email')}
						type="email"
						placeholder="email@example.com"
						error={errors.opponentEmail?.message}
						{...register('opponentEmail')}
						onBlur={() => onFieldBlur?.('opponentEmail')}
					/>
					<TextField
						label={t('accidentInfo.iban')}
						placeholder="123/456/78901"
						error={errors.opponentIban?.message}
						{...register('opponentIban')}
						onBlur={() => onFieldBlur?.('opponentIban')}
					/>
					<TextField
						label={t('accidentInfo.opponent.phoneNumber')}
						type="tel"
						placeholder="+49523568410"
						error={errors.opponentPhone?.message}
						{...register('opponentPhone')}
						onBlur={() => onFieldBlur?.('opponentPhone')}
					/>
				</div>

				{/* Insurance company */}
				<TextField
					label={t('accidentInfo.opponent.insuranceCompany')}
					placeholder={t('accidentInfo.opponent.insuranceCompany')}
					error={errors.opponentInsuranceCompany?.message}
					{...register('opponentInsuranceCompany')}
					onBlur={() => onFieldBlur?.('opponentInsuranceCompany')}
				/>

				{/* Insurance number / Claim number — 2 columns */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<TextField
						label={t('accidentInfo.opponent.insuranceNumber')}
						placeholder={t('accidentInfo.opponent.insuranceNumber')}
						error={errors.opponentInsuranceNumber?.message}
						{...register('opponentInsuranceNumber')}
						onBlur={() => onFieldBlur?.('opponentInsuranceNumber')}
					/>
					<TextField
						label={t('accidentInfo.opponent.claimNumber')}
						placeholder={t('accidentInfo.opponent.claimNumber')}
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
