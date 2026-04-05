'use client'

import { useTranslations } from 'next-intl'
import { useWatch } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { Label } from '@/components/ui/label'
import { LicensePlate } from '@/components/ui/license-plate'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'
import type { SectionProps } from './types'

function ClaimantSection({
	register,
	control,
	errors,
	onFieldBlur,
	reportType,
	className,
}: SectionProps & { className?: string }) {
	const t = useTranslations('report')
	const representedByLawyer = useWatch({ control, name: 'claimantRepresentedByLawyer' })
	const eligibleForTax = useWatch({ control, name: 'claimantEligibleForInputTaxDeduction' })
	const licensePlate = useWatch({ control, name: 'claimantLicensePlate' })

	const isOT = reportType === 'OT'
	const sectionTitle = isOT ? t('accidentInfo.client') : t('accidentInfo.claimantInformation')

	const salutationOptions = [
		{ value: 'mr', label: t('accidentInfo.salutationOptions.mr') },
		{ value: 'mrs', label: t('accidentInfo.salutationOptions.mrs') },
		{ value: 'dr', label: t('accidentInfo.salutationOptions.dr') },
		{ value: 'prof', label: t('accidentInfo.salutationOptions.prof') },
		{ value: 'company', label: t('accidentInfo.company') },
	]

	return (
		<CollapsibleSection title={sectionTitle} info defaultOpen className={className}>
			<div className="flex flex-col gap-4">
				<TextField
					label={t('accidentInfo.company')}
					placeholder={t('accidentInfo.companyPlaceholder')}
					error={errors.claimantCompany?.message}
					{...register('claimantCompany')}
					onBlur={() => onFieldBlur?.('claimantCompany')}
				/>

				{/* Salutation | First Name | Last Name — 3-column per Figma */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<SelectField
						label={t('accidentInfo.salutation')}
						options={salutationOptions}
						placeholder={t('accidentInfo.salutationPlaceholder')}
						error={errors.claimantSalutation?.message}
						onValueChange={(value) => {
							const event = { target: { name: 'claimantSalutation', value } }
							register('claimantSalutation').onChange(event)
							onFieldBlur?.('claimantSalutation')
						}}
					/>
					<TextField
						label={t('accidentInfo.firstName')}
						placeholder={t('accidentInfo.firstName')}
						error={errors.claimantFirstName?.message}
						{...register('claimantFirstName')}
						onBlur={() => onFieldBlur?.('claimantFirstName')}
					/>
					<TextField
						label={t('accidentInfo.lastName')}
						placeholder={t('accidentInfo.lastName')}
						error={errors.claimantLastName?.message}
						{...register('claimantLastName')}
						onBlur={() => onFieldBlur?.('claimantLastName')}
					/>
				</div>

				{/* Street | Postcode | Location — 3-column per Figma */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label={t('accidentInfo.street')}
						placeholder="Musterstraße 123"
						error={errors.claimantStreet?.message}
						{...register('claimantStreet')}
						onBlur={() => onFieldBlur?.('claimantStreet')}
					/>
					<TextField
						label={t('accidentInfo.postcode')}
						placeholder="R0S312"
						error={errors.claimantPostcode?.message}
						{...register('claimantPostcode')}
						onBlur={() => onFieldBlur?.('claimantPostcode')}
					/>
					<TextField
						label={t('accidentInfo.location')}
						placeholder="Berlin"
						error={errors.claimantLocation?.message}
						{...register('claimantLocation')}
						onBlur={() => onFieldBlur?.('claimantLocation')}
					/>
				</div>

				{/* Email | IBAN | First number (Claimant) — 3-column per Figma */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label={t('accidentInfo.email')}
						type="email"
						placeholder="markecooper@gmail.com"
						error={errors.claimantEmail?.message}
						{...register('claimantEmail')}
						onBlur={() => onFieldBlur?.('claimantEmail')}
					/>
					<TextField
						label={t('accidentInfo.iban')}
						placeholder="123/456/78901"
						error={errors.claimantVehicleMake?.message}
						{...register('claimantVehicleMake')}
						onBlur={() => onFieldBlur?.('claimantVehicleMake')}
					/>
					<TextField
						label={t('accidentInfo.firstNumber')}
						type="tel"
						placeholder="DE123456780"
						error={errors.claimantPhone?.message}
						{...register('claimantPhone')}
						onBlur={() => onFieldBlur?.('claimantPhone')}
					/>
				</div>

				<div className="flex flex-col gap-1">
					<Label>{t('accidentInfo.licensePlate')}</Label>
					<div className="flex items-center gap-4">
						<TextField
							placeholder="B AB 1234"
							error={errors.claimantLicensePlate?.message}
							{...register('claimantLicensePlate')}
							onBlur={() => onFieldBlur?.('claimantLicensePlate')}
							className="flex-1"
						/>
						{licensePlate && <LicensePlate plate={licensePlate} />}
					</div>
				</div>

				{/* Checkboxes — horizontal row per Figma */}
				<div className="flex flex-wrap items-center gap-6 pt-2">
					<div className="flex items-center gap-2">
						<Checkbox
							id="claimant-eligible-input-tax"
							checked={undefined}
							onCheckedChange={(checked) => {
								const event = {
									target: { name: 'claimantEligibleForInputTaxDeduction', value: !!checked },
								}
								register('claimantEligibleForInputTaxDeduction').onChange(event)
								onFieldBlur?.('claimantEligibleForInputTaxDeduction')
							}}
							{...register('claimantEligibleForInputTaxDeduction')}
						/>
						<Label htmlFor="claimant-eligible-input-tax" className="cursor-pointer font-normal">
							{t('accidentInfo.inputTaxDeduction')}
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
							{t('accidentInfo.isVehicleOwner')}
						</Label>
					</div>

					{!isOT && (
						<div className="flex items-center gap-2">
							<Checkbox
								id="claimant-represented-by-lawyer"
								onCheckedChange={(checked) => {
									const event = {
										target: { name: 'claimantRepresentedByLawyer', value: !!checked },
									}
									register('claimantRepresentedByLawyer').onChange(event)
									onFieldBlur?.('claimantRepresentedByLawyer')
								}}
								{...register('claimantRepresentedByLawyer')}
							/>
							<Label
								htmlFor="claimant-represented-by-lawyer"
								className="cursor-pointer font-normal"
							>
								{t('accidentInfo.representedByLawyer')}
							</Label>
						</div>
					)}
				</div>

				{/* Conditional fields based on checkboxes */}
				{(eligibleForTax || (!isOT && representedByLawyer)) && (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{eligibleForTax && (
							<TextField
								label={t('accidentInfo.vatId')}
								placeholder="DE344/490424"
								{...register('claimantVatId' as keyof import('./types').AccidentInfoFormData)}
								onBlur={() => onFieldBlur?.('claimantVatId')}
							/>
						)}
						{!isOT && representedByLawyer && (
							<TextField
								label={t('accidentInfo.involvedLawyer')}
								placeholder="John Doe Lawyer Firm"
								error={errors.claimantInvolvedLawyer?.message}
								{...register('claimantInvolvedLawyer')}
								onBlur={() => onFieldBlur?.('claimantInvolvedLawyer')}
							/>
						)}
					</div>
				)}
			</div>
		</CollapsibleSection>
	)
}

export { ClaimantSection }
