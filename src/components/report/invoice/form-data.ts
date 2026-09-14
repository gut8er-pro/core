import type { InvoiceResponse } from '@/hooks/use-invoice'
import type { InvoiceFormData } from './types'

const INVOICE_DEFAULTS: InvoiceFormData = {
	invoiceNumber: '',
	date: '',
	recipientId: '',
	payoutDelay: '30',
	eInvoice: true,
	feeSchedule: 'bvsk',
	lineItems: [],
}

/** The saved invoice as the Invoice form holds it. */
function invoiceFromApi(data: InvoiceResponse | undefined | null): InvoiceFormData {
	if (!data) return { ...INVOICE_DEFAULTS }

	const invoice = data.invoice

	return {
		...INVOICE_DEFAULTS,
		invoiceNumber: invoice?.invoiceNumber ?? '',
		date: invoice?.date?.split('T')[0] ?? '',
		recipientId: invoice?.recipientId ?? '',
		payoutDelay: invoice?.payoutDelay?.toString() ?? INVOICE_DEFAULTS.payoutDelay,
		eInvoice: invoice?.eInvoice ?? INVOICE_DEFAULTS.eInvoice,
		feeSchedule: invoice?.feeSchedule ?? INVOICE_DEFAULTS.feeSchedule,
		lineItems: (data.lineItems ?? []).map((item) => ({
			description: item.description,
			specialFeature: item.specialFeature ?? '',
			isLumpSum: item.isLumpSum,
			rate: item.rate.toString(),
			amount: item.amount.toString(),
			quantity: item.quantity.toString(),
		})),
	}
}

export { INVOICE_DEFAULTS, invoiceFromApi }
