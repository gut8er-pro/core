'use client'

import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Eye, Loader2, Send } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { EmailComposer } from '@/components/report/export/email-composer'
import { ExportToggles } from '@/components/report/export/export-toggles'
import { IncompleteNotice } from '@/components/report/export/incomplete-notice'
import type { ExportFormData, RecipientMode } from '@/components/report/export/types'
import { Button } from '@/components/ui/button'
import { useAccidentInfo } from '@/hooks/use-accident-info'
import { useAutoSave } from '@/hooks/use-auto-save'
import {
	buildPdfUrl,
	IncompleteReportError,
	PdfGenerationFailedError,
	SendFailedError,
	useExportConfig,
	useSendReport,
} from '@/hooks/use-export'
import { useFreshMissingInfo } from '@/hooks/use-missing-info'
import { useReport } from '@/hooks/use-reports'
import { useToast } from '@/hooks/use-toast'
import { awaitSectionSave } from '@/lib/api/section-saves'
import { isDelivered, toReportType } from '@/lib/completeness'
import type { SendFailureCode } from '@/lib/email/send-failure'
import { serializeSections } from '@/lib/pdf/sections'

/**
 * A `Record` rather than a switch: a new failure code is then a type error here
 * rather than a silent fallthrough to the generic message.
 */
const SEND_ERROR_KEYS: Record<SendFailureCode, string> = {
	recipient_rejected: 'sendErrors.recipientRejected',
	attachment_too_large: 'sendErrors.attachmentTooLarge',
	email_service_unavailable: 'sendErrors.emailServiceUnavailable',
}

