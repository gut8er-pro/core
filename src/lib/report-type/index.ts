import { REPORT_TYPES, type ReportType } from '@/lib/validations/reports'

/**
 * Report-type policy module — the single source of truth for what each report
 * type (HS / BE / KG / OT) does. Every consumer reads capabilities from
 * {@link REPORT_TYPE_CONFIG} via {@link getReportTypeConfig} instead of
 * re-deriving `isOT` / `isBE` / `isKG` booleans locally.
 *
 * The config returns **facts, not text**: capability booleans and label
 * *identifiers* (variant tags) — never resolved strings. Each surface keeps
 * mapping the identifier to its own i18n key, so translation stays out of the
 * policy.
 */

/** Which calculation sub-form / PDF calc block / completion branch a type uses. */
type CalculationVariant = 'standard' | 'valuation' | 'oldtimer'

/** Identifier for the customer section label; each surface maps it to an i18n key. */
type CustomerLabel = 'claimant' | 'client'

/** Identifier for the PDF header subtitle; each surface maps it to an i18n key. */
type DocumentSubtitle = 'damageAssessment' | 'vehicleValuation' | 'oldtimerValuation'

type ReportTypeConfig = {
	/** Accident-info form block, PDF accident block, tab-completion accident count. */
	hasAccidentSection: boolean
	/** Opponent form + PDF block + tab-completion opponent count. */
	hasOpponent: boolean
	/** Claimant-section lawyer checkbox + `involvedLawyer` field. */
	hasLawyerFields: boolean
	/** Visit-section "Present" subsection (OT only). */
	hasPresentSubsection: boolean
	/** Condition page: Vehicle Grading + Value-Increasing Features (OT only). */
	hasConditionValuationSections: boolean
	/** Which calc sub-form, PDF calc block, tab-completion branch, section titles. */
	calculationVariant: CalculationVariant
	/** Correction section render AND its tab-completion count. */
	hasCorrection: boolean
	/** Claimant-section title, page heading, first-tab label, PDF label. */
	customerLabel: CustomerLabel
	/** PDF header subtitle. */
	documentSubtitle: DocumentSubtitle
}

/**
 * One declarative row per report type. Declared with `satisfies` so a 5th type
 * fails to compile until every field is filled in — this kills the silent
 * HS-like fall-through that negative-exclusion predicates (`!isBE && !isOT`)
 * used to cause across ~11 files.
 */
const REPORT_TYPE_CONFIG = {
	HS: {
		hasAccidentSection: true,
		hasOpponent: true,
		hasLawyerFields: true,
		hasPresentSubsection: false,
		hasConditionValuationSections: false,
		calculationVariant: 'standard',
		hasCorrection: true,
		customerLabel: 'claimant',
		documentSubtitle: 'damageAssessment',
	},
	KG: {
		hasAccidentSection: true,
		hasOpponent: true,
		hasLawyerFields: true,
		hasPresentSubsection: false,
		hasConditionValuationSections: false,
		calculationVariant: 'standard',
		hasCorrection: false,
		customerLabel: 'claimant',
		documentSubtitle: 'damageAssessment',
	},
	BE: {
		hasAccidentSection: false,
		hasOpponent: false,
		hasLawyerFields: true,
		hasPresentSubsection: false,
		hasConditionValuationSections: false,
		calculationVariant: 'valuation',
		hasCorrection: true,
		customerLabel: 'claimant',
		documentSubtitle: 'vehicleValuation',
	},
	OT: {
		hasAccidentSection: false,
		hasOpponent: false,
		hasLawyerFields: false,
		hasPresentSubsection: true,
		hasConditionValuationSections: true,
		calculationVariant: 'oldtimer',
		hasCorrection: false,
		customerLabel: 'client',
		documentSubtitle: 'oldtimerValuation',
	},
} satisfies Record<ReportType, ReportTypeConfig>

/** The strict accessor: read a known type's capabilities. */
function getReportTypeConfig(type: ReportType): ReportTypeConfig {
	return REPORT_TYPE_CONFIG[type]
}

/**
 * Normalizes the nullable DB `reportType` string. This is the ONE place the
 * null default lives: null / blank / unknown → `HS` (matches the historical
 * default in the PDF buffer generator).
 */
function resolveReportType(type: string | null | undefined): ReportType {
	return (REPORT_TYPES as readonly string[]).includes(type ?? '') ? (type as ReportType) : 'HS'
}

/**
 * Convenience accessor for the common case — a nullable DB `reportType` string
 * straight to its config. Composes {@link resolveReportType} +
 * {@link getReportTypeConfig} so consumers don't repeat the two-step at every
 * call site.
 */
function resolveReportTypeConfig(type: string | null | undefined): ReportTypeConfig {
	return getReportTypeConfig(resolveReportType(type))
}

export type { CalculationVariant, CustomerLabel, DocumentSubtitle, ReportTypeConfig }
export { getReportTypeConfig, REPORT_TYPE_CONFIG, resolveReportType, resolveReportTypeConfig }
