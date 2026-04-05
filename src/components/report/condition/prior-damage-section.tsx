'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { cn } from '@/lib/utils'
import type { ConditionSectionProps } from './types'

type PriorDamageTab = 'damage-notes' | 'damage-description'

function PriorDamageSection({
	register,
	errors,
	onFieldBlur,
	className,
}: Omit<ConditionSectionProps, 'control'> & { className?: string }) {
	const [activeTab, setActiveTab] = useState<PriorDamageTab>('damage-notes')
	const t = useTranslations('report.condition')

	return (
		<CollapsibleSection
			title={t('priorDamage.title')}
			info
			defaultOpen={false}
			className={className}
		>
			<div className="flex flex-col gap-6">
				{/* Segmented tab control */}
				<div className="flex rounded-full border border-border bg-white p-1">
					<button
						type="button"
						onClick={() => setActiveTab('damage-notes')}
						className={cn(
							'flex-1 cursor-pointer rounded-full py-2.5 text-center text-body-sm font-medium transition-colors',
							activeTab === 'damage-notes'
								? 'bg-primary text-white'
								: 'bg-transparent text-grey-100 hover:bg-grey-25',
						)}
					>
						{t('priorDamage.damageNotes')}
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('damage-description')}
						className={cn(
							'flex-1 cursor-pointer rounded-full py-2.5 text-center text-body-sm font-medium transition-colors',
							activeTab === 'damage-description'
								? 'bg-primary text-white'
								: 'bg-transparent text-grey-100 hover:bg-grey-25',
						)}
					>
						{t('priorDamage.damageDescription')}
					</button>
				</div>

				{/* Tab content */}
				{activeTab === 'damage-notes' && (
					<div className="flex flex-col gap-4">
						{/* Previous damage (repaired) / Existing damage (not repaired) */}
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<TextField
								label={t('priorDamage.previousDamage')}
								placeholder={t('priorDamage.addRepairedDamage')}
								error={errors.previousDamageReported?.message}
								{...register('previousDamageReported')}
								onBlur={() => onFieldBlur?.('previousDamageReported')}
							/>
							<TextField
								label={t('priorDamage.existingDamage')}
								placeholder={t('priorDamage.currentCarAge')}
								error={errors.existingDamageNotReported?.message}
								{...register('existingDamageNotReported')}
								onBlur={() => onFieldBlur?.('existingDamageNotReported')}
							/>
						</div>

						{/* Subsequent damage */}
						<TextField
							label={t('priorDamage.subsequentDamage')}
							placeholder={t('priorDamage.subsequentDamagePlaceholder')}
							error={errors.subsequentDamage?.message}
							{...register('subsequentDamage')}
							onBlur={() => onFieldBlur?.('subsequentDamage')}
						/>
					</div>
				)}

				{activeTab === 'damage-description' && (
					<div className="flex flex-col gap-4">
						<textarea
							className="min-h-30 w-full rounded-md border border-border bg-white px-4 py-3 text-body-sm text-black placeholder:text-placeholder focus:border-border-focus focus:outline-none"
							placeholder={t('priorDamage.describeDamage')}
						/>
					</div>
				)}
			</div>
		</CollapsibleSection>
	)
}

export { PriorDamageSection }
