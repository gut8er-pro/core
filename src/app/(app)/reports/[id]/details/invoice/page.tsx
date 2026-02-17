'use client'

import { useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useInvoice } from '@/hooks/use-invoice'
import { useReport } from '@/hooks/use-reports'
import { useAutoSave } from '@/hooks/use-auto-save'
import { InvoiceBanner } from '@/components/report/invoice/invoice-banner'
import { InvoiceSettings } from '@/components/report/invoice/invoice-settings'
import { LineItemsSection } from '@/components/report/invoice/line-items-section'
import { BvskRateTable } from '@/components/report/invoice/bvsk-rate-table'
import type { InvoiceFormData } from '@/components/report/invoice/types'

function InvoicePage() {
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading } = useInvoice(reportId)
	const { data: report } = useReport(reportId)

	const { saveField, state: autoSaveState } = useAutoSave({
		reportId,
		section: 'invoice',
		disabled: report?.isLocked,
	})

	const {
		register,
		control,
		formState: { errors },
		reset,
		setValue,
		getValues,
	} = useForm<InvoiceFormData>({
		defaultValues: {
			invoiceNumber: '',
			date: '',
			recipientId: '',
			payoutDelay: '30',
			eInvoice: true,
			feeSchedule: 'bvsk',
			lineItems: [],
		},
	})

	// Populate form when data loads
	useEffect(() => {
		if (!data) return

		const inv = data.invoice
		const formData: Partial<InvoiceFormData> = {
			invoiceNumber: inv?.invoiceNumber ?? '',
			date: inv?.date?.split('T')[0] ?? '',
			recipientId: inv?.recipientId ?? '',
			payoutDelay: inv?.payoutDelay?.toString() ?? '30',
			eInvoice: inv?.eInvoice ?? true,
			feeSchedule: inv?.feeSchedule ?? 'bvsk',
			lineItems: (data.lineItems ?? []).map((li) => ({
				description: li.description,
				specialFeature: li.specialFeature ?? '',
				isLumpSum: li.isLumpSum,
				rate: li.rate.toString(),
				amount: li.amount.toString(),
				quantity: li.quantity.toString(),
			})),
		}

		reset(formData as InvoiceFormData)
	}, [data, reset])

	const handleFieldBlur = useCallback(
		(field: string) => {
			const el = document.querySelector<HTMLInputElement>(`[name="${field}"]`)
			if (!el) return
			const value = el.type === 'checkbox' ? el.checked : el.value

			// Map numeric fields
			if (field === 'payoutDelay') {
				const numVal = parseInt(el.value, 10)
				saveField(`invoice.${field}`, isNaN(numVal) ? null : numVal)
			} else if (field === 'date') {
				const dateVal = el.value ? new Date(el.value).toISOString() : null
				saveField(`invoice.${field}`, dateVal)
			} else {
				saveField(`invoice.${field}`, value)
			}
		},
		[saveField],
	)

	const handleApplyBvskRate = useCallback(
		(baseFee: number, additionalFee: number) => {
			const currentItems = getValues('lineItems')
			const totalFee = baseFee + additionalFee

			if (currentItems.length === 0) {
				setValue('lineItems', [
					{
						description: 'BVSK Appraisal Fee',
						specialFeature: `Base: ${baseFee.toFixed(2)} + Additional: ${additionalFee.toFixed(2)}`,
						isLumpSum: true,
						rate: totalFee.toFixed(2),
						amount: totalFee.toFixed(2),
						quantity: '1',
					},
				])
			} else {
				setValue('lineItems.0.description', 'BVSK Appraisal Fee')
				setValue(
					'lineItems.0.specialFeature',
					`Base: ${baseFee.toFixed(2)} + Additional: ${additionalFee.toFixed(2)}`,
				)
				setValue('lineItems.0.isLumpSum', true)
				setValue('lineItems.0.rate', totalFee.toFixed(2))
				setValue('lineItems.0.amount', totalFee.toFixed(2))
				setValue('lineItems.0.quantity', '1')
			}
		},
		[getValues, setValue],
	)

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-grey-50 border-t-primary" />
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Auto-save status indicator */}
			<div className="flex items-center justify-end gap-1 text-caption">
				{autoSaveState.status === 'saving' && (
					<>
						<Loader2 className="h-3 w-3 animate-spin text-grey-100" />
						<span className="text-grey-100">Saving...</span>
					</>
				)}
				{autoSaveState.status === 'saved' && (
					<>
						<CheckCircle2 className="h-3 w-3 text-primary" />
						<span className="text-primary">Saved</span>
					</>
				)}
				{autoSaveState.status === 'error' && (
					<span className="text-error">Failed to save</span>
				)}
			</div>

			{/* Invoice totals banner */}
			<InvoiceBanner control={control} />

			{/* White card wrapping invoice details */}
			<div className="flex flex-col gap-6 rounded-[20px] bg-white p-5">
				{/* Invoice Details heading */}
				<h3 className="text-h3 font-semibold text-black">Invoice Details</h3>

				{/* Invoice settings */}
				<InvoiceSettings
					register={register}
					control={control}
					errors={errors}
					onFieldBlur={handleFieldBlur}
				/>

				{/* Line items with BVSK rate table embedded */}
				<LineItemsSection
					register={register}
					control={control}
					errors={errors}
					onFieldBlur={handleFieldBlur}
					bvskContent={
						<BvskRateTable
							onApplyRate={handleApplyBvskRate}
						/>
					}
				/>
			</div>
		</div>
	)
}

export default InvoicePage
