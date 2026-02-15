import { z } from 'zod'

const invoiceSchema = z.object({
	invoiceNumber: z.string().max(50).nullable().optional(),
	date: z.string().datetime({ offset: true }).nullable().optional(),
	recipientId: z.string().max(200).nullable().optional(),
	payoutDelay: z.number().int().nonnegative().nullable().optional(),
	eInvoice: z.boolean().optional(),
	feeSchedule: z.string().max(50).optional(),
	totalNet: z.number().nonnegative().optional(),
	totalGross: z.number().nonnegative().optional(),
	taxRate: z.number().min(0).max(100).optional(),
})

const lineItemSchema = z.object({
	id: z.string().uuid().optional(),
	description: z.string().min(1).max(500),
	specialFeature: z.string().max(200).nullable().optional(),
	isLumpSum: z.boolean().optional(),
	rate: z.number().nonnegative().optional(),
	amount: z.number().nonnegative(),
	quantity: z.number().nonnegative().optional(),
	perUnit: z.number().nonnegative().nullable().optional(),
	order: z.number().int().nonnegative().optional(),
})

const invoicePatchSchema = z.object({
	invoice: invoiceSchema.optional(),
	lineItems: z.array(lineItemSchema).optional(),
	deleteLineItemIds: z.array(z.string().uuid()).optional(),
})

type InvoiceInput = z.infer<typeof invoiceSchema>
type LineItemInput = z.infer<typeof lineItemSchema>
type InvoicePatchInput = z.infer<typeof invoicePatchSchema>

export {
	invoiceSchema,
	lineItemSchema,
	invoicePatchSchema,
}
export type {
	InvoiceInput,
	LineItemInput,
	InvoicePatchInput,
}
