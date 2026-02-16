'use client'

import { useCallback } from 'react'
import { ChevronDown, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BVSK_RATES, lookupBvskRate } from '@/lib/utils/invoice-calculations'
import { cn } from '@/lib/utils'

type BvskRateTableProps = {
	repairCost?: number
	onApplyRate?: (baseFee: number, additionalFee: number) => void
	className?: string
}

function formatEUR(value: number): string {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
	}).format(value)
}

function BvskRateTable({
	repairCost,
	onApplyRate,
	className,
}: BvskRateTableProps) {
	const handleApply = useCallback(() => {
		if (!repairCost || !onApplyRate) return
		const rate = lookupBvskRate(repairCost)
		onApplyRate(rate.baseFee, rate.additionalFee)
	}, [repairCost, onApplyRate])

	// Show a compact horizontal scrolling table matching Figma
	const displayRates = BVSK_RATES.slice(0, 8)

	return (
		<div className={cn('flex flex-col gap-3', className)}>
			{/* BVSK selector button and rate display */}
			<div className="overflow-x-auto rounded-lg border border-border">
				<div className="flex items-stretch min-w-150">
					{/* BVSK dropdown trigger */}
					<div className="flex items-center gap-2 border-r border-border bg-white px-4 py-3">
						<TriangleAlert className="h-4 w-4 text-error" />
						<span className="text-body-sm font-semibold text-black whitespace-nowrap">BVSK</span>
						<ChevronDown className="h-4 w-4 text-grey-100" />
					</div>

					{/* Rate columns */}
					<div className="flex flex-1">
						{displayRates.map((rate, index) => {
							const isActive =
								repairCost !== undefined &&
								repairCost >= rate.minRepairCost &&
								repairCost <= rate.maxRepairCost

							return (
								<div
									key={index}
									className={cn(
										'flex flex-col items-center justify-center border-r border-border px-3 py-2 last:border-r-0',
										isActive && 'bg-primary/5',
									)}
								>
									<span className="text-[10px] text-grey-100 whitespace-nowrap">
										Amount of damage
									</span>
									<span className="text-caption font-medium text-black whitespace-nowrap">
										{formatEUR(rate.minRepairCost)}
									</span>
									<span className="text-caption text-grey-100 whitespace-nowrap">
										{formatEUR(rate.maxRepairCost)}
									</span>
									<div className="mt-1 flex gap-2">
										<span className="text-caption font-medium text-black">
											{formatEUR(rate.baseFee)}
										</span>
										<span className="text-caption text-grey-100">
											{formatEUR(rate.additionalFee)}
										</span>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			</div>

			{onApplyRate && repairCost && (
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={handleApply}
					className="self-start"
				>
					Apply BVSK Rate
				</Button>
			)}
		</div>
	)
}

export { BvskRateTable }
export type { BvskRateTableProps }
