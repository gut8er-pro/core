import { describe, expect, it } from 'vitest'
import { type ChildModelDelegate, replaceChildren } from './replace-children'

type Row = Record<string, unknown> & { id: string }

/** Builds a typed incoming array so id-less literals aren't rejected by excess-prop checks. */
function input(...items: Array<{ id?: string | null } & Record<string, unknown>>) {
	return items
}

/** Matches a stored row against a Prisma-style `where` (equality + `{ in: [...] }`). */
function matches(row: Row, where: Record<string, unknown>): boolean {
	for (const [key, cond] of Object.entries(where)) {
		if (cond && typeof cond === 'object' && 'in' in (cond as object)) {
			const values = (cond as { in: unknown[] }).in
			if (!values.includes(row[key])) return false
		} else if (row[key] !== cond) {
			return false
		}
	}
	return true
}

/** In-memory fake delegate implementing the four methods replaceChildren uses. */
function makeFakeModel(seed: Row[] = []) {
	let store: Row[] = seed.map((r) => ({ ...r }))
	let counter = 0

	const model: ChildModelDelegate = {
		async findMany({ where, select }) {
			const rows = store.filter((r) => matches(r, where))
			return select ? rows.map((r) => ({ id: r.id })) : (rows as Array<{ id: string }>)
		},
		async deleteMany({ where }) {
			const before = store.length
			store = store.filter((r) => !matches(r, where))
			return { count: before - store.length }
		},
		async updateMany({ where, data }) {
			let count = 0
			store = store.map((r) => {
				if (!matches(r, where)) return r
				count += 1
				return { ...r, ...data }
			})
			return { count }
		},
		async create({ data }) {
			counter += 1
			const id = (data.id as string) ?? `gen-${counter}`
			const row = { ...data, id } as Row
			store.push(row)
			return { id }
		},
	}

	return { model, dump: () => store }
}

describe('replaceChildren', () => {
	it('creates id-less rows with the parent FK injected', async () => {
		const { model, dump } = makeFakeModel()

		await replaceChildren(model, {
			parentKey: 'reportId',
			parentId: 'p1',
			incoming: input({ label: 'a' }, { label: 'b' }),
		})

		const rows = dump()
		expect(rows).toHaveLength(2)
		expect(rows.every((r) => r.reportId === 'p1')).toBe(true)
		expect(rows.map((r) => r.label).sort()).toEqual(['a', 'b'])
	})

	it('updates id-bearing rows in place', async () => {
		const { model, dump } = makeFakeModel([{ id: 'a', reportId: 'p1', value: 1 }])

		await replaceChildren(model, {
			parentKey: 'reportId',
			parentId: 'p1',
			incoming: input({ id: 'a', value: 99 }),
		})

		expect(dump()).toEqual([{ id: 'a', reportId: 'p1', value: 99 }])
	})

	it('deletes stored rows whose id is absent from the payload (id-diff)', async () => {
		const { model, dump } = makeFakeModel([
			{ id: 'a', reportId: 'p1', value: 1 },
			{ id: 'b', reportId: 'p1', value: 2 },
		])

		await replaceChildren(model, {
			parentKey: 'reportId',
			parentId: 'p1',
			incoming: input({ id: 'a', value: 10 }, { value: 3 }),
		})

		const rows = dump()
		expect(rows.find((r) => r.id === 'b')).toBeUndefined()
		expect(rows.find((r) => r.id === 'a')?.value).toBe(10)
		expect(rows).toHaveLength(2) // a (updated) + one created
	})

	it('empty payload clears the collection for that parent', async () => {
		const { model, dump } = makeFakeModel([
			{ id: 'a', reportId: 'p1' },
			{ id: 'b', reportId: 'p1' },
		])

		await replaceChildren(model, { parentKey: 'reportId', parentId: 'p1', incoming: [] })

		expect(dump()).toHaveLength(0)
	})

	it('never touches rows belonging to another parent', async () => {
		const { model, dump } = makeFakeModel([
			{ id: 'a', reportId: 'p1', value: 1 },
			{ id: 'x', reportId: 'p2', value: 500 }, // foreign parent
		])

		// Payload for p1 that even references the foreign id 'x'.
		await replaceChildren(model, {
			parentKey: 'reportId',
			parentId: 'p1',
			incoming: input({ id: 'x', value: 777 }),
		})

		// p2's row is untouched: not updated (scoped write no-ops) and not deleted.
		expect(dump().find((r) => r.id === 'x')).toEqual({ id: 'x', reportId: 'p2', value: 500 })
		// p1's real row 'a' was not in the payload, so it is gone.
		expect(dump().find((r) => r.id === 'a')).toBeUndefined()
	})

	it('returns the authoritative post-state including created ids', async () => {
		const { model } = makeFakeModel([{ id: 'a', reportId: 'p1' }])

		const result = await replaceChildren(model, {
			parentKey: 'reportId',
			parentId: 'p1',
			incoming: input({ id: 'a' }, { fresh: true }),
		})

		expect(result).toHaveLength(2)
		expect(result.every((r) => typeof r.id === 'string' && r.id.length > 0)).toBe(true)
	})
})
