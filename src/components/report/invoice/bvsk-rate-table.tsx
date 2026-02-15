'use client'

import { useCallback } from 'react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
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

	return (
		<CollapsibleSection title="BVSK Fee Schedule" className={className}>
			<div className="flex flex-col gap-4">
				<p className="text-body-sm text-grey-100">
					Reference table for standard BVSK appraisal fees based on repair cost ranges.
				</p>

				{/* Scrollable table */}
				<div className="overflow-x-auto rounded-lg border border-border">
					<table className="w-full min-w-[500px]">
						<thead>
							<tr className="border-b border-border bg-grey-25">
								<th className="px-4 py-2 text-left text-caption font-medium text-grey-100">
									Repair Cost Range
								</th>
								<th className="px-4 py-2 text-right text-caption font-medium text-grey-100">
									Base Fee
								</th>
								<th className="px-4 py-2 text-right text-caption font-medium text-grey-100">
									Additional Fee
								</th>
							</tr>
						</thead>
						<tbody>
							{BVSK_RATES.map((rate, index) => {
								const isActive =
									repairCost !== undefined &&
									repairCost >= rate.minRepairCost &&
									repairCost <= rate.maxRepairCost

								return (
									<tr
										key={index}
										className={cn(
											'border-b border-border last:border-b-0',
											isActive && 'bg-primary/5',
										)}
									>
										<td className="px-4 py-2 text-body-sm text-black">
											{formatEUR(rate.minRepairCost)} &ndash;{' '}
											{formatEUR(rate.maxRepairCost)}
										</td>
										<td className="px-4 py-2 text-right text-body-sm font-medium text-black">
											{formatEUR(rate.baseFee)}
										</td>
										<td className="px-4 py-2 text-right text-body-sm text-grey-100">
											{formatEUR(rate.additionalFee)}
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>

				{onApplyRate && (
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={handleApply}
						disabled={!repairCost}
						className="self-start"
					>
						Apply BVSK Rate
					</Button>
				)}
			</div>
		</CollapsibleSection>
	)
}

export { BvskRateTable }
export type { BvskRateTableProps }
