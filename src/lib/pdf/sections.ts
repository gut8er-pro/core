const PDF_SECTIONS = ['report', 'valuation', 'commission', 'invoice'] as const

type PdfSection = (typeof PDF_SECTIONS)[number]

type PdfSectionSelection = {
	report: boolean
	valuation: boolean
	commission: boolean
	invoice: boolean
}

type ExportToggles = {
	includeVehicleValuation: boolean
	includeCommission: boolean
	includeInvoice: boolean
}

const ALL_SECTIONS: PdfSectionSelection = {
	report: true,
	valuation: true,
	commission: true,
	invoice: true,
}

function isPdfSection(value: string): value is PdfSection {
	return (PDF_SECTIONS as readonly string[]).includes(value)
}

/**
 * The document body — everything that is not a toggled add-on.
 *
 * Invoice-only is the case the client tried first: with every other toggle off
 * the Gutachten itself must disappear too, leaving a standalone invoice. Any
 * other combination keeps the report body, because a valuation or a commission
 * annex with no vehicle and no parties is not a document anyone can read.
 */
function withReportBody(selection: Omit<PdfSectionSelection, 'report'>): PdfSectionSelection {
	const invoiceOnly = selection.invoice && !selection.valuation && !selection.commission
	return { ...selection, report: !invoiceOnly }
}

function sectionsFromToggles(toggles: ExportToggles): PdfSectionSelection {
	return withReportBody({
		valuation: toggles.includeVehicleValuation,
		commission: toggles.includeCommission,
		invoice: toggles.includeInvoice,
	})
}

/**
 * Parses the `sections=` query param shared by preview, download and send.
 *
 * An absent param means "whatever the stored toggles say", which is why the
 * caller passes them as the fallback: a plain `?format=pdf` link must still
 * render what the composer shows. A param naming nothing recognisable is the
 * same as absent — a typo must not silently produce an empty Gutachten.
 */
function parseSectionsParam(
	param: string | null,
	fallback: PdfSectionSelection,
): PdfSectionSelection {
	if (param === null) return fallback

	const requested = param
		.split(',')
		.map((part) => part.trim().toLowerCase())
		.filter(isPdfSection)

	if (requested.length === 0) return fallback

	return withReportBody({
		valuation: requested.includes('valuation'),
		commission: requested.includes('commission'),
		invoice: requested.includes('invoice'),
	})
}

function serializeSections(selection: Omit<PdfSectionSelection, 'report'>): string {
	return PDF_SECTIONS.filter(
		(section) => section !== 'report' && selection[section as keyof typeof selection],
	).join(',')
}

export type { ExportToggles, PdfSection, PdfSectionSelection }
export { ALL_SECTIONS, PDF_SECTIONS, parseSectionsParam, sectionsFromToggles, serializeSections }
