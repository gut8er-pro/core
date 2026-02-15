'use client'

import { useWatch } from 'react-hook-form'
import { cn } from '@/lib/utils'
import {
	calculateNetTotal,
	calculateTax,
	calculateGrossTotal,
} from '@/lib/utils/invoice-calculations'
import type { InvoiceSectionProps } from './types'

function formatEUR(value: number): string {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
	}).format(value)
}

function InvoiceBanner({
	control,
	className,
}: Pick<InvoiceSectionProps, 'control' | 'className'>) {
	const lineItems = useWatch({ control, name: 'lineItems' })

	const parsedItems = (lineItems ?? []).map((item) => ({
		amount: parseFloat(item.amount) || 0,
	}))

	const netTotal = calculateNetTotal(parsedItems)
	const tax = calculateTax(netTotal, 19)
	const grossTotal = calculateGrossTotal(netTotal, 19)

	return (
		<div
			className={cn(
				'rounded-xl bg-linear-to-r from-primary to-primary-hover p-6',
				className,
			)}
		>
			<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div className="flex flex-col gap-1">
					<span className="text-body-sm font-medium text-white/80">
						Net Total
					</span>
					<span className="text-h3 font-bold text-white">
						{formatEUR(netTotal)}
					</span>
				</div>

				<div className="flex flex-col gap-1">
					<span className="text-body-sm font-medium text-white/80">
						Tax (19%)
					</span>
					<span className="text-h3 font-bold text-white">
						{formatEUR(tax)}
					</span>
				</div>

				<div className="flex flex-col gap-1">
					<span className="text-body-sm font-medium text-white/80">
						Gross Total
					</span>
					<span className="text-h2 font-bold text-white">
						{formatEUR(grossTotal)}
					</span>
				</div>
			</div>
		</div>
	)
}

export { InvoiceBanner }
