'use client'

import { useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
	calculateNetTotal,
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
	const grossTotal = calculateGrossTotal(netTotal, 19)

	return (
		<div
			className={cn(
				'rounded-xl bg-linear-to-r from-primary to-primary-hover p-6',
				className,
			)}
		>
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-1">
					<span className="text-body-sm font-medium text-white/80">
						Invoice Amount
					</span>
					<span className="text-3xl font-bold text-white">
						{formatEUR(grossTotal)}
					</span>
					<span className="text-body-sm text-white/70">
						Before tax {formatEUR(netTotal)}
					</span>
				</div>

				<Button
					type="button"
					variant="outline"
					size="md"
					className="border-white bg-white/10 text-white hover:bg-white/20 hover:text-white"
				>
					Preview Invoice
				</Button>
			</div>
		</div>
	)
}

export { InvoiceBanner }
