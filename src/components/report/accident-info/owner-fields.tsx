'use client'

import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { useFieldProps } from '@/components/report/missing-info'
import { Label } from '@/components/ui/label'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'
import type { SectionProps } from './types'

/**
 * The Fahrzeughalter, shown inside the claimant block once the assessor says the
 * claimant is not the owner. Same shape as the claimant minus the payment and
 * tax fields, which belong to whoever is being paid out.
 */
function OwnerFields({ register, control, errors, onFieldBlur, disabled }: SectionProps) {
	const t = useTranslations('report')
	const fieldProps = useFieldProps({ register, errors, onFieldBlur })

	const salutationOptions = [
		{ value: 'mr', label: t('accidentInfo.salutationOptions.mr') },
		{ value: 'mrs', label: t('accidentInfo.salutationOptions.mrs') },
		{ value: 'dr', label: t('accidentInfo.salutationOptions.dr') },
		{ value: 'prof', label: t('accidentInfo.salutationOptions.prof') },
		{ value: 'company', label: t('accidentInfo.company') },
	]

	return (
		<div className="flex flex-col gap-4 border-t border-border-subtle pt-4">
			<Label className="text-body-sm font-semibold">{t('accidentInfo.owner.title')}</Label>

			<TextField
				label={t('accidentInfo.company')}
				placeholder={t('accidentInfo.companyPlaceholder')}
				disabled={disabled}
				{...fieldProps('ownerCompany')}
			/>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Controller
					control={control}
					name="ownerSalutation"
					render={({ field }) => (
						<SelectField
							label={t('accidentInfo.salutation')}
							options={salutationOptions}
							placeholder={t('accidentInfo.salutationPlaceholder')}
							value={field.value ?? ''}
							error={errors.ownerSalutation?.message}
							disabled={disabled}
							onValueChange={(value) => {
								field.onChange(value)
								onFieldBlur?.('ownerSalutation')
							}}
						/>
					)}
				/>
				<TextField
					label={t('accidentInfo.firstName')}
					placeholder={t('accidentInfo.firstName')}
					disabled={disabled}
					{...fieldProps('ownerFirstName')}
				/>
				<TextField
					label={t('accidentInfo.lastName')}
					placeholder={t('accidentInfo.lastName')}
					disabled={disabled}
					{...fieldProps('ownerLastName')}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<TextField
					label={t('accidentInfo.street')}
					placeholder={t('accidentInfo.streetPlaceholder')}
					disabled={disabled}
					{...fieldProps('ownerStreet')}
				/>
				<TextField
					label={t('accidentInfo.postcode')}
					placeholder={t('accidentInfo.postcodePlaceholder')}
					disabled={disabled}
					{...fieldProps('ownerPostcode')}
				/>
				<TextField
					label={t('accidentInfo.location')}
					placeholder="Berlin"
					disabled={disabled}
					{...fieldProps('ownerLocation')}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<TextField
					label={t('accidentInfo.email')}
					type="email"
					placeholder="halter@example.de"
					disabled={disabled}
					{...fieldProps('ownerEmail')}
				/>
				<TextField
					label={t('accidentInfo.phoneNumber')}
					type="tel"
					placeholder="+49 421 112233"
					disabled={disabled}
					{...fieldProps('ownerPhone')}
				/>
			</div>
		</div>
	)
}

export { OwnerFields }
