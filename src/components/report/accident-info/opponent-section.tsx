'use client'

import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { useFieldProps, useSectionBadge } from '@/components/report/missing-info'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'
import { SECTION } from '@/lib/completeness'
import type { SectionProps } from './types'

function OpponentSection({
	register,
	control,
	errors,
	onFieldBlur,
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
								value={field.value}
								error={errors.opponentSalutation?.message}
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
						{...fieldProps('opponentFirstName')}
					/>
					<TextField
						label={t('accidentInfo.lastName')}
						placeholder={t('accidentInfo.lastName')}
						{...fieldProps('opponentLastName')}
					/>
				</div>

				{/* Street / Postcode / Location — 3 columns */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<TextField
						label={t('accidentInfo.street')}
						placeholder={t('accidentInfo.streetPlaceholder')}
						{...fieldProps('opponentStreet')}
					/>
					<TextField
						label={t('accidentInfo.postcode')}
						placeholder={t('accidentInfo.postcodePlaceholder')}
						{...fieldProps('opponentPostcode')}
					/>
					<TextField
						label={t('accidentInfo.location')}
						placeholder="Berlin"
						{...fieldProps('opponentLocation')}
					/>
				</div>

				{/* Email / IBAN / Phone Number — 3 columns */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<TextField
						label={t('accidentInfo.email')}
						type="email"
						placeholder="email@example.com"
						{...fieldProps('opponentEmail')}
					/>
					<TextField
						label={t('accidentInfo.iban')}
						placeholder="DE89 3704 0044 0532 0130 00"
						{...fieldProps('opponentIban')}
					/>
					<TextField
						label={t('accidentInfo.phoneNumber')}
						type="tel"
						placeholder="+49523568410"
						{...fieldProps('opponentPhone')}
					/>
				</div>

				{/* Insurance company */}
				<TextField
					label={t('accidentInfo.opponent.insuranceCompany')}
					placeholder={t('accidentInfo.opponent.insuranceCompany')}
					{...fieldProps('opponentInsuranceCompany')}
				/>

				{/* Insurance number / Claim number — 2 columns */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<TextField
						label={t('accidentInfo.opponent.insuranceNumber')}
						placeholder={t('accidentInfo.opponent.insuranceNumber')}
						{...fieldProps('opponentInsuranceNumber')}
					/>
					<TextField
						label={t('accidentInfo.opponent.claimNumber')}
						placeholder={t('accidentInfo.opponent.claimNumber')}
						{...fieldProps('opponentClaimNumber')}
					/>
				</div>
			</div>
		</CollapsibleSection>
	)
}

export { OpponentSection }
