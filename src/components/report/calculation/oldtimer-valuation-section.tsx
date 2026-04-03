'use client'

import { Info } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { cn } from '@/lib/utils'
import type { CalculationSectionProps } from './types'

function OldtimerValuationSection({
	register,
	errors,
	onFieldBlur,
	className,
}: CalculationSectionProps & { className?: string }) {
	const [showRestoration, setShowRestoration] = useState(false)

	return (
		<div className={cn('flex flex-col gap-6', className)}>
			{/* Value section */}
			<CollapsibleSection title="Value" info defaultOpen>
				<div className="flex flex-col gap-6">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<TextField
							label="Market value (€)"
							placeholder="€"
							{...register('marketValue')}
							onBlur={() => onFieldBlur?.('marketValue')}
						/>
						<TextField
							label="Replacement value (€)"
							placeholder="€"
							{...register('replacementValue')}
							onBlur={() => onFieldBlur?.('replacementValue')}
						/>
					</div>

					{!showRestoration ? (
						<Button type="button" variant="primary" onClick={() => setShowRestoration(true)}>
							Restoration Value
						</Button>
					) : (
						<>
							<Button type="button" variant="outline" onClick={() => setShowRestoration(false)}>
								Remove Additional Value
							</Button>

							{/* Additional value subsection */}
							<div className="flex flex-col gap-4">
								<div className="flex items-center gap-2">
									<h4 className="text-body font-medium text-black">Additional value</h4>
									<Info className="h-4 w-4 text-grey-100" />
								</div>
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<TextField
										label="Base vehicle value (€)"
										placeholder="€"
										{...register('baseVehicleValue')}
										onBlur={() => onFieldBlur?.('baseVehicleValue')}
									/>
									<TextField
										label="Restoration value (€)"
										placeholder="€"
										{...register('restorationValue')}
										onBlur={() => onFieldBlur?.('restorationValue')}
									/>
								</div>
							</div>
						</>
					)}
				</div>
			</CollapsibleSection>

			{/* Total Cost card */}
			<div className="flex items-center justify-between rounded-btn bg-gradient-to-r from-dark-green to-black px-6 py-4">
				<span className="text-body font-medium text-white">Total Cost</span>
				<span className="text-h2 font-medium text-white">—</span>
			</div>
		</div>
	)
}

export { OldtimerValuationSection }
