'use client'

import { useTranslations } from 'next-intl'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import type { SectionProps } from './types'

function AccidentSection({
	register,
	errors,
	onFieldBlur,
	className,
}: SectionProps & { className?: string }) {
	const t = useTranslations('report')
	return (
		<CollapsibleSection
			title={t('accidentInfo.accidentInformation')}
			defaultOpen
			className={className}
		>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<TextField
					label={t('accidentInfo.accidentDay')}
					type="date"
					error={errors.accidentDay?.message}
					{...register('accidentDay')}
					onBlur={() => onFieldBlur?.('accidentDay')}
				/>
				<TextField
					label={t('accidentInfo.accidentScene')}
					placeholder={t('accidentInfo.accidentScenePlaceholder')}
					error={errors.accidentScene?.message}
					{...register('accidentScene')}
					onBlur={() => onFieldBlur?.('accidentScene')}
				/>
			</div>
		</CollapsibleSection>
	)
}

export { AccidentSection }
