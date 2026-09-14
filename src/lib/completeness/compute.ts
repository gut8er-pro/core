import { REPORT_TYPES } from '@/lib/validations/reports'
import { MANIFEST } from './manifest'
import type {
	MissingInfoReport,
	ReportType,
	RowRule,
	Rule,
	SectionReport,
	SectionSpec,
	TabKey,
	TabReport,
} from './types'

const TAB_KEYS: TabKey[] = ['accidentInfo', 'vehicle', 'condition', 'calculation', 'invoice']
/** Narrows a stored report type, falling back to liability while it loads. */
function toReportType(value: string | null | undefined): ReportType {
	return REPORT_TYPES.find((type) => type === value) ?? 'HS'
}

type LooseValues = Record<string, unknown>
type LooseSection = SectionSpec<LooseValues>

/**
 * One unsatisfied requirement contributes a single count and every field the
 * assessor could fill to satisfy it — an either/or is one gap with two cures.
 */
type Gaps = { count: number; paths: string[] }

/**
 * Whether a stored value counts as filled in.
 *
 * Booleans deliberately never count: every boolean column in the database is
 * non-nullable with a default, so "unchecked" and "never answered" are the same
 * stored value. Callers must skip boolean fields rather than report them.
 */
function hasValue(value: unknown): boolean {
	if (value === null || value === undefined) return false
	if (typeof value === 'boolean') return false
	if (typeof value === 'string') return value.trim().length > 0
	if (typeof value === 'number') return !Number.isNaN(value)
	if (Array.isArray(value)) return value.length > 0
	return true
}

function rowMatches(row: unknown, where: Record<string, unknown> | undefined): boolean {
	if (!where) return true
	if (typeof row !== 'object' || row === null) return false
	const record = row as LooseValues
	return Object.entries(where).every(([key, expected]) => record[key] === expected)
}

function toRows(value: unknown): LooseValues[] {
	if (!Array.isArray(value)) return []
	return value.filter((row): row is LooseValues => typeof row === 'object' && row !== null)
}

function collectField(values: LooseValues, path: string, prefix: string, gaps: Gaps): void {
	const value = values[path]
	// Booleans can never be reported missing — see hasValue().
	if (typeof value === 'boolean') return
	if (hasValue(value)) return
	gaps.count += 1
	gaps.paths.push(`${prefix}${path}`)
}

function collectEither(values: LooseValues, paths: string[], prefix: string, gaps: Gaps): void {
	const eligible = paths.filter((path) => typeof values[path] !== 'boolean')
	if (eligible.length === 0) return
	if (eligible.some((path) => hasValue(values[path]))) return
	// One gap — but flag every member, because either one would close it.
	gaps.count += 1
	for (const path of eligible) gaps.paths.push(`${prefix}${path}`)
}

function collectRows(
	values: LooseValues,
	rule: { path: string; where?: Record<string, unknown>; row?: RowRule[] },
	prefix: string,
	gaps: Gaps,
): void {
	const rows = toRows(values[rule.path])
	const matching = rows.filter((row) => rowMatches(row, rule.where))

	if (matching.length === 0) {
		// An entirely absent section is missing, not silently complete.
		gaps.count += 1
		gaps.paths.push(`${prefix}${rule.path}`)
		return
	}

	rows.forEach((row, index) => {
		if (!rowMatches(row, rule.where)) return
		for (const rowRule of rule.row ?? []) {
			collectRowRule(row, rowRule, `${prefix}${rule.path}.${index}.`, gaps)
		}
	})
}

function collectRowRule(row: LooseValues, rule: RowRule, prefix: string, gaps: Gaps): void {
	if (rule.kind === 'field') {
		collectField(row, rule.path, prefix, gaps)
	} else if (rule.kind === 'either') {
		collectEither(row, rule.paths, prefix, gaps)
	} else {
		collectRows(row, rule, prefix, gaps)
	}
}

function collectRule(values: LooseValues, rule: Rule<LooseValues>, gaps: Gaps): void {
	switch (rule.kind) {
		case 'field':
			collectField(values, rule.path, '', gaps)
			break
		case 'either':
			collectEither(values, rule.paths, '', gaps)
			break
		case 'rows':
			collectRows(values, rule, '', gaps)
			break
		case 'when':
			if (values[rule.path] !== rule.equals) break
			for (const nested of rule.rules) collectRule(values, nested, gaps)
			break
	}
}

function evaluateSection(section: LooseSection, values: LooseValues): SectionReport {
	const gaps: Gaps = { count: 0, paths: [] }
	for (const rule of section.rules) collectRule(values, rule, gaps)
	return {
		id: section.id,
		missingCount: gaps.count,
		missingPaths: gaps.paths,
		isComplete: gaps.count === 0,
	}
}

function evaluateSections(
	sections: LooseSection[],
	values: LooseValues | null | undefined,
): TabReport {
	const resolved = values ?? {}
	const reports = sections.map((section) => evaluateSection(section, resolved))
	const missingPaths = reports.flatMap((section) => section.missingPaths)
	const missingCount = reports.reduce((total, section) => total + section.missingCount, 0)
	const sectionsComplete = reports.filter((section) => section.isComplete).length

	return {
		sections: reports,
		sectionsComplete,
		sectionsTotal: reports.length,
		missingCount,
		missingPaths,
		isComplete: missingCount === 0,
	}
}

/** Which required fields of one tab are still empty, for one report type. */
function evaluateTab(
	reportType: ReportType,
	tab: TabKey,
	values: LooseValues | null | undefined,
): TabReport {
	return evaluateSections(MANIFEST[reportType][tab], values)
}

/**
 * The five tabs' saved values. Typed loosely on purpose: the manifest is where
 * field names are checked against a form type, and this accepts whatever the
 * form-data adapters produce.
 */
type ReportValuesInput = Partial<Record<TabKey, LooseValues | null | undefined>>

/** Which required fields are still empty across a whole report. */
function computeMissingInfo(reportType: ReportType, values: ReportValuesInput): MissingInfoReport {
	const tabs = {} as Record<TabKey, TabReport>
	let missingCount = 0

	for (const tab of TAB_KEYS) {
		const report = evaluateTab(reportType, tab, values[tab])
		tabs[tab] = report
		missingCount += report.missingCount
	}

	return { tabs, missingCount, isComplete: missingCount === 0 }
}

export { computeMissingInfo, evaluateTab, toReportType }
