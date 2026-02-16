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
	field: 'includeValuation' | 'includeCommission' | 'includeInvoice'
	label: string
}

const DOCUMENT_TOGGLES: readonly ToggleConfigItem[] = [
	{
		field: 'includeValuation',
		label: 'Vehicle valuation',
	},
	{
		field: 'includeCommission',
		label: 'Commission',
	},
	{
		field: 'includeInvoice',
		label: 'The Invoice',
	},
]

function DocumentToggleItem({
	control,
	field,
	label,
	onToggleChange,
}: {
	control: Control<ExportFormData>
	field: 'includeValuation' | 'includeCommission' | 'includeInvoice'
	label: string
	onToggleChange?: (field: keyof ExportFormData, value: boolean) => void
}) {
	const { field: controlledField } = useController({
		control,
		name: field,
	})

	return (
		<div className="flex items-center justify-between gap-3">
			<div className="flex items-center gap-2">
				<Eye className="h-4 w-4 text-grey-100" />
				<span className="text-body-sm text-black">{label}</span>
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
	)
}

function LockToggle({
	control,
	onToggleChange,
}: {
	control: Control<ExportFormData>
	onToggleChange?: (field: keyof ExportFormData, value: boolean) => void
}) {
	const { field: controlledField } = useController({
		control,
		name: 'lockReport',
	})

	return (
		<div className="flex items-center justify-between gap-3">
			<div className="flex items-center gap-2">
				<Lock className="h-4 w-4 text-grey-100" />
				<span className="text-body-sm font-medium text-black">Lock Report</span>
			</div>
			<ToggleSwitch
				label=""
				checked={controlledField.value as boolean}
				onCheckedChange={(checked) => {
					controlledField.onChange(checked)
					onToggleChange?.('lockReport', checked)
				}}
			/>
		</div>
	)
}

function ExportToggles({ control, onToggleChange, className }: ExportTogglesProps) {
	return (
		<div className={cn('flex flex-col gap-4', className)}>
			{/* Document toggles card */}
			<div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5">
				{DOCUMENT_TOGGLES.map((config) => (
					<DocumentToggleItem
						key={config.field}
						control={control}
						field={config.field}
						label={config.label}
						onToggleChange={onToggleChange}
					/>
				))}
			</div>

			{/* Lock Report card */}
			<div className="rounded-xl border border-border bg-white p-5">
				<LockToggle control={control} onToggleChange={onToggleChange} />
			</div>
		</div>
	)
}

export { ExportToggles }
export type { ExportTogglesProps }
