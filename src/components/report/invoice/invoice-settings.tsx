'use client'

import { Controller } from 'react-hook-form'
import { User, Users, FileText, Info } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { cn } from '@/lib/utils'
import type { InvoiceSectionProps } from './types'

function InvoiceSettings({
	register,
	control,
	errors,
	onFieldBlur,
	className,
}: InvoiceSectionProps) {
	return (
		<CollapsibleSection title="Settings" info defaultOpen className={className}>
			<div className="flex flex-col gap-6">
				{/* Recipient row with icon buttons */}
				<div className="flex items-center justify-between">
					<span className="text-body-sm font-medium text-black">Recipient</span>
					<div className="flex items-center gap-2">
						<button
							type="button"
							className={cn(
								'flex h-10 w-10 items-center justify-center rounded-lg border transition-colors',
								'border-primary bg-primary text-white',
							)}
							aria-label="Individual recipient"
						>
							<User className="h-4 w-4" />
						</button>
						<button
							type="button"
							className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-white text-grey-100 transition-colors hover:bg-grey-25"
							aria-label="Group recipient"
						>
							<Users className="h-4 w-4" />
						</button>
						<button
							type="button"
							className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-white text-grey-100 transition-colors hover:bg-grey-25"
							aria-label="Document recipient"
						>
							<FileText className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Invoice number, Date, Payout delay - 3 column row */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<TextField
						label="Invoice number"
						placeholder="HB-3552-2026"
						error={errors.invoiceNumber?.message}
						{...register('invoiceNumber')}
						onBlur={() => onFieldBlur?.('invoiceNumber')}
					/>

					<TextField
						label="Date"
						type="date"
						placeholder="DD/MM/YYYY"
						error={errors.date?.message}
						{...register('date')}
						onBlur={() => onFieldBlur?.('date')}
					/>

					<TextField
						label="Payout delay (optional)"
						type="number"
						placeholder="DD"
						error={errors.payoutDelay?.message}
						{...register('payoutDelay')}
						onBlur={() => onFieldBlur?.('payoutDelay')}
					/>
				</div>

				{/* E-Invoice toggle */}
				<Controller
					name="eInvoice"
					control={control}
					render={({ field }) => (
						<div className="flex items-center gap-2">
							<span className="text-body-sm text-black">E-Invoice</span>
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
