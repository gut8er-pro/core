'use client'

import { ChevronDown, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BVSK_RATES, lookupBvskRate } from '@/lib/utils/invoice-calculations'

type BvskRateTableProps = {
	repairCost?: number
	onApplyRate?: (baseFee: number, additionalFee: number) => void
	className?: string
}

const numberFormat = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 })

const currencyFormat = new Intl.NumberFormat('de-DE', {
	style: 'currency',
	currency: 'EUR',
	maximumFractionDigits: 0,
})

function BvskRateTable({ repairCost, onApplyRate, className }: BvskRateTableProps) {
	const t = useTranslations('report.invoice')
	const handleApply = useCallback(() => {
		if (!repairCost || !onApplyRate) return
		const rate = lookupBvskRate(repairCost)
		onApplyRate(rate.baseFee, rate.additionalFee)
	}, [repairCost, onApplyRate])

	const displayRates = BVSK_RATES.slice(0, 8)

	return (
		<div className={cn('flex flex-col gap-3', className)}>
			<div className="relative">
				<section
					aria-label={t('bvskRateTable')}
					className="overflow-x-auto rounded-lg bg-surface-secondary [scrollbar-width:thin]"
				>
					<div className="flex min-w-max items-center gap-1 p-2">
						<div className="flex h-10 shrink-0 items-center gap-2 rounded-md border border-border bg-white px-3">
							{repairCost === undefined && (
								<span
									title={t('bvskRateWarning')}
									aria-label={t('bvskRateWarning')}
									role="img"
									className="flex items-center"
								>
									<TriangleAlert className="h-4 w-4 text-error" />
								</span>
							)}
							<span className="text-body-sm font-semibold text-black whitespace-nowrap">BVSK</span>
							<ChevronDown className="h-4 w-4 text-grey-100" />
						</div>

						<span className="shrink-0 px-3 text-micro text-grey-100 whitespace-nowrap">
							{t('amountOfDamage')}
						</span>

						{displayRates.map((rate) => {
							const isActive =
								repairCost !== undefined &&
								repairCost >= rate.minRepairCost &&
								repairCost <= rate.maxRepairCost

							return (
								<div
									key={rate.minRepairCost}
									className={cn(
										'flex shrink-0 flex-col gap-0.5 rounded-md px-3 py-1',
										isActive && 'bg-primary/5',
									)}
								>
									<span className="text-micro text-grey-100 whitespace-nowrap">
										{numberFormat.format(rate.minRepairCost)}–
										{currencyFormat.format(rate.maxRepairCost)}
									</span>
									<span className="flex gap-2 text-caption whitespace-nowrap">
										<span className="font-medium text-black">
											{currencyFormat.format(rate.baseFee)}
										</span>
										<span className="text-grey-100">
											{currencyFormat.format(rate.additionalFee)}
										</span>
									</span>
								</div>
							)
						})}
					</div>
				</section>
				<div className="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-lg bg-linear-to-l from-surface-secondary to-transparent" />
			</div>

			{onApplyRate && repairCost && (
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={handleApply}
					className="self-start"
				>
					{t('applyBvskRate')}
				</Button>
			)}
		</div>
	)
}

export type { BvskRateTableProps }
export { BvskRateTable }