function ExportPage() {
	const t = useTranslations('report.export')
	const locale = useLocale()
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading } = useExportConfig(reportId)
	const { data: report } = useReport(reportId)
	const { data: accidentInfo, isLoading: accidentInfoLoading } = useAccidentInfo(reportId)
	const sendMutation = useSendReport(reportId)
	const toast = useToast()
	const [sendSuccess, setSendSuccess] = useState(false)

	// A delivered report is past the gate for good, so it is never judged again.
	const reportType = toReportType(report?.reportType)
	const isSent = isDelivered(report ?? {})
	const { missingInfo, isRefreshing } = useFreshMissingInfo(
		reportId,
		report?.reportType ?? undefined,
	)
	const isBlocked = !isSent && !missingInfo.isComplete

	// No `disabled` on a locked report: locking closes the Gutachten to edits,
	// not to delivery, and the composer is how a re-send is addressed. The
	// export config is not report content (ticket 02 export slice).
	const {
		saveField,
		saveFields,
		flushNow,
		state: autoSaveState,
	} = useAutoSave({
		reportId,
		section: 'export',
	})
	const queryClient = useQueryClient()

	const {
		register,
		control,
		formState: { errors },
		reset,
		getValues,
		setValue,
		watch,
	} = useForm<ExportFormData>({
		defaultValues: {
			includeValuation: true,
			includeCommission: true,
			includeInvoice: true,
			lockReport: false,
			pdfLanguages: [locale as 'en' | 'de'],
			recipients: [],
			recipientMode: null,
			emailSubject: '',
			emailBody: '',
		},
	})

	// Everything the assessor typed comes back on reopen — recipients, subject
	// and body alike, not just the toggles (ticket 32.1).
	useEffect(() => {
		if (!data) return

		reset({
			includeValuation: data.includeValuation ?? true,
			includeCommission: data.includeCommission ?? true,
			includeInvoice: data.includeInvoice ?? true,
			lockReport: data.lockReport ?? false,
			pdfLanguages: [locale as 'en' | 'de'],
			recipients: data.recipients ?? [],
			recipientMode: data.recipientMode ?? null,
			emailSubject: data.emailSubject ?? '',
			emailBody: data.emailBody ?? '',
		})
	}, [data, reset, locale])

	const recipients = watch('recipients')
	const recipientMode = watch('recipientMode')
	const pdfLanguages = watch('pdfLanguages')
	const includeValuation = watch('includeValuation')
	const includeCommission = watch('includeCommission')
	const includeInvoice = watch('includeInvoice')

	const hasSections = includeValuation || includeCommission || includeInvoice
	const canSend = !isRefreshing && !isBlocked && recipients.length > 0 && hasSections
	const canPreview = (!isRefreshing && !isBlocked && hasSections) || (isSent && hasSections)

	const handleToggleChange = useCallback(
		(field: keyof ExportFormData, value: boolean) => {
			saveField(field, value)
			// The lock is state, not content: land it now and refresh the report
			// row, or the read-only banner outlives the unlock it announces.
			if (field === 'lockReport') {
				flushNow()
				void awaitSectionSave(reportId, 'export').then(() => {
					queryClient.invalidateQueries({ queryKey: ['report', reportId], exact: true })
				})
			}
		},
		[saveField, flushNow, reportId, queryClient],
	)

	const handleRecipientsChange = useCallback(
		(next: string[]) => {
			setValue('recipients', next, { shouldDirty: true })
			saveFields({ recipients: next, recipientEmail: next.join(', ') })
		},
		[setValue, saveFields],
	)

	const handleRecipientModeChange = useCallback(
		(mode: RecipientMode | null) => {
			setValue('recipientMode', mode, { shouldDirty: true })
			saveField('recipientMode', mode)
		},
		[setValue, saveField],
	)

	const handleBodyChange = useCallback(
		(html: string) => {
			setValue('emailBody', html, { shouldDirty: true })
			saveField('emailBody', html)
		},
		[setValue, saveField],
	)

	const handleSubjectBlur = useCallback(() => {
		saveField('emailSubject', getValues('emailSubject'))
	}, [saveField, getValues])

	const handlePresetEmpty = useCallback(() => {
		toast.error(t('presetNoEmail'))
	}, [toast, t])

	const previewUrl = useCallback(
		(lang: 'en' | 'de') =>
			buildPdfUrl(reportId, {
				lang,
				sections: {
					valuation: includeValuation,
					commission: includeCommission,
					invoice: includeInvoice,
				},
				inline: true,
			}),
		[reportId, includeValuation, includeCommission, includeInvoice],
	)

	// The only place a send failure is put into words. The server answers with a
	// code — the provider's own prose is English and names our infrastructure, so
	// it never leaves the server.
	const sendErrorMessage = useCallback(
		(error: Error) => {
			// A 422 that reached a click means the browser was working from stale
			// data. Say so and leave the retry to the assessor — sending is
			// irreversible and must follow a deliberate click.
			if (error instanceof IncompleteReportError) return t('notSavedYet')
			if (error instanceof SendFailedError) return t(SEND_ERROR_KEYS[error.code])
			if (error instanceof PdfGenerationFailedError) {
				if (error.languages.length === 0) return t('sendFailed')
				return t('sendErrors.pdfGenerationFailed', {
					languages: error.languages.map((l) => l.toUpperCase()).join(', '),
				})
			}
			return t('sendFailed')
		},
		[t],
	)

	const handleSend = useCallback(() => {
		const values = getValues()
		// Built from the rendered chips and nothing else. Zero chips never reaches
		// the server: the button is disabled, and this guard closes the race where
		// a click lands on state that has since emptied (ticket 32.2).
		if (values.recipients.length === 0) return

		setSendSuccess(false)
		sendMutation.mutate(
			{
				recipientEmail: values.recipients.join(', '),
				recipientName: values.recipients.map((email) => email.split('@')[0] ?? email).join(', '),
				recipientMode: values.recipientMode,
				emailSubject: values.emailSubject,
				emailBody: values.emailBody,
				lockReport: values.lockReport,
				pdfLanguages: values.pdfLanguages ?? [locale as 'en' | 'de'],
				sections: serializeSections({
					valuation: values.includeValuation,
					commission: values.includeCommission,
					invoice: values.includeInvoice,
				})
					.split(',')
					.filter(Boolean),
			},
			{
				onSuccess: () => {
					setSendSuccess(true)
					toast.success(t('reportSentToast'))
				},
				onError: (error: Error) => {
					toast.error(sendErrorMessage(error))
				},
			},
		)
	}, [getValues, sendMutation, toast, locale, sendErrorMessage, t])

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-grey-50 border-t-primary" />
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Page header with Preview + Send Report buttons */}
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

					{pdfLanguages.map((lang) => {
						const label =
							pdfLanguages.length > 1
								? t('previewPdfLanguage', { language: lang.toUpperCase() })
								: t('previewPdf')
						if (!canPreview) {
							return (
								<Button
									key={lang}
									variant="secondary"
									size="md"
									icon={<Eye className="h-4 w-4" />}
									disabled
								>
									{label}
								</Button>
							)
						}
						return (
							<Button key={lang} variant="secondary" size="md" asChild>
								<a
									href={previewUrl(lang)}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2"
								>
									<Eye className="h-4 w-4" />
									{label}
								</a>
							</Button>
						)
					})}

					<Button
						variant="primary"
						size="md"
						icon={<Send className="h-4 w-4" />}
						iconPosition="right"
						loading={sendMutation.isPending}
						disabled={!canSend}
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
					<span className="text-body-sm text-error">{sendErrorMessage(sendMutation.error)}</span>
				</div>
			)}

			{/* Why Send is disabled, and where to go about it */}
			{isRefreshing && !isSent && (
				<p className="text-body-sm text-grey-100">{t('checkingCompleteness')}</p>
			)}
			{isBlocked && !isRefreshing && (
				<IncompleteNotice reportId={reportId} reportType={reportType} missingInfo={missingInfo} />
			)}
			{!isBlocked && recipients.length === 0 && (
				<p className="text-body-sm text-grey-100">{t('noRecipientsHint')}</p>
			)}
			{!hasSections && <p className="text-body-sm text-grey-100">{t('noSectionsHint')}</p>}

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
						errors={errors}
						body={watch('emailBody')}
						recipients={recipients}
						recipientMode={recipientMode}
						presets={{
							claimant: accidentInfo?.claimantInfo?.email ?? null,
							lawyer: accidentInfo?.claimantInfo?.lawyerEmail ?? null,
						}}
						presetsLoading={accidentInfoLoading}
						onRecipientsChange={handleRecipientsChange}
						onRecipientModeChange={handleRecipientModeChange}
						onPresetEmpty={handlePresetEmpty}
						onBodyChange={handleBodyChange}
						onSubjectBlur={handleSubjectBlur}
					/>
				</div>
			</div>
		</div>
	)
}

export default ExportPage
