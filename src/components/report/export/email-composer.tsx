'use client'

import { useState, useCallback, useEffect } from 'react'
import { User, Users, FileText, X } from 'lucide-react'
import type { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form'
import { TextField } from '@/components/ui/text-field'
import { RichTextEditor } from '@/components/ui/rich-text-editor.dynamic'
import { cn } from '@/lib/utils'
import type { ExportFormData } from './types'

type Recipient = {
	name: string
	email: string
}

type EmailComposerProps = {
	register: UseFormRegister<ExportFormData>
	setValue: UseFormSetValue<ExportFormData>
	errors: FieldErrors<ExportFormData>
	onSend: () => void
	isSending?: boolean
	className?: string
}

function EmailComposer({
	register,
	setValue,
	errors,
	className,
}: EmailComposerProps) {
	const [recipients, setRecipients] = useState<Recipient[]>([])
	const [recipientInput, setRecipientInput] = useState('')

	// Sync recipients to form fields
	useEffect(() => {
		if (recipients.length > 0) {
			setValue('recipientEmail', recipients.map((r) => r.email).join(', '))
			setValue('recipientName', recipients.map((r) => r.name).join(', '))
		} else {
			setValue('recipientEmail', '')
			setValue('recipientName', '')
		}
	}, [recipients, setValue])

	const addRecipient = useCallback((email: string) => {
		const trimmed = email.trim()
		if (!trimmed || recipients.some((r) => r.email === trimmed)) return
		setRecipients((prev) => [...prev, { name: trimmed.split('@')[0] ?? trimmed, email: trimmed }])
		setRecipientInput('')
	}, [recipients])

	const removeRecipient = useCallback((email: string) => {
		setRecipients((prev) => prev.filter((r) => r.email !== email))
	}, [])

	return (
		<div className={cn('flex flex-col gap-6 rounded-xl border border-border bg-white p-6', className)}>
			<h3 className="text-h4 font-semibold text-black">Email</h3>

			{/* Recipient row with icon buttons */}
			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<span className="text-body-sm font-medium text-black">Recipient</span>
					<div className="flex items-center gap-2">
						<button
							type="button"
							className={cn(
								'flex h-10 w-10 items-center justify-center rounded-lg border transition-colors',
								'border-primary bg-primary text-white',
							)}
							aria-label="Individual recipient"
						>
							<User className="h-4 w-4" />
						</button>
						<button
							type="button"
							className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-white text-grey-100 transition-colors hover:bg-grey-25"
							aria-label="Group recipient"
						>
							<Users className="h-4 w-4" />
						</button>
						<button
							type="button"
							className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-white text-grey-100 transition-colors hover:bg-grey-25"
							aria-label="Document recipient"
						>
							<FileText className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Recipient chips + input */}
				<div className="flex min-h-12 flex-wrap items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
					{recipients.map((r) => (
						<div
							key={r.email}
							className="flex items-center gap-1.5 rounded-full bg-grey-25 py-1 pl-3 pr-1.5"
						>
							<div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
								<User className="h-3 w-3" />
							</div>
							<span className="text-caption font-medium text-black">{r.email}</span>
							<button
								type="button"
								onClick={() => removeRecipient(r.email)}
								className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-grey-100 hover:bg-grey-50 hover:text-black"
								aria-label={`Remove ${r.email}`}
							>
								<X className="h-3 w-3" />
							</button>
						</div>
					))}
					<input
						type="email"
						className="min-w-32 flex-1 border-none bg-transparent text-body-sm text-black placeholder:text-placeholder outline-none"
						placeholder={recipients.length === 0 ? 'Add recipient email...' : ''}
						value={recipientInput}
						onChange={(e) => setRecipientInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ',') {
								e.preventDefault()
								addRecipient(recipientInput)
							}
							if (e.key === 'Backspace' && !recipientInput && recipients.length > 0) {
								const last = recipients[recipients.length - 1]
								if (last) removeRecipient(last.email)
							}
						}}
						onBlur={() => {
							if (recipientInput.trim()) addRecipient(recipientInput)
						}}
					/>
				</div>

				{errors.recipientEmail && (
					<p className="text-caption text-error">{errors.recipientEmail.message}</p>
				)}

				{/* Empty state hint */}
				{recipients.length === 0 && !recipientInput && !errors.recipientEmail && (
					<p className="text-caption text-grey-100">
						Type an email address and press Enter to add a recipient
					</p>
				)}
			</div>

			{/* Subject */}
			<TextField
				label="Subject"
				placeholder="DD/MM/YYYY"
				error={errors.emailSubject?.message}
				{...register('emailSubject')}
			/>

			{/* Rich text email body */}
			<div className="flex flex-col gap-1">
				<RichTextEditor
					value=""
					onChange={() => {}}
					placeholder="Write your email message..."
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

export { EmailComposer }
export type { EmailComposerProps }
