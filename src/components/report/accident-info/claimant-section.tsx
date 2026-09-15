'use client'

import { useTranslations } from 'next-intl'
import { Controller, useWatch } from 'react-hook-form'
import { useFieldProps, useSectionBadge } from '@/components/report/missing-info'
import { Checkbox } from '@/components/ui/checkbox'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { Label } from '@/components/ui/label'
import { LicensePlate } from '@/components/ui/license-plate'
import { SelectField } from '@/components/ui/select'
import { TextField } from '@/components/ui/text-field'
import { SECTION } from '@/lib/completeness'
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
	const fieldProps = useFieldProps({ register, errors, onFieldBlur })
	const badge = useSectionBadge(SECTION.claimant)
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
		<CollapsibleSection title={sectionTitle} info defaultOpen className={className} {...badge}>
			<div className="flex flex-col gap-4">
				<TextField
					label={t('accidentInfo.company')}
					placeholder={t('accidentInfo.companyPlaceholder')}
					{...fieldProps('claimantCompany')}
				/>

				{/* Salutation | First Name | Last Name — 3-column per Figma */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<Controller
						control={control}
						name="claimantSalutation"
						render={({ field }) => (
							<SelectField
								label={t('accidentInfo.salutation')}
								options={salutationOptions}
								placeholder={t('accidentInfo.salutationPlaceholder')}
								value={field.value}
								error={errors.claimantSalutation?.message}
								onValueChange={(value) => {
									field.onChange(value)
									onFieldBlur?.('claimantSalutation')
								}}
							/>
						)}
					/>
					<TextField
						label={t('accidentInfo.firstName')}
						placeholder={t('accidentInfo.firstName')}
						{...fieldProps('claimantFirstName')}
					/>
					<TextField
						label={t('accidentInfo.lastName')}
						placeholder={t('accidentInfo.lastName')}
						{...fieldProps('claimantLastName')}
					/>
				</div>

				{/* Street | Postcode | Location — 3-column per Figma */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label={t('accidentInfo.street')}
						placeholder={t('accidentInfo.streetPlaceholder')}
						{...fieldProps('claimantStreet')}
					/>
					<TextField
						label={t('accidentInfo.postcode')}
						placeholder={t('accidentInfo.postcodePlaceholder')}
						{...fieldProps('claimantPostcode')}
					/>
					<TextField
						label={t('accidentInfo.location')}
						placeholder="Berlin"
						{...fieldProps('claimantLocation')}
					/>
				</div>

				{/* Email | IBAN | Phone Number — 3-column per Figma */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label={t('accidentInfo.email')}
						type="email"
						placeholder="markecooper@gmail.com"
						{...fieldProps('claimantEmail')}
					/>
					<TextField
						label={t('accidentInfo.iban')}
						placeholder="DE89 3704 0044 0532 0130 00"
						{...fieldProps('claimantIban')}
					/>
					<TextField
						label={t('accidentInfo.phoneNumber')}
						type="tel"
						placeholder="+49 152 3818411"
						{...fieldProps('claimantPhone')}
					/>
				</div>

				<div className="flex flex-col gap-1">
					<Label>{t('accidentInfo.licensePlate')}</Label>
					<div className="flex items-center gap-4">
						<TextField
							placeholder="B AB 1234"
							{...fieldProps('claimantLicensePlate')}
							className="flex-1"
						/>
						{licensePlate && <LicensePlate plate={licensePlate} />}
					</div>
				</div>

				{/* Checkboxes — horizontal row per Figma */}
				<div className="flex flex-wrap items-center gap-6 pt-2">
					<div className="flex items-center gap-2">
						<Controller
							control={control}
							name="claimantEligibleForInputTaxDeduction"
							render={({ field }) => (
								<Checkbox
									id="claimant-eligible-input-tax"
									checked={!!field.value}
									onCheckedChange={(checked) => {
										field.onChange(!!checked)
										onFieldBlur?.('claimantEligibleForInputTaxDeduction')
									}}
								/>
							)}
						/>
						<Label htmlFor="claimant-eligible-input-tax" className="cursor-pointer font-normal">
							{t('accidentInfo.inputTaxDeduction')}
						</Label>
					</div>

					<div className="flex items-center gap-2">
						<Controller
							control={control}
							name="claimantIsVehicleOwner"
							render={({ field }) => (
								<Checkbox
									id="claimant-is-vehicle-owner"
									checked={!!field.value}
									onCheckedChange={(checked) => {
										field.onChange(!!checked)
										onFieldBlur?.('claimantIsVehicleOwner')
									}}
								/>
							)}
						/>
						<Label htmlFor="claimant-is-vehicle-owner" className="cursor-pointer font-normal">
							{t('accidentInfo.isVehicleOwner')}
						</Label>
					</div>

					{!isOT && (
						<div className="flex items-center gap-2">
							<Controller
								control={control}
								name="claimantRepresentedByLawyer"
								render={({ field }) => (
									<Checkbox
										id="claimant-represented-by-lawyer"
										checked={!!field.value}
										onCheckedChange={(checked) => {
											field.onChange(!!checked)
											onFieldBlur?.('claimantRepresentedByLawyer')
										}}
									/>
								)}
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
								placeholder="DE123456789"
								{...fieldProps('claimantVatId')}
							/>
						)}
						{!isOT && representedByLawyer && (
							<TextField
								label={t('accidentInfo.involvedLawyer')}
								placeholder={t('accidentInfo.involvedLawyerPlaceholder')}
								{...fieldProps('claimantInvolvedLawyer')}
							/>
						)}
					</div>
				)}
			</div>
		</CollapsibleSection>
	)
}

export { ClaimantSection }
