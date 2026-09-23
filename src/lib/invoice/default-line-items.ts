/**
 * The four rows every invoice starts with. `specialFeature` carries the key so a
 * row keeps its identity across the replace-all save, reordering and deletion —
 * the schema has no column of its own for it.
 */
const DEFAULT_LINE_ITEM_KEYS = ['grundhonorar', 'anfahrt', 'druck_versand', 'fotografien'] as const

type DefaultLineItemKey = (typeof DEFAULT_LINE_ITEM_KEYS)[number]

type DefaultLineItem = {
	key: DefaultLineItemKey
	descriptionKey: string
	/** Pauschale is the only option — no quantity, no per-unit price. */
	lumpSumOnly: boolean
	unitKey?: string
	seedRate: number
	seedIsLumpSum: boolean
}

/**
 * Seed prices follow JVEG practice (BGH VI ZR 50/15, VI ZR 280/22): photos
 * 2,00 €/Stück, travel 0,70 €/km, print and postage as a 15,00 € lump sum.
 */
const DEFAULT_LINE_ITEMS: DefaultLineItem[] = [
	{
		key: 'grundhonorar',
		descriptionKey: 'defaultRows.grundhonorar',
		lumpSumOnly: true,
		seedRate: 0,
		seedIsLumpSum: true,
	},
	{
		key: 'anfahrt',
		descriptionKey: 'defaultRows.anfahrt',
		lumpSumOnly: false,
		unitKey: 'units.km',
		seedRate: 0.7,
		seedIsLumpSum: false,
	},
	{
		key: 'druck_versand',
		descriptionKey: 'defaultRows.druckVersand',
		lumpSumOnly: true,
		seedRate: 15,
		seedIsLumpSum: true,
	},
	{
		key: 'fotografien',
		descriptionKey: 'defaultRows.fotografien',
		lumpSumOnly: false,
		unitKey: 'units.piece',
		seedRate: 2,
		seedIsLumpSum: false,
	},
]

const DEFAULT_LINE_ITEM_DESCRIPTIONS: Record<DefaultLineItemKey, string> = {
	grundhonorar: 'Grundhonorar',
	anfahrt: 'Anfahrt',
	druck_versand: 'Druck & Versand',
	fotografien: 'Fotografien',
}

function defaultLineItemByKey(key: string | null | undefined): DefaultLineItem | undefined {
	if (!key) return undefined
	return DEFAULT_LINE_ITEMS.find((item) => item.key === key)
}

type FormLineItem = {
	specialFeature?: string | null
	isLumpSum?: boolean
	rate?: string | number | null
	quantity?: string | number | null
}

/** A Pauschale row bills its rate; a per-unit row bills rate × quantity. */
function lineItemAmount(item: FormLineItem): number {
	const rate = parseFloat(String(item.rate ?? '')) || 0
	const lumpSumOnly = defaultLineItemByKey(item.specialFeature)?.lumpSumOnly ?? false
	if (lumpSumOnly || item.isLumpSum) return rate
	return rate * (parseFloat(String(item.quantity ?? '')) || 0)
}

/** The rows a brand-new invoice is seeded with, in order. */
function seedLineItems(): Array<{
	description: string
	specialFeature: string
	isLumpSum: boolean
	rate: number
	amount: number
	quantity: number
	order: number
}> {
	return DEFAULT_LINE_ITEMS.map((item, order) => ({
		description: DEFAULT_LINE_ITEM_DESCRIPTIONS[item.key],
		specialFeature: item.key,
		isLumpSum: item.seedIsLumpSum,
		rate: item.seedRate,
		amount: item.seedIsLumpSum ? item.seedRate : 0,
		quantity: item.seedIsLumpSum ? 1 : 0,
		order,
	}))
}

export type { DefaultLineItem, DefaultLineItemKey, FormLineItem }
export {
	DEFAULT_LINE_ITEM_DESCRIPTIONS,
	DEFAULT_LINE_ITEM_KEYS,
	DEFAULT_LINE_ITEMS,
	defaultLineItemByKey,
	lineItemAmount,
	seedLineItems,
}
