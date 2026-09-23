'use client'

import { Info, User, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { useFieldProps, useMissingProps, useSectionBadge } from '@/components/report/missing-info'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { DateField } from '@/components/ui/date-field'
import { IconSelector } from '@/components/ui/icon-selector'
import { TextField } from '@/components/ui/text-field'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { SECTION } from '@/lib/completeness'
import type { InvoiceSectionProps } from './types'

function InvoiceSettings({
	register,
	control,
	errors,
	onFieldBlur,
	className,
}: InvoiceSectionProps) {
	const t = useTranslations('report.invoice')
	const fieldProps = useFieldProps({ register, errors, onFieldBlur })
	const missing = useMissingProps()
	const badge = useSectionBadge(SECTION.invoiceSettings)

	const RECIPIENT_OPTIONS = [
		{ value: 'claimant', icon: User, label: t('recipientTypes.claimant') },
		{ value: 'claimant_lawyer', icon: Users, label: t('recipientTypes.claimantLawyer') },
	]

	return (
		<CollapsibleSection title={t('settings')} info defaultOpen className={className} {...badge}>
			<div className="flex flex-col gap-6">
				{/* Who the invoice is addressed to — nothing chosen until the
				    assessor chooses, so the report never asserts a recipient. */}
				<div className="flex items-center justify-between">
					<span className="text-body-sm font-medium text-black">{t('recipient')}</span>
					<Controller
						name="recipientId"
						control={control}
						render={({ field }) => (
							<IconSelector
								options={RECIPIENT_OPTIONS}
								selected={field.value}
								onChange={(value) => {
									field.onChange(value)
									onFieldBlur?.('recipientId')
								}}
								hideLabels
								{...missing('recipientId')}
							/>
						)}
					/>
				</div>

				{/* Invoice number, Date, Payout delay - 3 column row */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label={t('invoiceNumber')}
						placeholder="HB-3552-2026"
						{...fieldProps('invoiceNumber')}
					/>

					<DateField label={t('date')} {...fieldProps('date')} />

					<TextField
						label={t('payoutDelay')}
						type="number"
						placeholder="DD"
						{...fieldProps('payoutDelay')}
					/>
				</div>

				{/* E-Invoice toggle */}
				<Controller
					name="eInvoice"
					control={control}
					render={({ field }) => (
						<div className="flex items-center gap-2">
							<span className="text-body-sm text-black">{t('eInvoice')}</span>
							<Info className="h-4 w-4 text-grey-100" />
							<ToggleSwitch
								label=""
								checked={field.value}
								onCheckedChange={(checked) => {
									field.onChange(checked)
									onFieldBlur?.('eInvoice')
								}}
							/>
						</div>
					)}
				/>
			</div>
		</CollapsibleSection>
	)
}

export { InvoiceSettings }
