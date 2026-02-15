'use client'

import { Controller } from 'react-hook-form'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import type { InvoiceSectionProps } from './types'

function InvoiceSettings({
	register,
	control,
	errors,
	onFieldBlur,
	className,
}: InvoiceSectionProps) {
	return (
		<CollapsibleSection title="Invoice Settings" defaultOpen className={className}>
			<div className="flex flex-col gap-6">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<TextField
						label="Invoice Number"
						placeholder="HB-0001-2024"
						hint="Auto-generated if left empty"
						error={errors.invoiceNumber?.message}
						{...register('invoiceNumber')}
						onBlur={() => onFieldBlur?.('invoiceNumber')}
					/>

					<TextField
						label="Invoice Date"
						type="date"
						error={errors.date?.message}
						{...register('date')}
						onBlur={() => onFieldBlur?.('date')}
					/>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<TextField
						label="Recipient ID"
						placeholder="Enter recipient identifier"
						error={errors.recipientId?.message}
						{...register('recipientId')}
						onBlur={() => onFieldBlur?.('recipientId')}
					/>

					<TextField
						label="Payout Delay"
						type="number"
						placeholder="30"
						hint="Days until payment due"
						error={errors.payoutDelay?.message}
						{...register('payoutDelay')}
						onBlur={() => onFieldBlur?.('payoutDelay')}
					/>
				</div>

				<Controller
					name="eInvoice"
					control={control}
					render={({ field }) => (
						<ToggleSwitch
							label="E-Invoice (ZUGFeRD)"
							checked={field.value}
							onCheckedChange={(checked) => {
								field.onChange(checked)
								onFieldBlur?.('eInvoice')
							}}
						/>
					)}
				/>
			</div>
		</CollapsibleSection>
	)
}

export { InvoiceSettings }
