'use client'

import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { SelectField } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { SectionProps } from './types'

const ORDER_PLACEMENT_OPTIONS = [
	{ value: 'direct', label: 'Direct' },
	{ value: 'via_lawyer', label: 'Via Lawyer' },
	{ value: 'via_insurance', label: 'Via Insurance' },
]

function ExpertOpinionSection({ register, control, errors, onFieldBlur, className }: SectionProps & { className?: string }) {
	return (
		<CollapsibleSection title="Expert Opinion" className={className}>
			<div className="flex flex-col gap-4">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<TextField
						label="Expert Name"
						placeholder="Name of expert"
						error={errors.expertName?.message}
						{...register('expertName')}
						onBlur={() => onFieldBlur?.('expertName')}
					/>
					<TextField
						label="File Number"
						placeholder="File/case number"
						error={errors.fileNumber?.message}
						{...register('fileNumber')}
						onBlur={() => onFieldBlur?.('fileNumber')}
					/>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<TextField
						label="Case Date"
						type="date"
						error={errors.caseDate?.message}
						{...register('caseDate')}
						onBlur={() => onFieldBlur?.('caseDate')}
					/>
					<SelectField
						label="Order Was Placement"
						options={ORDER_PLACEMENT_OPTIONS}
						placeholder="Select placement type"
						error={errors.orderWasPlacement?.message}
						onValueChange={(value) => {
							const event = { target: { name: 'orderWasPlacement', value } }
							register('orderWasPlacement').onChange(event)
							onFieldBlur?.('orderWasPlacement')
						}}
					/>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<TextField
						label="Issued Date"
						type="date"
						error={errors.issuedDate?.message}
						{...register('issuedDate')}
						onBlur={() => onFieldBlur?.('issuedDate')}
					/>
					<TextField
						label="Mediator"
						placeholder="Mediator name"
						error={errors.mediator?.message}
						{...register('mediator')}
						onBlur={() => onFieldBlur?.('mediator')}
					/>
				</div>

				<div className="flex items-center gap-2 pt-2">
					<Checkbox
						id="order-by-claimant"
						onCheckedChange={(checked) => {
							const event = { target: { name: 'orderByClaimant', value: !!checked } }
							register('orderByClaimant').onChange(event)
							onFieldBlur?.('orderByClaimant')
						}}
						{...register('orderByClaimant')}
					/>
					<Label htmlFor="order-by-claimant" className="cursor-pointer font-normal">
						Order by claimant
					</Label>
				</div>
			</div>
		</CollapsibleSection>
	)
}

export { ExpertOpinionSection }
