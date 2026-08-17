/**
 * `replaceChildren` — the single deletion semantics for report child-collections.
 *
 * Persists an array of a report's children (visits, invoice line items, …) by
 * treating the incoming payload as the source of truth and reconciling the DB to
 * match it: rows with an `id` are updated, rows without an `id` are created, and
 * stored rows whose `id` is absent from the payload are deleted (id-diff).
 *
 * Design contract (see .scratch/architecture-deepening/05-child-collection-persistence):
 * - **id-diff only** — the schema has no business key; `id` is the sole identifier.
 * - **external transaction** — the caller wraps this in `prisma.$transaction` so the
 *   whole delete/update/create sequence is atomic. Pass the transactional delegate
 *   (`tx.visit`, not `prisma.visit`).
 * - **parent-scoped writes** — every delete/update is scoped by the parent FK, so a
 *   forged id from another parent matches zero rows. No per-row ownership SELECT.
 * - **caller pre-coerces** — model-specific transforms (e.g. date strings → `Date`)
 *   happen before calling this; the module stays generic.
 * - **no recursion** — nested children (tireSet → tires) are two composed calls.
 *
 * Only collections whose client sends the *whole* array may use this — a partial
 * payload would id-diff-delete everything it omits.
 */

/**
 * Minimal structural view of a Prisma model delegate — just the four methods
 * `replaceChildren` needs. Every generated delegate satisfies this, so callers
 * pass `tx.<model>` straight through.
 */
export interface ChildModelDelegate {
	findMany(args: {
		where: Record<string, unknown>
		select?: { id: true }
		orderBy?: Record<string, 'asc' | 'desc'>
	}): Promise<Array<{ id: string }>>
	deleteMany(args: { where: Record<string, unknown> }): Promise<{ count: number }>
	updateMany(args: {
		where: Record<string, unknown>
		data: Record<string, unknown>
	}): Promise<{ count: number }>
	create(args: { data: Record<string, unknown> }): Promise<{ id: string }>
}

export interface ReplaceChildrenParams<TIncoming extends { id?: string | null }> {
	/** The foreign-key column linking a child to its parent (e.g. `'reportId'`). */
	parentKey: string
	/** The parent's id — the value written to `parentKey` on create. */
	parentId: string
	/** The full desired collection. Rows with `id` update; rows without create. */
	incoming: TIncoming[]
	/** Optional ordering for the returned post-state. */
	orderBy?: Record<string, 'asc' | 'desc'>
}

/**
 * Reconcile a child collection to match `incoming`. Returns the authoritative
 * post-state (created ids included). Must run inside a transaction — pass `tx.<model>`.
 */
export async function replaceChildren<TIncoming extends { id?: string | null }>(
	model: ChildModelDelegate,
	{ parentKey, parentId, incoming, orderBy }: ReplaceChildrenParams<TIncoming>,
): Promise<Array<{ id: string }>> {
	// 1. Load the ids currently stored under this parent.
	const existing = await model.findMany({
		where: { [parentKey]: parentId },
		select: { id: true },
	})

	// 2. Delete rows whose id is no longer in the payload (id-diff).
	const incomingIds = new Set(
		incoming.map((item) => item.id).filter((value): value is string => !!value),
	)
	const toDelete = existing.filter((row) => !incomingIds.has(row.id)).map((row) => row.id)
	if (toDelete.length > 0) {
		await model.deleteMany({
			where: { id: { in: toDelete }, [parentKey]: parentId },
		})
	}

	// 3. Update id-bearing rows; create id-less ones. Writes are parent-scoped so a
	//    forged id from another parent matches nothing instead of touching it.
	for (const item of incoming) {
		const { id, ...data } = item
		if (id) {
			await model.updateMany({
				where: { id, [parentKey]: parentId },
				data: data as Record<string, unknown>,
			})
		} else {
			await model.create({
				data: { [parentKey]: parentId, ...data },
			})
		}
	}

	// 4. Return the authoritative post-state so callers can echo rows (with new ids).
	return model.findMany({
		where: { [parentKey]: parentId },
		...(orderBy ? { orderBy } : {}),
	})
}
