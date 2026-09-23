'use client'

import { User, Users, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { RichTextEditor } from '@/components/ui/rich-text-editor.dynamic'
import { TextField } from '@/components/ui/text-field'
import { cn } from '@/lib/utils'
import type { ExportFormData, RecipientMode } from './types'

type RecipientPresets = {
	claimant: string | null
	lawyer: string | null
}

type EmailComposerProps = {
	register: UseFormRegister<ExportFormData>
	errors: FieldErrors<ExportFormData>
	body: string
	recipients: string[]
	recipientMode: RecipientMode | null
	presets: RecipientPresets
	presetsLoading?: boolean
	onRecipientsChange: (recipients: string[]) => void
	onRecipientModeChange: (mode: RecipientMode | null) => void
	onPresetEmpty?: (mode: RecipientMode) => void
	onPresetPartial?: (mode: RecipientMode) => void
	onBodyChange: (html: string) => void
	onSubjectBlur: () => void
	disabled?: boolean
	className?: string
}

const MODE_BUTTONS: {
	mode: RecipientMode
	labelKey: 'claimantRecipient' | 'claimantLawyerRecipient'
}[] = [
	{ mode: 'claimant', labelKey: 'claimantRecipient' },
	{ mode: 'claimant_lawyer', labelKey: 'claimantLawyerRecipient' },
]

/**
 * The chips ARE the recipient list. They render from the form value the send
 * payload is built from, so an empty field cannot hide a stale address the way
 * the local-state version did (ticket 32.2).
 */
function EmailComposer({
	register,
	errors,
	body,
	recipients,
	recipientMode,
	presets,
	presetsLoading,
	onRecipientsChange,
	onRecipientModeChange,
	onPresetEmpty,
	onPresetPartial,
	onBodyChange,
	onSubjectBlur,
	disabled,
	className,
}: EmailComposerProps) {
	const t = useTranslations('report.export')
	const [recipientInput, setRecipientInput] = useState('')

	const addRecipient = useCallback(
		(email: string) => {
			const trimmed = email.trim()
			if (!trimmed || recipients.includes(trimmed)) return
			onRecipientsChange([...recipients, trimmed])
			setRecipientInput('')
		},
		[recipients, onRecipientsChange],
	)

	const removeRecipient = useCallback(
		(email: string) => {
			onRecipientsChange(recipients.filter((r) => r !== email))
		},
		[recipients, onRecipientsChange],
	)

	// Either/or: picking a preset replaces the chips with that preset's addresses.
	// A preset that resolves to no address replaces nothing: it must never wipe
	// chips the assessor already has (that is how a stored recipient list got
	// silently emptied when the click landed before the data did).
	const applyMode = useCallback(
		(mode: RecipientMode) => {
			const candidates =
				mode === 'claimant' ? [presets.claimant] : [presets.claimant, presets.lawyer]
			const next = candidates.filter((email): email is string => Boolean(email))
			if (next.length === 0) {
				onPresetEmpty?.(mode)
				return
			}
			if (next.length < candidates.length) onPresetPartial?.(mode)
			onRecipientsChange(next)
			onRecipientModeChange(mode)
		},
		[presets, onRecipientsChange, onRecipientModeChange, onPresetEmpty, onPresetPartial],
	)

	return (
		<div
			className={cn('flex flex-col gap-6 rounded-xl border border-border bg-white p-6', className)}
		>
			<h3 className="text-h4 font-semibold text-black">{t('email')}</h3>

			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<span className="text-body-sm font-medium text-black">{t('recipient')}</span>
					<div className="flex items-center gap-2">
						{MODE_BUTTONS.map(({ mode, labelKey }) => (
							<button
								key={mode}
								type="button"
								disabled={disabled || presetsLoading}
								onClick={() => applyMode(mode)}
								aria-pressed={recipientMode === mode}
								aria-label={t(labelKey)}
								className={cn(
									'flex h-10 w-10 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50',
									recipientMode === mode
										? 'border-primary bg-primary text-white'
										: 'cursor-pointer border-border bg-white text-grey-100 hover:bg-grey-25',
								)}
							>
								{mode === 'claimant' ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}
							</button>
						))}
					</div>
				</div>

				<div className="flex min-h-12 flex-wrap items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
					{recipients.map((email) => (
						<div
							key={email}
							className="flex items-center gap-1.5 rounded-full bg-grey-25 py-1 pl-3 pr-1.5"
						>
							<div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
								<User className="h-3 w-3" />
							</div>
							<span className="text-caption font-medium text-black">{email}</span>
							<button
								type="button"
								disabled={disabled}
								onClick={() => removeRecipient(email)}
								className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-grey-100 hover:bg-grey-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
								aria-label={t('removeEmail', { email })}
							>
								<X className="h-3 w-3" />
							</button>
						</div>
					))}
					<input
						type="email"
						disabled={disabled}
						className="min-w-32 flex-1 border-none bg-transparent text-body-sm text-black placeholder:text-placeholder outline-none"
						placeholder={recipients.length === 0 ? t('addRecipientPlaceholder') : ''}
						value={recipientInput}
						onChange={(e) => setRecipientInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ',') {
								e.preventDefault()
								addRecipient(recipientInput)
							}
							if (e.key === 'Backspace' && !recipientInput && recipients.length > 0) {
								const last = recipients[recipients.length - 1]
								if (last) removeRecipient(last)
							}
						}}
						onBlur={() => {
							if (recipientInput.trim()) addRecipient(recipientInput)
						}}
					/>
				</div>

				{recipients.length === 0 && !recipientInput && (
					<p className="text-caption text-grey-100">{t('recipientPlaceholder')}</p>
				)}
			</div>

			<TextField
				label={t('subject')}
				placeholder={t('subjectPlaceholder')}
				error={errors.emailSubject?.message}
				disabled={disabled}
				{...register('emailSubject', { onBlur: onSubjectBlur })}
			/>

			<div className="flex flex-col gap-1">
				<RichTextEditor
					value={body}
					onChange={onBodyChange}
					placeholder={t('messagePlaceholder')}
					className="min-h-64"
				/>
				{errors.emailBody && (
					<p className="text-caption text-error" role="alert">
						{errors.emailBody.message}
					</p>
				)}
			</div>
		</div>
	)
}

export type { EmailComposerProps, RecipientPresets }
export { EmailComposer }
