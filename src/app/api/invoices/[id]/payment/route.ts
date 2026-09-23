import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { invoiceGross } from '@/lib/invoice/amount'
import { paymentStatus } from '@/lib/invoice/payment-status'
import { prisma } from '@/lib/prisma'

const invoicePaymentSchema = z.object({
	paid: z.boolean(),
	paidAt: z.string().datetime({ offset: true }).optional(),
})

type RouteContext = {
	params: Promise<{ id: string }>
}

async function PATCH(request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error || !user) return unauthorizedResponse()

	const { id } = await context.params

	const existing = await prisma.invoice.findFirst({
		where: { id, report: { userId: user.id } },
		select: { id: true },
	})

	if (!existing) {
		return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
	}

	const body = await request.json()
	const parsed = invoicePaymentSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const invoice = await prisma.invoice.update({
		where: { id },
		data: {
			paidAt: parsed.data.paid
				? parsed.data.paidAt
					? new Date(parsed.data.paidAt)
					: new Date()
				: null,
		},
		select: {
			id: true,
			date: true,
			payoutDelay: true,
			paidAt: true,
			totalGross: true,
			totalNet: true,
			taxRate: true,
			lineItems: { select: { amount: true, rate: true, quantity: true } },
		},
	})

	return NextResponse.json({
		id: invoice.id,
		paidAt: invoice.paidAt,
		amount: invoiceGross(invoice),
		status: paymentStatus(invoice, new Date()),
	})
}

export { PATCH }
