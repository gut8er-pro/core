'use client'

import { FileText, Info, User, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { useFieldProps, useSectionBadge } from '@/components/report/missing-info'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { SECTION } from '@/lib/completeness'
import { cn } from '@/lib/utils'
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
	const badge = useSectionBadge(SECTION.invoiceSettings)

	return (
		<CollapsibleSection title={t('settings')} info defaultOpen className={className} {...badge}>
			<div className="flex flex-col gap-6">
				{/* Recipient row with icon buttons */}
				<div className="flex items-center justify-between">
					<span className="text-body-sm font-medium text-black">{t('recipient')}</span>
					<div className="flex items-center gap-2">
						<button
							type="button"
							className={cn(
								'flex h-10 w-10 items-center justify-center rounded-lg border transition-colors',
								'border-primary bg-primary text-white',
							)}
							aria-label={t('recipientTypes.individual')}
						>
							<User className="h-4 w-4" />
						</button>
						<button
							type="button"
							className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-white text-grey-100 transition-colors hover:bg-grey-25"
							aria-label={t('recipientTypes.group')}
						>
							<Users className="h-4 w-4" />
						</button>
						<button
							type="button"
							className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-white text-grey-100 transition-colors hover:bg-grey-25"
							aria-label={t('recipientTypes.document')}
						>
							<FileText className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Invoice number, Date, Payout delay - 3 column row */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label={t('invoiceNumber')}
						placeholder="HB-3552-2026"
						{...fieldProps('invoiceNumber')}
					/>

					<TextField
						label={t('date')}
						type="date"
						placeholder={t('datePlaceholder')}
						{...fieldProps('date')}
					/>

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
