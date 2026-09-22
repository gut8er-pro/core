'use client'

import { useTranslations } from 'next-intl'
import { useFieldProps } from '@/components/report/missing-info'
import { Label } from '@/components/ui/label'
import { TextField } from '@/components/ui/text-field'
import type { SectionProps } from './types'

/** Shown inside the claimant block while "Represented by a lawyer" is checked. */
function LawyerFields({ register, errors, onFieldBlur, disabled }: SectionProps) {
	const t = useTranslations('report')
	const fieldProps = useFieldProps({ register, errors, onFieldBlur })

	return (
		<div className="flex flex-col gap-4 border-t border-border-subtle pt-4">
			<Label className="text-body-sm font-semibold">{t('accidentInfo.lawyer.title')}</Label>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<TextField
					label={t('accidentInfo.lawyer.firm')}
					placeholder={t('accidentInfo.lawyer.firmPlaceholder')}
					disabled={disabled}
					{...fieldProps('claimantLawyerFirm')}
				/>
				<TextField
					label={t('accidentInfo.involvedLawyer')}
					placeholder={t('accidentInfo.involvedLawyerPlaceholder')}
					disabled={disabled}
					{...fieldProps('claimantInvolvedLawyer')}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<TextField
					label={t('accidentInfo.street')}
					placeholder={t('accidentInfo.streetPlaceholder')}
					disabled={disabled}
					{...fieldProps('claimantLawyerStreet')}
				/>
				<TextField
					label={t('accidentInfo.postcode')}
					placeholder={t('accidentInfo.postcodePlaceholder')}
					disabled={disabled}
					{...fieldProps('claimantLawyerPostcode')}
				/>
				<TextField
					label={t('accidentInfo.location')}
					placeholder="Berlin"
					disabled={disabled}
					{...fieldProps('claimantLawyerLocation')}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<TextField
					label={t('accidentInfo.email')}
					type="email"
					placeholder="kanzlei@example.de"
					disabled={disabled}
					{...fieldProps('claimantLawyerEmail')}
				/>
				<TextField
					label={t('accidentInfo.phoneNumber')}
					type="tel"
					placeholder="+49 421 999888"
					disabled={disabled}
					{...fieldProps('claimantLawyerPhone')}
				/>
			</div>
		</div>
	)
}

export { LawyerFields }
