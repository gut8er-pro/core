'use client'

import { User, Users, FileText, ChevronDown } from 'lucide-react'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { TextField } from '@/components/ui/text-field'
import { RichTextEditor } from '@/components/ui/rich-text-editor.dynamic'
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
	className,
}: EmailComposerProps) {
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

				{/* Recipient dropdown */}
				<button
					type="button"
					className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-left transition-colors hover:bg-grey-25"
				>
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-grey-25">
						<User className="h-5 w-5 text-grey-100" />
					</div>
					<div className="flex flex-1 flex-col">
						<span className="text-body-sm font-medium text-black">
							Select Recipient
						</span>
						<span className="text-caption text-grey-100">
							Choose a recipient
						</span>
					</div>
					<ChevronDown className="h-4 w-4 text-grey-100" />
				</button>
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
