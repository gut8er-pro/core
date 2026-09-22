/**
 * A report section's auto-save and its GET race each other whenever the
 * assessor leaves a tab mid-debounce: the unmount flush PATCHes while the
 * next mount's `refetchOnMount: 'always'` GET is already in flight, and a
 * GET that reaches the database first answers with pre-PATCH rows. The page
 * then initialises its form from that answer and the typing is gone.
 *
 * Every section fetcher waits here first, so a read can never overtake a
 * write that was issued before it.
 */

const pending = new Map<string, Promise<void>>()

function keyOf(reportId: string, section: string): string {
	return `${reportId}:${section}`
}

/**
 * Registers an in-flight section PATCH. Readers of the same section block
 * until it settles; the caller still gets the original promise, rejection
 * and all.
 */
function trackSectionSave<T>(reportId: string, section: string, save: Promise<T>): Promise<T> {
	const key = keyOf(reportId, section)
	const previous = pending.get(key)
	const chained = previous ? previous.then(() => save) : save
	const settled = chained.then(
		() => {},
		() => {},
	)

	pending.set(key, settled)
	settled.then(() => {
		if (pending.get(key) === settled) pending.delete(key)
	})

	return chained
}

/** Resolves once no save for this section is outstanding. */
async function awaitSectionSave(reportId: string, section: string): Promise<void> {
	const key = keyOf(reportId, section)
	let outstanding = pending.get(key)
	while (outstanding) {
		await outstanding
		const next = pending.get(key)
		outstanding = next === outstanding ? undefined : next
	}
}

function hasPendingSectionSave(reportId: string, section: string): boolean {
	return pending.has(keyOf(reportId, section))
}

/** Test seam — drops any tracked saves. */
function resetSectionSaves(): void {
	pending.clear()
}

export { awaitSectionSave, hasPendingSectionSave, resetSectionSaves, trackSectionSave }
