import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { invoicePatchSchema } from '@/lib/validations/invoice'

type RouteContext = {
	params: Promise<{ id: string }>
}

async function GET(_request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id } = await context.params

	const report = await prisma.report.findFirst({
		where: { id, userId: user!.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	const invoice = await prisma.invoice.findUnique({
		where: { reportId: id },
		include: {
			lineItems: { orderBy: { order: 'asc' } },
		},
	})

	return NextResponse.json({
		invoice: invoice
			? {
					id: invoice.id,
					reportId: invoice.reportId,
					invoiceNumber: invoice.invoiceNumber,
					date: invoice.date,
					recipientId: invoice.recipientId,
					payoutDelay: invoice.payoutDelay,
					eInvoice: invoice.eInvoice,
					feeSchedule: invoice.feeSchedule,
					totalNet: invoice.totalNet,
					totalGross: invoice.totalGross,
					taxRate: invoice.taxRate,
				}
			: null,
		lineItems: invoice?.lineItems ?? [],
	})
}

async function PATCH(request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id } = await context.params

	const report = await prisma.report.findFirst({
		where: { id, userId: user!.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	if (report.isLocked) {
		return NextResponse.json({ error: 'Report is locked' }, { status: 403 })
	}

	const body = await request.json()
	const parsed = invoicePatchSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const data = parsed.data
	const results: Record<string, unknown> = {}

	// Ensure an Invoice record exists (upsert)
	let invoice = await prisma.invoice.findUnique({
		where: { reportId: id },
	})

	if (!invoice) {
		invoice = await prisma.invoice.create({
			data: { reportId: id },
		})
	}

	// Update invoice fields
	if (data.invoice) {
		const updateData: Record<string, unknown> = {}

		if (data.invoice.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoice.invoiceNumber
		if (data.invoice.date !== undefined) {
			updateData.date = data.invoice.date ? new Date(data.invoice.date) : null
		}
		if (data.invoice.recipientId !== undefined) updateData.recipientId = data.invoice.recipientId
		if (data.invoice.payoutDelay !== undefined) updateData.payoutDelay = data.invoice.payoutDelay
		if (data.invoice.eInvoice !== undefined) updateData.eInvoice = data.invoice.eInvoice
		if (data.invoice.feeSchedule !== undefined) updateData.feeSchedule = data.invoice.feeSchedule
		if (data.invoice.totalNet !== undefined) updateData.totalNet = data.invoice.totalNet
		if (data.invoice.totalGross !== undefined) updateData.totalGross = data.invoice.totalGross
		if (data.invoice.taxRate !== undefined) updateData.taxRate = data.invoice.taxRate

		if (Object.keys(updateData).length > 0) {
			results.invoice = await prisma.invoice.update({
				where: { id: invoice.id },
				data: updateData,
			})
		}
	}

	// Handle line items
	if (data.lineItems) {
		const lineItemResults = []
		for (const lineItem of data.lineItems) {
			const { id: lineItemId, ...lineItemData } = lineItem
			if (lineItemId) {
				const existing = await prisma.invoiceLineItem.findFirst({
					where: { id: lineItemId, invoiceId: invoice.id },
				})
				if (existing) {
					const updated = await prisma.invoiceLineItem.update({
						where: { id: lineItemId },
						data: lineItemData,
					})
					lineItemResults.push(updated)
				}
			} else {
				const created = await prisma.invoiceLineItem.create({
					data: {
						invoiceId: invoice.id,
						...lineItemData,
					},
				})
				lineItemResults.push(created)
			}
		}
		results.lineItems = lineItemResults
	}

	// Delete line items
	if (data.deleteLineItemIds && data.deleteLineItemIds.length > 0) {
		await prisma.invoiceLineItem.deleteMany({
			where: {
				id: { in: data.deleteLineItemIds },
				invoiceId: invoice.id,
			},
		})
		results.deletedLineItems = data.deleteLineItemIds
	}

	// Touch the report's updatedAt timestamp
	await prisma.report.update({
		where: { id },
		data: { updatedAt: new Date() },
	})

	return NextResponse.json(results)
}

export { GET, PATCH }
