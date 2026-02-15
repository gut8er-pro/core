type BvskRateEntry = {
	minRepairCost: number
	maxRepairCost: number
	baseFee: number
	additionalFee: number
}

const BVSK_RATES: BvskRateEntry[] = [
	{ minRepairCost: 0, maxRepairCost: 500, baseFee: 312, additionalFee: 50 },
	{ minRepairCost: 500, maxRepairCost: 750, baseFee: 362, additionalFee: 65 },
	{ minRepairCost: 750, maxRepairCost: 1000, baseFee: 427, additionalFee: 75 },
	{ minRepairCost: 1000, maxRepairCost: 1500, baseFee: 502, additionalFee: 85 },
	{ minRepairCost: 1500, maxRepairCost: 2000, baseFee: 587, additionalFee: 100 },
	{ minRepairCost: 2000, maxRepairCost: 2500, baseFee: 687, additionalFee: 110 },
	{ minRepairCost: 2500, maxRepairCost: 3000, baseFee: 797, additionalFee: 120 },
	{ minRepairCost: 3000, maxRepairCost: 4000, baseFee: 917, additionalFee: 130 },
	{ minRepairCost: 4000, maxRepairCost: 5000, baseFee: 1047, additionalFee: 145 },
	{ minRepairCost: 5000, maxRepairCost: 6000, baseFee: 1192, additionalFee: 155 },
	{ minRepairCost: 6000, maxRepairCost: 7000, baseFee: 1347, additionalFee: 165 },
	{ minRepairCost: 7000, maxRepairCost: 8000, baseFee: 1512, additionalFee: 175 },
	{ minRepairCost: 8000, maxRepairCost: 10000, baseFee: 1687, additionalFee: 185 },
	{ minRepairCost: 10000, maxRepairCost: 12500, baseFee: 1872, additionalFee: 195 },
	{ minRepairCost: 12500, maxRepairCost: 15000, baseFee: 2067, additionalFee: 210 },
	{ minRepairCost: 15000, maxRepairCost: 20000, baseFee: 2277, additionalFee: 230 },
	{ minRepairCost: 20000, maxRepairCost: 25000, baseFee: 2507, additionalFee: 250 },
	{ minRepairCost: 25000, maxRepairCost: 30000, baseFee: 2757, additionalFee: 270 },
	{ minRepairCost: 30000, maxRepairCost: 40000, baseFee: 3027, additionalFee: 290 },
	{ minRepairCost: 40000, maxRepairCost: 50000, baseFee: 3317, additionalFee: 310 },
]

function calculateNetTotal(lineItems: { amount: number }[]): number {
	return lineItems.reduce((sum, item) => sum + item.amount, 0)
}

function calculateTax(netTotal: number, taxRate: number): number {
	return netTotal * (taxRate / 100)
}

function calculateGrossTotal(netTotal: number, taxRate: number): number {
	return netTotal + calculateTax(netTotal, taxRate)
}

function generateInvoiceNumber(prefix: string): string {
	const year = new Date().getFullYear()
	const sequence = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')
	return `${prefix}-${sequence}-${year}`
}

function lookupBvskRate(repairCost: number): { baseFee: number; additionalFee: number } {
	const entry = BVSK_RATES.find(
		(rate) => repairCost >= rate.minRepairCost && repairCost <= rate.maxRepairCost,
	)

	if (entry) {
		return { baseFee: entry.baseFee, additionalFee: entry.additionalFee }
	}

	// If above the highest bracket, return the last entry
	const last = BVSK_RATES[BVSK_RATES.length - 1]!
	return { baseFee: last.baseFee, additionalFee: last.additionalFee }
}

export {
	BVSK_RATES,
	calculateNetTotal,
	calculateTax,
	calculateGrossTotal,
	generateInvoiceNumber,
	lookupBvskRate,
}
export type { BvskRateEntry }
