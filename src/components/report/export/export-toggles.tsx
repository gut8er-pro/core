'use client'

import { Eye, Globe, Lock } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
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
	labelKey: 'vehicleValuation' | 'commission' | 'theInvoice'
}

const DOCUMENT_TOGGLES: readonly ToggleConfigItem[] = [
	{
		field: 'includeValuation',
		labelKey: 'vehicleValuation',
	},
	{
		field: 'includeCommission',
		labelKey: 'commission',
	},
	{
		field: 'includeInvoice',
		labelKey: 'theInvoice',
	},
]

function DocumentToggleItem({
	control,
	field,
	labelKey,
	onToggleChange,
}: {
	control: Control<ExportFormData>
	field: 'includeValuation' | 'includeCommission' | 'includeInvoice'
	labelKey: string
	onToggleChange?: (field: keyof ExportFormData, value: boolean) => void
}) {
	const t = useTranslations('report.export')
	const { field: controlledField } = useController({
		control,
		name: field,
	})

	return (
		<div className="flex items-center justify-between gap-3">
			<div className="flex items-center gap-2">
				<Eye className="h-4 w-4 text-grey-100" />
				<span className="text-body-sm text-black">{t(labelKey as 'vehicleValuation')}</span>
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
	const t = useTranslations('report.export')
	const { field: controlledField } = useController({
		control,
		name: 'lockReport',
	})

	return (
		<div className="flex items-center justify-between gap-3">
			<div className="flex items-center gap-2">
				<Lock className="h-4 w-4 text-grey-100" />
				<span className="text-body-sm font-medium text-black">{t('lockReport')}</span>
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

function PdfLanguageSelector({ control }: { control: Control<ExportFormData> }) {
	const t = useTranslations('report.export')
	const tLang = useTranslations('language')
	const locale = useLocale()
	const { field } = useController({ control, name: 'pdfLanguages' })
	const selected: string[] = (field.value as string[]) ?? [locale]

	function toggle(lang: 'en' | 'de') {
		const current = [...selected]
		if (current.includes(lang)) {
			if (current.length > 1) {
				field.onChange(current.filter((l) => l !== lang))
			}
		} else {
			field.onChange([...current, lang])
		}
	}

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-2">
				<Globe className="h-4 w-4 text-grey-100" />
				<span className="text-body-sm font-medium text-black">{t('pdfLanguage')}</span>
			</div>
			<div className="flex gap-2">
				{(['de', 'en'] as const).map((lang) => {
					const label = lang === 'de' ? tLang('deutsch') : tLang('english')
					return (
						<button
							key={lang}
							type="button"
							onClick={() => toggle(lang)}
							className={cn(
								'flex h-9 items-center gap-1.5 rounded-lg border px-3 text-body-sm font-medium transition-colors',
								selected.includes(lang)
									? 'border-primary bg-primary/5 text-primary'
									: 'border-border text-grey-100 hover:border-grey-100',
							)}
						>
							{label}
							{selected.includes(lang) && (
								<span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
									✓
								</span>
							)}
						</button>
					)
				})}
			</div>
			{selected.length === 2 && (
				<p className="text-caption text-grey-100">{t('bothLanguagesNote')}</p>
			)}
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
						labelKey={config.labelKey}
						onToggleChange={onToggleChange}
					/>
				))}
			</div>

			{/* PDF Language selector card */}
			<div className="rounded-xl border border-border bg-white p-5">
				<PdfLanguageSelector control={control} />
			</div>

			{/* Lock Report card */}
			<div className="rounded-xl border border-border bg-white p-5">
				<LockToggle control={control} onToggleChange={onToggleChange} />
			</div>
		</div>
	)
}

export type { ExportTogglesProps }
export { ExportToggles }
