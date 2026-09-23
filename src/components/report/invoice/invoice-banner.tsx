'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { lineItemAmount } from '@/lib/invoice/default-line-items'
import { cn } from '@/lib/utils'
import { calculateGrossTotal, calculateNetTotal } from '@/lib/utils/invoice-calculations'
import type { InvoiceSectionProps } from './types'

function formatEUR(value: number): string {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
	}).format(value)
}

type InvoiceBannerProps = Pick<InvoiceSectionProps, 'control' | 'className'> & {
	reportId: string
}

function InvoiceBanner({ control, className, reportId }: InvoiceBannerProps) {
	const t = useTranslations('report.invoice')
	const locale = useLocale()
	const lineItems = useWatch({ control, name: 'lineItems' })

	const netTotal = calculateNetTotal(
		(lineItems ?? []).map((item) => ({ amount: lineItemAmount(item) })),
	)
	const grossTotal = calculateGrossTotal(netTotal, 19)

	return (
		<div className={cn('rounded-xl bg-linear-to-r from-primary to-primary-hover p-6', className)}>
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-1">
					<span className="text-body-sm font-medium text-white/80">{t('invoiceAmount')}</span>
					<span className="text-3xl font-bold text-white">{formatEUR(grossTotal)}</span>
					<span className="text-body-sm text-white/70">
						{t('beforeTax', { amount: formatEUR(netTotal) })}
					</span>
				</div>

				<Button
					asChild
					variant="outline"
					size="md"
					className="border-white bg-white/10 text-white hover:bg-white/20 hover:text-white"
				>
					<a
						href={`/api/reports/${reportId}/export?format=pdf&sections=invoice&lang=${locale}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						{t('previewInvoice')}
					</a>
				</Button>
			</div>
		</div>
	)
}

export { InvoiceBanner }
