'use client'

import { Send } from 'lucide-react'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { TextField } from '@/components/ui/text-field'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { ExportFormData } from './types'

type EmailComposerProps = {
	register: UseFormRegister<ExportFormData>
	errors: FieldErrors<ExportFormData>
	onSend: () => void
	isSending?: boolean
	className?: string
}

function EmailComposer({
	register,
	errors,
	onSend,
	isSending,
	className,
}: EmailComposerProps) {
	return (
		<div className={cn('flex flex-col gap-6', className)}>
			<h3 className="text-body font-semibold text-black">Send Report</h3>

			<div className="flex flex-col gap-4">
				{/* Recipient fields */}
				<div className="grid grid-cols-2 gap-4">
					<TextField
						label="Recipient Name"
						placeholder="Enter recipient name"
						error={errors.recipientName?.message}
						{...register('recipientName')}
					/>
					<TextField
						label="Recipient Email"
						type="email"
						placeholder="Enter recipient email"
						error={errors.recipientEmail?.message}
						{...register('recipientEmail')}
					/>
				</div>

				{/* Subject */}
				<TextField
					label="Subject"
					placeholder="Enter email subject"
					error={errors.emailSubject?.message}
					{...register('emailSubject')}
				/>

				{/* Email body */}
				<div className="flex flex-col gap-1">
					<Label htmlFor="email-body">Message</Label>
					<textarea
						id="email-body"
						placeholder="Enter email body..."
						rows={8}
						className={cn(
							'w-full rounded-md border border-border bg-white px-4 py-3 text-body-sm text-black placeholder:text-grey-100',
							'focus:border-primary focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2',
							'resize-y',
							errors.emailBody && 'border-error focus:border-error',
						)}
						{...register('emailBody')}
					/>
					{errors.emailBody && (
						<p className="text-caption text-error" role="alert">
							{errors.emailBody.message}
						</p>
					)}
				</div>
			</div>

			{/* Send button */}
			<div className="flex justify-end pt-4">
				<Button
					variant="primary"
					size="lg"
					icon={<Send className="h-4 w-4" />}
					loading={isSending}
					onClick={onSend}
				>
					Send Report
				</Button>
			</div>
		</div>
	)
}

export { EmailComposer }
export type { EmailComposerProps }
