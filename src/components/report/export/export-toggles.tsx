'use client'

import { Eye, Lock } from 'lucide-react'
import type { Control } from 'react-hook-form'
import { useController } from 'react-hook-form'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { cn } from '@/lib/utils'
import type { ExportFormData } from './types'

type ExportTogglesProps = {
	control: Control<ExportFormData>
	onToggleChange?: (field: keyof ExportFormData, value: boolean) => void
	className?: string
}

type ToggleConfigItem = {
	field: 'includeValuation' | 'includeCommission' | 'includeInvoice' | 'lockReport'
	label: string
	description: string
	icon: typeof Eye | typeof Lock
	warning?: boolean
}

const TOGGLE_CONFIG: readonly ToggleConfigItem[] = [
	{
		field: 'includeValuation',
		label: 'Include Vehicle Valuation',
		description: 'Attach vehicle valuation details to the exported report',
		icon: Eye,
	},
	{
		field: 'includeCommission',
		label: 'Include Commission',
		description: 'Include commission breakdown in the report',
		icon: Eye,
	},
	{
		field: 'includeInvoice',
		label: 'Include Invoice',
		description: 'Attach the generated invoice to the report',
		icon: Eye,
	},
	{
		field: 'lockReport',
		label: 'Lock Report',
		description: 'Locking prevents further edits',
		icon: Lock,
		warning: true,
	},
]

function ToggleItem({
	control,
	field,
	label,
	description,
	icon: Icon,
	warning,
	onToggleChange,
}: {
	control: Control<ExportFormData>
	field: 'includeValuation' | 'includeCommission' | 'includeInvoice' | 'lockReport'
	label: string
	description: string
	icon: typeof Eye | typeof Lock
	warning?: boolean
	onToggleChange?: (field: keyof ExportFormData, value: boolean) => void
}) {
	const { field: controlledField } = useController({
		control,
		name: field,
	})

	return (
		<div className="flex flex-col gap-1">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<Icon className="h-4 w-4 text-grey-100" />
					<span className="text-body-sm font-medium text-black">
						{label}
					</span>
				</div>
				<ToggleSwitch
					label=""
					checked={controlledField.value as boolean}
					onCheckedChange={(checked) => {
						controlledField.onChange(checked)
						onToggleChange?.(field, checked)
					}}
				/>
			</div>
			<p
				className={cn(
					'text-caption pl-8',
					warning ? 'text-warning' : 'text-grey-100',
				)}
			>
				{description}
			</p>
		</div>
	)
}

function ExportToggles({ control, onToggleChange, className }: ExportTogglesProps) {
	return (
		<div className={cn('flex flex-col gap-6', className)}>
			<h3 className="text-body font-semibold text-black">Export Options</h3>
			<div className="flex flex-col gap-4">
				{TOGGLE_CONFIG.map((config) => (
					<ToggleItem
						key={config.field}
						control={control}
						field={config.field}
						label={config.label}
						description={config.description}
						icon={config.icon}
						warning={config.warning}
						onToggleChange={onToggleChange}
					/>
				))}
			</div>
		</div>
	)
}

export { ExportToggles }
export type { ExportTogglesProps }
