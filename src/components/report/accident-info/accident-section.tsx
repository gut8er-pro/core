'use client'

import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { cn } from '@/lib/utils'
import type { SectionProps } from './types'

function AccidentSection({ register, errors, onFieldBlur, className }: SectionProps & { className?: string }) {
	return (
		<CollapsibleSection title="Accident Information" defaultOpen className={className}>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<TextField
					label="Accident Day"
					type="date"
					error={errors.accidentDay?.message}
					{...register('accidentDay')}
					onBlur={() => onFieldBlur?.('accidentDay')}
				/>
				<TextField
					label="Accident Scene"
					placeholder="Enter accident location"
					error={errors.accidentScene?.message}
					{...register('accidentScene')}
					onBlur={() => onFieldBlur?.('accidentScene')}
				/>
			</div>
		</CollapsibleSection>
	)
}

export { AccidentSection }
