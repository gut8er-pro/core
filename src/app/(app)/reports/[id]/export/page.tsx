'use client'

import { CheckCircle2, Loader2, Send } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { EmailComposer } from '@/components/report/export/email-composer'
import { ExportToggles } from '@/components/report/export/export-toggles'
import type { ExportFormData } from '@/components/report/export/types'
import { Button } from '@/components/ui/button'
import { useAutoSave } from '@/hooks/use-auto-save'
import { useExportConfig, useSendReport } from '@/hooks/use-export'
import { useReport } from '@/hooks/use-reports'
import { useToast } from '@/hooks/use-toast'

function ExportPage() {
	const t = useTranslations('report.export')
	const locale = useLocale()
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading } = useExportConfig(reportId)
	const { data: report } = useReport(reportId)
	const sendMutation = useSendReport(reportId)
	const toast = useToast()
	const [sendSuccess, setSendSuccess] = useState(false)

	const { saveField, state: autoSaveState } = useAutoSave({
		reportId,
		section: 'export',
		disabled: report?.isLocked,
	})

	const {
		register,
		control,
		formState: { errors },
		reset,
		getValues,
		setValue,
	} = useForm<ExportFormData>({
		defaultValues: {
			includeValuation: true,
			includeCommission: true,
			includeInvoice: true,
			lockReport: false,
			pdfLanguages: [locale as 'en' | 'de'],
			recipientEmail: '',
			recipientName: '',
			emailSubject: '',
			emailBody: '',
		},
	})

	// Populate form when data loads
	useEffect(() => {
		if (!data) return

		reset({
			includeValuation: data.includeValuation ?? true,
			includeCommission: data.includeCommission ?? true,
			includeInvoice: data.includeInvoice ?? true,
			lockReport: data.lockReport ?? false,
			recipientEmail: data.recipientEmail ?? '',
			recipientName: data.recipientName ?? '',
			emailSubject: data.emailSubject ?? '',
			emailBody: data.emailBody ?? '',
		})
	}, [data, reset])

	const handleToggleChange = useCallback(
		(field: keyof ExportFormData, value: boolean) => {
			saveField(field, value)
		},
		[saveField],
	)

	const handleSend = useCallback(() => {
		const values = getValues()

		setSendSuccess(false)
		sendMutation.mutate(
			{
				recipientEmail: values.recipientEmail,
				recipientName: values.recipientName,
				emailSubject: values.emailSubject,
				emailBody: values.emailBody,
				lockReport: values.lockReport,
				pdfLanguages: values.pdfLanguages ?? [locale as 'en' | 'de'],
			},
			{
				onSuccess: () => {
					setSendSuccess(true)
					toast.success(t('reportSentToast'))
				},
				onError: (error: Error) => {
					toast.error(error.message || t('sendFailed'))
				},
			},
		)
	}, [getValues, sendMutation, toast, locale, t])

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-grey-50 border-t-primary" />
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Page header with Send Report button */}
			<div className="flex items-center justify-between">
				<h2 className="text-h2 font-bold text-black">{t('title')}</h2>
				<div className="flex items-center gap-3">
					{/* Auto-save status indicator */}
					<div className="flex items-center gap-1 text-caption">
						{autoSaveState.status === 'saving' && (
							<>
								<Loader2 className="h-3 w-3 animate-spin text-grey-100" />
								<span className="text-grey-100">{t('saving')}</span>
							</>
						)}
						{autoSaveState.status === 'saved' && (
							<>
								<CheckCircle2 className="h-3 w-3 text-primary" />
								<span className="text-primary">{t('saved')}</span>
							</>
						)}
						{autoSaveState.status === 'error' && (
							<span className="text-error">{t('failedToSave')}</span>
						)}
					</div>

					<Button
						variant="primary"
						size="md"
						icon={<Send className="h-4 w-4" />}
						iconPosition="right"
						loading={sendMutation.isPending}
						onClick={handleSend}
					>
						{t('sendReport')}
					</Button>
				</div>
			</div>

			{/* Send success message */}
			{sendSuccess && (
				<div className="flex items-center gap-2 rounded-md border border-success bg-success-light p-4">
					<CheckCircle2 className="h-5 w-5 text-success" />
					<span className="text-body-sm text-success">{t('reportSent')}</span>
				</div>
			)}

			{/* Send error message */}
			{sendMutation.isError && (
				<div className="rounded-md border border-error bg-error-light p-4">
					<span className="text-body-sm text-error">{sendMutation.error.message}</span>
				</div>
			)}

			{/* Two-column layout: Toggles (left) + Email composer (right) */}
			<div className="flex flex-col gap-6 lg:flex-row">
				{/* Left panel: toggles */}
				<div className="w-full shrink-0 lg:w-64">
					<ExportToggles control={control} onToggleChange={handleToggleChange} />
				</div>

				{/* Right panel: email composer */}
				<div className="min-w-0 flex-1">
					<EmailComposer
						register={register}
						setValue={setValue}
						errors={errors}
						onSend={handleSend}
						isSending={sendMutation.isPending}
					/>
				</div>
			</div>
		</div>
	)
}

export default ExportPage
