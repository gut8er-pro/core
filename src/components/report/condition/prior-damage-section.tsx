'use client'

import { useState } from 'react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { cn } from '@/lib/utils'
import type { ConditionSectionProps } from './types'

type PriorDamageTab = 'damage-notes' | 'inspection' | 'prior-damage'

function PriorDamageSection({
	register,
	errors,
	onFieldBlur,
	className,
}: Omit<ConditionSectionProps, 'control'> & { className?: string }) {
	const [activeTab, setActiveTab] = useState<PriorDamageTab>('damage-notes')

	return (
		<CollapsibleSection title="Prior Damage" defaultOpen={false} className={className}>
			<div className="flex flex-col gap-6">
				{/* Sub-tabs */}
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={() => setActiveTab('damage-notes')}
						className={cn(
							'inline-flex cursor-pointer items-center rounded-full px-4 py-2 text-body-sm font-medium transition-colors',
							activeTab === 'damage-notes'
								? 'bg-black text-white'
								: 'bg-transparent text-grey-100 hover:bg-grey-25',
						)}
					>
						Damage Notes
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('inspection')}
						className={cn(
							'inline-flex cursor-pointer items-center rounded-full px-4 py-2 text-body-sm font-medium transition-colors',
							activeTab === 'inspection'
								? 'bg-black text-white'
								: 'bg-transparent text-grey-100 hover:bg-grey-25',
						)}
					>
						Inspection
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('prior-damage')}
						className={cn(
							'inline-flex cursor-pointer items-center rounded-full px-4 py-2 text-body-sm font-medium transition-colors',
							activeTab === 'prior-damage'
								? 'bg-black text-white'
								: 'bg-transparent text-grey-100 hover:bg-grey-25',
						)}
					>
						Prior Damage Notes
					</button>
				</div>

				{/* Tab content */}
				{activeTab === 'damage-notes' && (
					<div className="flex flex-col gap-4">
						<p className="text-caption text-grey-100">
							Document any previously reported damage found during the assessment.
						</p>
						<TextField
							label="Previously Reported Damage"
							placeholder="Describe previously reported damage in detail..."
							error={errors.previousDamageReported?.message}
							{...register('previousDamageReported')}
							onBlur={() => onFieldBlur?.('previousDamageReported')}
						/>
					</div>
				)}

				{activeTab === 'inspection' && (
					<div className="flex flex-col gap-4">
						<p className="text-caption text-grey-100">
							Document any existing damage found during inspection that was not previously reported.
						</p>
						<TextField
							label="Existing Damage (Not Reported)"
							placeholder="Describe unreported existing damage in detail..."
							error={errors.existingDamageNotReported?.message}
							{...register('existingDamageNotReported')}
							onBlur={() => onFieldBlur?.('existingDamageNotReported')}
						/>
					</div>
				)}

				{activeTab === 'prior-damage' && (
					<div className="flex flex-col gap-4">
						<p className="text-caption text-grey-100">
							Document any subsequent damage that occurred after the reported incident.
						</p>
						<TextField
							label="Subsequent Damage"
							placeholder="Describe any subsequent damage in detail..."
							error={errors.subsequentDamage?.message}
							{...register('subsequentDamage')}
							onBlur={() => onFieldBlur?.('subsequentDamage')}
						/>
					</div>
				)}
			</div>
		</CollapsibleSection>
	)
}

export { PriorDamageSection }
