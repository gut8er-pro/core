import type { AccidentInfoFormData, SignatureData } from '@/components/report/accident-info/types'
import type { CalculationFormData } from '@/components/report/calculation/types'
import type {
	ConditionFormData,
	DamageMarkerData,
	OldtimerDetailsData,
	PaintMarkerData,
	TireSetData,
} from '@/components/report/condition/types'
import type { InvoiceFormData } from '@/components/report/invoice/types'
import type { VehicleFormData } from '@/components/report/vehicle/types'
import type { ReportType } from '@/lib/validations/reports'
import type { SectionId } from './sections'

type TabKey = 'gallery' | 'accidentInfo' | 'vehicle' | 'condition' | 'calculation' | 'invoice'

/** The five tabs of the Report Details screen — everything but the gallery. */
type DetailTabKey = Exclude<TabKey, 'gallery'>

/** Only top-level keys of a tab's value object may be named by a rule. */
type FieldName<TValues> = Extract<keyof TValues, string>

/**
 * A rule applied inside a single row of an array-backed section. Row paths are
 * plain keys of the row object, so they cannot be checked against a form type.
 */
type RowRule =
	| { kind: 'field'; path: string }
	| { kind: 'either'; paths: string[] }
	| { kind: 'rows'; path: string; where?: Record<string, unknown>; row?: RowRule[] }

/**
 * One requirement inside a section.
 *
 * - `field` — the named field must hold a value.
 * - `either` — at least one of the named fields must hold a value.
 * - `rows` — the named array must have at least one row (optionally one
 *   matching `where`), and every such row must satisfy its own `row` rules.
 * - `when` — the nested rules apply only while another field equals a value.
 */
type Rule<TValues> =
	| { kind: 'field'; path: FieldName<TValues> }
	| { kind: 'either'; paths: FieldName<TValues>[] }
	| {
			kind: 'rows'
			path: FieldName<TValues>
			where?: Record<string, unknown>
			row?: RowRule[]
	  }
	| { kind: 'when'; path: FieldName<TValues>; equals: unknown; rules: Rule<TValues>[] }

type SectionSpec<TValues> = {
	/** Stable id — the UI looks a section's badge up by this. */
	id: SectionId
	rules: Rule<TValues>[]
}

/** The gallery owns no form — only the photos the assessor uploaded. */
type GalleryValues = { photos: { id: string }[] }

/** Tab data as the forms hold it, plus the collections the forms don't own. */
type AccidentInfoValues = AccidentInfoFormData & { signatures: SignatureData[] }
type VehicleValues = VehicleFormData
type ConditionValues = ConditionFormData &
	OldtimerDetailsData & {
		damageMarkers: DamageMarkerData[]
		paintMarkers: PaintMarkerData[]
		tireSets: TireSetData[]
	}
type CalculationValues = CalculationFormData
type InvoiceValues = InvoiceFormData

type ReportManifest = {
	gallery: SectionSpec<GalleryValues>[]
	accidentInfo: SectionSpec<AccidentInfoValues>[]
	vehicle: SectionSpec<VehicleValues>[]
	condition: SectionSpec<ConditionValues>[]
	calculation: SectionSpec<CalculationValues>[]
	invoice: SectionSpec<InvoiceValues>[]
}

type Manifest = Record<ReportType, ReportManifest>

type SectionReport = {
	id: SectionId
	/** Unsatisfied requirements — an either/or counts once, not once per side. */
	missingCount: number
	/**
	 * Every field that would close a gap, named the way the form names it. An
	 * either/or contributes both sides, so this can exceed `missingCount`.
	 */
	missingPaths: string[]
	isComplete: boolean
}

type TabReport = {
	sections: SectionReport[]
	sectionsComplete: number
	sectionsTotal: number
	missingCount: number
	missingPaths: string[]
	isComplete: boolean
}

type MissingInfoReport = {
	tabs: Record<TabKey, TabReport>
	/** Required fields still empty across the whole report. */
	missingCount: number
	sectionsComplete: number
	sectionsTotal: number
	/**
	 * Sections satisfied, as a percentage. Measured in sections rather than
	 * fields because sections are a fixed set per report type, while a row-backed
	 * requirement grows a gap per row — so a field-based denominator would move
	 * under its own numerator. 100 means the same thing as `isComplete`.
	 */
	completionPercentage: number
	isComplete: boolean
}

export type {
	AccidentInfoValues,
	CalculationValues,
	ConditionValues,
	DetailTabKey,
	GalleryValues,
	InvoiceValues,
	Manifest,
	MissingInfoReport,
	ReportType,
	RowRule,
	Rule,
	SectionReport,
	SectionSpec,
	TabKey,
	TabReport,
	VehicleValues,
}
