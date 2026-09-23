'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { BvskRateTable } from '@/components/report/invoice/bvsk-rate-table'
import { INVOICE_DEFAULTS, invoiceFromApi } from '@/components/report/invoice/form-data'
import { InvoiceBanner } from '@/components/report/invoice/invoice-banner'
import { InvoiceSettings } from '@/components/report/invoice/invoice-settings'
import { LineItemsSection } from '@/components/report/invoice/line-items-section'
import type { InvoiceFormData } from '@/components/report/invoice/types'
import { MissingFieldsProvider } from '@/components/report/missing-info'
import { useAutoSave } from '@/hooks/use-auto-save'
import { useInvoice } from '@/hooks/use-invoice'
import { usePhotos } from '@/hooks/use-photos'
import { useReport } from '@/hooks/use-reports'
import { toReportType } from '@/lib/completeness'
import { defaultLineItemByKey, lineItemAmount } from '@/lib/invoice/default-line-items'
import { generateInvoiceNumber } from '@/lib/utils/invoice-calculations'

function InvoicePage() {
	const t = useTranslations('report.invoice')
	const tc = useTranslations('common')
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading, isFetchedAfterMount } = useInvoice(reportId)
	const { data: report } = useReport(reportId)
	const { data: photoData } = usePhotos(reportId)
	const photoCount = photoData?.photos?.length ?? 0
	const isLocked = report?.isLocked === true

	const {
		saveField,
		saveFields,
		state: autoSaveState,
	} = useAutoSave({
		reportId,
		section: 'invoice',
		disabled: report?.isLocked,
	})

	const {
		register,
		control,
		formState: { errors, dirtyFields },
		reset,
		setValue,
		getValues,
		watch,
	} = useForm<InvoiceFormData>({ defaultValues: { ...INVOICE_DEFAULTS } })

	// Wait for this mount's own fetch. React Query serves the previous mount's
	// cached body first, and initialising from it re-entered the tab showing the
	// form defaults — discarding, and then overwriting, what was just saved.
	const initializedRef = useRef(false)
	useEffect(() => {
		if (!data || !isFetchedAfterMount || initializedRef.current) return
		initializedRef.current = true

		const formData = invoiceFromApi(data)

		if (!formData.invoiceNumber) {
			formData.invoiceNumber = generateInvoiceNumber('GH')
		}

		reset(formData)

		if (!data.invoice?.invoiceNumber && formData.invoiceNumber) {
			saveField('invoice.invoiceNumber', formData.invoiceNumber)
		}
	}, [data, isFetchedAfterMount, reset, saveField])

	const saveLineItems = useCallback(() => {
		const items = (getValues('lineItems') ?? []).filter(
			(li) => li.description || Number(li.rate) > 0,
		)
		const formatted = items.map((li, i) => {
			const lumpSumOnly = defaultLineItemByKey(li.specialFeature)?.lumpSumOnly ?? false
			const isLumpSum = lumpSumOnly || (li.isLumpSum ?? false)
			return {
				description: li.description || '',
				specialFeature: li.specialFeature || '',
				isLumpSum,
				rate: parseFloat(String(li.rate)) || 0,
				amount: lineItemAmount(li),
				quantity: isLumpSum ? 1 : parseFloat(String(li.quantity)) || 0,
				order: i,
			}
		})
		saveFields({ lineItems: formatted })
	}, [getValues, saveFields])

	const handleFieldBlur = useCallback(
		(field: string) => {
			if (field.startsWith('lineItems')) {
				saveLineItems()
				return
			}

			const value = getValues(field as keyof InvoiceFormData)
			if (value === undefined) return

			if (field === 'payoutDelay') {
				const numVal = parseInt(String(value), 10)
				saveField(`invoice.${field}`, Number.isNaN(numVal) ? null : numVal)
			} else if (field === 'date') {
				const dateVal = value ? new Date(String(value)).toISOString() : null
				saveField(`invoice.${field}`, dateVal)
			} else {
				saveField(`invoice.${field}`, value)
			}
		},
		[saveField, saveLineItems, getValues],
	)

	// Auto-save fires on input change too (debounced) — without this the
	// last-typed field is lost if the user navigates before blur. Dotted (array)
	// names are excluded; line items keep the blur-only path because the form
	// doesn't round-trip created row ids and per-keystroke replace-all writes
	// would thrash the table. Only user-initiated changes are saved: reset()
	// also fires watch and would otherwise write the form's defaults back.
	useEffect(() => {
		const sub = watch((_v, { name, type }) => {
			if (!name || name.includes('.')) return
			if (type !== 'change') return
			if (!dirtyFields[name as keyof InvoiceFormData]) return
			handleFieldBlur(name)
		})
		return () => sub.unsubscribe()
	}, [watch, handleFieldBlur, dirtyFields])

	// The Fotografien row counts the gallery for itself until the assessor
	// types a quantity of their own.
	const photoRowTouchedRef = useRef(false)
	useEffect(() => {
		if (isLocked || !data || !isFetchedAfterMount || photoRowTouchedRef.current) return
		const items = getValues('lineItems') ?? []
		const index = items.findIndex((li) => li.specialFeature === 'fotografien')
		if (index === -1 || items[index]?.quantity === String(photoCount)) return
		setValue(`lineItems.${index}.quantity`, String(photoCount))
		saveLineItems()
	}, [photoCount, data, isFetchedAfterMount, getValues, setValue, saveLineItems, isLocked])

	const handleLineItemBlur = useCallback(
		(field: string) => {
			if (field.endsWith('.quantity')) {
				const index = Number(field.split('.')[1])
				const items = getValues('lineItems') ?? []
				if (items[index]?.specialFeature === 'fotografien') {
					photoRowTouchedRef.current = true
				}
			}
			handleFieldBlur(field)
		},
		[getValues, handleFieldBlur],
	)

	const handleApplyBvskRate = useCallback(
		(baseFee: number, additionalFee: number) => {
			const currentItems = getValues('lineItems') ?? []
			const totalFee = baseFee + additionalFee
			const index = currentItems.findIndex((li) => li.specialFeature === 'grundhonorar')

			if (index === -1) {
				setValue('lineItems', [
					...currentItems,
					{
						description: t('defaultRows.grundhonorar'),
						specialFeature: 'grundhonorar',
						isLumpSum: true,
						rate: totalFee.toFixed(2),
						amount: totalFee.toFixed(2),
						quantity: '1',
					},
				])
			} else {
				setValue(`lineItems.${index}.isLumpSum`, true)
				setValue(`lineItems.${index}.rate`, totalFee.toFixed(2))
				setValue(`lineItems.${index}.amount`, totalFee.toFixed(2))
				setValue(`lineItems.${index}.quantity`, '1')
			}
			saveLineItems()
		},
		[getValues, setValue, saveLineItems, t],
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
			<div className="flex items-center justify-end gap-1 text-caption">
				{autoSaveState.status === 'saving' && (
					<>
						<Loader2 className="h-3 w-3 animate-spin text-grey-100" />
						<span className="text-grey-100">{tc('saving')}</span>
					</>
				)}
				{autoSaveState.status === 'saved' && (
					<>
						<CheckCircle2 className="h-3 w-3 text-primary" />
						<span className="text-primary">{tc('saved')}</span>
					</>
				)}
				{autoSaveState.status === 'error' && (
					<span className="text-error">{tc('failedToSave')}</span>
				)}
			</div>

			<InvoiceBanner control={control} reportId={reportId} />

			<div className="flex flex-col gap-6 rounded-card bg-white p-5">
				<h3 className="text-h3 font-semibold text-black">{t('title')}</h3>

				<MissingFieldsProvider
					tab="invoice"
					reportType={toReportType(report?.reportType)}
					control={control}
				>
					<fieldset disabled={isLocked} className="flex flex-col gap-6 disabled:opacity-60">
						<InvoiceSettings
							register={register}
							control={control}
							errors={errors}
							onFieldBlur={handleFieldBlur}
						/>

						<LineItemsSection
							register={register}
							control={control}
							errors={errors}
							onFieldBlur={handleLineItemBlur}
							onRowsChange={saveLineItems}
							bvskContent={<BvskRateTable onApplyRate={handleApplyBvskRate} />}
						/>
					</fieldset>
				</MissingFieldsProvider>
			</div>
		</div>
	)
}

export default InvoicePage
