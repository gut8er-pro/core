'use client'

import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { useFieldProps, useSectionBadge } from '@/components/report/missing-info'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'
import { SECTION } from '@/lib/completeness'
import { IbanField } from './iban-field'
import type { SectionProps } from './types'

function OpponentSection({
	register,
	control,
	errors,
	onFieldBlur,
	disabled,
	className,
}: SectionProps & { className?: string }) {
	const t = useTranslations('report')
	const fieldProps = useFieldProps({ register, errors, onFieldBlur })
	const badge = useSectionBadge(SECTION.opponent)

	const salutationOptions = [
		{ value: 'mr', label: t('accidentInfo.salutationOptions.mr') },
		{ value: 'mrs', label: t('accidentInfo.salutationOptions.mrs') },
		{ value: 'dr', label: t('accidentInfo.salutationOptions.dr') },
		{ value: 'prof', label: t('accidentInfo.salutationOptions.prof') },
		{ value: 'company', label: t('accidentInfo.company') },
	]

	return (
		<CollapsibleSection
			title={t('accidentInfo.opponent.title')}
			info
			className={className}
			{...badge}
		>
			<div className="flex flex-col gap-4">
				<TextField
					label={t('accidentInfo.company')}
					placeholder={t('accidentInfo.companyPlaceholder')}
					disabled={disabled}
					{...fieldProps('opponentCompany')}
				/>

				{/* Salutation / First Name / Last Name — 3 columns */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<Controller
						control={control}
						name="opponentSalutation"
						render={({ field }) => (
							<SelectField
								label={t('accidentInfo.salutation')}
								options={salutationOptions}
								placeholder={t('accidentInfo.salutationPlaceholder')}
								value={field.value ?? ''}
								error={errors.opponentSalutation?.message}
								disabled={disabled}
								onValueChange={(value) => {
									field.onChange(value)
									onFieldBlur?.('opponentSalutation')
								}}
							/>
						)}
					/>
					<TextField
						label={t('accidentInfo.firstName')}
						placeholder={t('accidentInfo.firstName')}
						disabled={disabled}
						{...fieldProps('opponentFirstName')}
					/>
					<TextField
						label={t('accidentInfo.lastName')}
						placeholder={t('accidentInfo.lastName')}
						disabled={disabled}
						{...fieldProps('opponentLastName')}
					/>
				</div>

				{/* Street / Postcode / Location — 3 columns */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<TextField
						label={t('accidentInfo.street')}
						placeholder={t('accidentInfo.streetPlaceholder')}
						disabled={disabled}
						{...fieldProps('opponentStreet')}
					/>
					<TextField
						label={t('accidentInfo.postcode')}
						placeholder={t('accidentInfo.postcodePlaceholder')}
						disabled={disabled}
						{...fieldProps('opponentPostcode')}
					/>
					<TextField
						label={t('accidentInfo.location')}
						placeholder="Berlin"
						disabled={disabled}
						{...fieldProps('opponentLocation')}
					/>
				</div>

				{/* Email / IBAN / Phone Number — 3 columns */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<TextField
						label={t('accidentInfo.email')}
						type="email"
						placeholder="email@example.com"
						disabled={disabled}
						{...fieldProps('opponentEmail')}
					/>
					<IbanField
						label={t('accidentInfo.iban')}
						invalidMessage={t('accidentInfo.ibanInvalid')}
						disabled={disabled}
						{...fieldProps('opponentIban')}
					/>
					<TextField
						label={t('accidentInfo.phoneNumber')}
						type="tel"
						placeholder="+49523568410"
						disabled={disabled}
						{...fieldProps('opponentPhone')}
					/>
				</div>

				{/* Insurance company */}
				<TextField
					label={t('accidentInfo.opponent.insuranceCompany')}
					placeholder={t('accidentInfo.opponent.insuranceCompany')}
					disabled={disabled}
					{...fieldProps('opponentInsuranceCompany')}
				/>

				{/* Insurance number / Claim number — 2 columns */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<TextField
						label={t('accidentInfo.opponent.insuranceNumber')}
						placeholder={t('accidentInfo.opponent.insuranceNumber')}
						disabled={disabled}
						{...fieldProps('opponentInsuranceNumber')}
					/>
					<TextField
						label={t('accidentInfo.opponent.claimNumber')}
						placeholder={t('accidentInfo.opponent.claimNumber')}
						disabled={disabled}
						{...fieldProps('opponentClaimNumber')}
					/>
				</div>
			</div>
		</CollapsibleSection>
	)
}

export { OpponentSection }
