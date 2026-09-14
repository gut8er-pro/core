'use client'

import { useTranslations } from 'next-intl'
import { useFieldProps, useSectionBadge } from '@/components/report/missing-info'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { SECTION } from '@/lib/completeness'
import type { SectionProps } from './types'

function AccidentSection({
	register,
	errors,
	onFieldBlur,
	className,
}: SectionProps & { className?: string }) {
	const t = useTranslations('report')
	const fieldProps = useFieldProps({ register, errors, onFieldBlur })
	const badge = useSectionBadge(SECTION.accident)

	return (
		<CollapsibleSection
			title={t('accidentInfo.accidentInformation')}
			defaultOpen
			className={className}
			{...badge}
		>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<TextField
					label={t('accidentInfo.accidentDay')}
					type="date"
					{...fieldProps('accidentDay')}
				/>
				<TextField
					label={t('accidentInfo.accidentScene')}
					placeholder={t('accidentInfo.accidentScenePlaceholder')}
					{...fieldProps('accidentScene')}
				/>
			</div>
		</CollapsibleSection>
	)
}

export { AccidentSection }
