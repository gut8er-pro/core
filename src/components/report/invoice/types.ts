import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form'

type InvoiceFormData = {
	invoiceNumber: string
	date: string
	recipientId: string
	payoutDelay: string
	eInvoice: boolean
	feeSchedule: string
	lineItems: Array<{
		description: string
		specialFeature: string
		isLumpSum: boolean
		rate: string
		amount: string
		quantity: string
	}>
}

type InvoiceSectionProps = {
	register: UseFormRegister<InvoiceFormData>
	control: Control<InvoiceFormData>
	errors: FieldErrors<InvoiceFormData>
	onFieldBlur?: (field: string) => void
	className?: string
}

export type { InvoiceFormData, InvoiceSectionProps }
