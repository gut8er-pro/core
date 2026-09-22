// Canonical select-option values the AI layer is allowed to emit.
//
// Source of truth for each list is the section component named beside it. The
// components build their options from `useTranslations`, which cannot run on
// the server side of the pipeline, so the raw `value` strings are mirrored
// here. Keep them in sync — a value that is not in the component's list is
// unusable in the UI.

// src/components/report/calculation/repair-section.tsx — WHEEL_ALIGNMENT_OPTIONS
// and BODY_MEASUREMENTS_OPTIONS (identical lists).
const REPAIR_OPERATION_VALUES = ['not_required', 'required', 'completed'] as const

// src/components/report/calculation/repair-section.tsx — BODY_PAINT_OPTIONS
const BODY_PAINT_VALUES = ['not_required', 'partial', 'full'] as const

// src/components/report/vehicle/details-section.tsx — VEHICLE_TYPE_OPTIONS
const VEHICLE_TYPE_VALUES = [
	'sedan',
	'compact',
	'suv',
	'wagon',
	'coupe',
	'convertible',
	'van',
] as const

type RepairOperationValue = (typeof REPAIR_OPERATION_VALUES)[number]
type BodyPaintValue = (typeof BODY_PAINT_VALUES)[number]

const REPAIR_OPERATION_SYNONYMS: Record<string, RepairOperationValue> = {
	required: 'required',
	yes: 'required',
	necessary: 'required',
	needed: 'required',
	erforderlich: 'required',
	notwendig: 'required',
	ja: 'required',
	'not required': 'not_required',
	'not needed': 'not_required',
	'not necessary': 'not_required',
	none: 'not_required',
	no: 'not_required',
	'nicht erforderlich': 'not_required',
	'nicht notwendig': 'not_required',
	nein: 'not_required',
	completed: 'completed',
	done: 'completed',
	performed: 'completed',
	durchgeführt: 'completed',
	erledigt: 'completed',
}

const BODY_PAINT_SYNONYMS: Record<string, BodyPaintValue> = {
	'not required': 'not_required',
	'no paint': 'not_required',
	none: 'not_required',
	no: 'not_required',
	'nicht erforderlich': 'not_required',
	keine: 'not_required',
	partial: 'partial',
	'spot repair': 'partial',
	spot: 'partial',
	'panel repaint': 'partial',
	'partial repaint': 'partial',
	beilackierung: 'partial',
	teillackierung: 'partial',
	full: 'full',
	'full repaint': 'full',
	'full section repaint': 'full',
	'complete repaint': 'full',
	komplettlackierung: 'full',
	ganzlackierung: 'full',
}

function normalizeKey(raw: unknown): string | null {
	if (typeof raw !== 'string') return null
	const trimmed = raw.trim().toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ')
	return trimmed || null
}

function matchFromMap<T extends string>(raw: unknown, map: Record<string, T>): T | null {
	const key = normalizeKey(raw)
	if (!key) return null
	const exact = map[key]
	if (exact) return exact
	for (const [candidate, value] of Object.entries(map)) {
		if (key.includes(candidate)) return value
	}
	return null
}

/**
 * Maps a free-form model answer onto one of the wheelAlignment /
 * bodyMeasurements option values. Returns null when nothing matches, so the
 * select stays on its placeholder instead of holding an unusable string.
 */
function normalizeRepairOperation(raw: unknown): RepairOperationValue | null {
	return matchFromMap(raw, REPAIR_OPERATION_SYNONYMS)
}

function normalizeBodyPaint(raw: unknown): BodyPaintValue | null {
	return matchFromMap(raw, BODY_PAINT_SYNONYMS)
}

export type { BodyPaintValue, RepairOperationValue }
export {
	BODY_PAINT_VALUES,
	normalizeBodyPaint,
	normalizeRepairOperation,
	REPAIR_OPERATION_VALUES,
	VEHICLE_TYPE_VALUES,
}
