/**
 * Stable ids for every section that can carry a missing-count badge. The
 * section components look their badge up by these, so the manifest and the UI
 * agree without either importing the other's internals.
 */
const SECTION = {
	accident: 'accident',
	claimant: 'claimant',
	opponent: 'opponent',
	visits: 'visits',
	expertOpinion: 'expert-opinion',
	signatures: 'signatures',
	identification: 'identification',
	specification: 'specification',
	vehicleDetails: 'vehicle-details',
	condition: 'condition',
	damageDiagram: 'damage-diagram',
	tires: 'tires',
	priorDamage: 'prior-damage',
	value: 'value',
	repair: 'repair',
	loss: 'loss',
	datValuation: 'dat-valuation',
	manualValuation: 'manual-valuation',
	oldtimerValue: 'oldtimer-value',
	invoiceSettings: 'invoice-settings',
	lineItems: 'line-items',
} as const

type SectionId = (typeof SECTION)[keyof typeof SECTION]

export type { SectionId }
export { SECTION }
