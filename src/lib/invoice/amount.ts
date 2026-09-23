const DEFAULT_TAX_RATE = 19

type AmountSource = {
	totalGross: number
	totalNet: number
	taxRate: number
	lineItems: Array<{ amount: number; rate: number; quantity: number }>
}

/** What the rows actually add up to, regardless of what is stored. */
function invoiceNet(invoice: Pick<AmountSource, 'lineItems'>): number {
	return invoice.lineItems.reduce(
		(sum, item) => sum + (item.amount || item.rate * item.quantity),
		0,
	)
}

function grossFromNet(net: number, taxRate: number): number {
	return net * (1 + (taxRate > 0 ? taxRate : DEFAULT_TAX_RATE) / 100)
}

function invoiceGross(invoice: AmountSource): number {
	if (invoice.totalGross > 0) return invoice.totalGross
	const net = invoice.totalNet > 0 ? invoice.totalNet : invoiceNet(invoice)
	return grossFromNet(net, invoice.taxRate)
}

export type { AmountSource }
export { DEFAULT_TAX_RATE, grossFromNet, invoiceGross, invoiceNet }
