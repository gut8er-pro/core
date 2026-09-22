// Never-overwrite guard for AI-written columns.
//
// AI output pre-fills, it never overwrites. Every generate-pipeline write site
// runs its candidate values through `pickFillable` against the row as it
// currently stands, so a value the assessor already typed survives a Generate.

type Fillable = Record<string, unknown>

/**
 * A column counts as already owned by the user when it holds anything other
 * than null/undefined/blank string. `false` and `0` are deliberate values and
 * are therefore protected too.
 */
function isUserOwned(value: unknown): boolean {
	if (value === null || value === undefined) return false
	if (typeof value === 'string') return value.trim() !== ''
	if (Array.isArray(value)) return value.length > 0
	return true
}

/**
 * Returns the subset of `candidates` whose target column is still empty on
 * `existing`. Candidate values that are themselves empty are dropped — the AI
 * has nothing to contribute for that column. Pass `existing` as null when the
 * row does not exist yet; every non-empty candidate is then fillable.
 */
function pickFillable<T extends Fillable>(existing: Fillable | null, candidates: T): Partial<T> {
	const out: Fillable = {}
	for (const [key, value] of Object.entries(candidates)) {
		if (!isUserOwned(value)) continue
		if (existing && isUserOwned(existing[key])) continue
		out[key] = value
	}
	return out as Partial<T>
}

/**
 * Names of the columns `pickFillable` skipped because the user already owns
 * them. Used for the generate summary's warnings so the run says what it
 * chose not to touch.
 */
function skippedKeys<T extends Fillable>(existing: Fillable | null, candidates: T): string[] {
	if (!existing) return []
	return Object.entries(candidates)
		.filter(([key, value]) => isUserOwned(value) && isUserOwned(existing[key]))
		.map(([key]) => key)
}

export { isUserOwned, pickFillable, skippedKeys }
