/**
 * Tire-set writes through the condition PATCH, against a real database.
 *
 * An id-less tire set in the PATCH means "make sure set N exists", not "another
 * set N". A retried request, a second tab, or any client that has not yet seen
 * the server's id must land on the existing row — leaving what is already typed
 * there alone — rather than stacking a duplicate set beside the first. Only the
 * database can prove that holds under two concurrent writes, which is why this
 * lives here and not in a mocked unit test.
 *
 * Requires DATABASE_URL and a database migrated to the current schema; skipped
 * otherwise. Everything it writes hangs off one throwaway user and is cascaded
 * away afterwards.
 *
 * @vitest-environment node
 */

import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/lib/prisma'

const session = vi.hoisted(() => ({ userId: '' }))

vi.mock('@/lib/api/auth', () => ({
	getAuthenticatedUser: async () => ({ user: { id: session.userId }, error: null }),
	unauthorizedResponse: () => new Response(null, { status: 401 }),
}))

const { PATCH } = await import('@/app/api/reports/[id]/condition/route')

type TireSetPayload = {
	id: string
	setNumber: number
	tires: { id: string; position: string; size: string | null }[]
}

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip

describeWithDb('condition PATCH tire sets', () => {
	let userId: string

	beforeAll(async () => {
		const user = await prisma.user.create({
			data: { email: `tire-sets-${randomUUID()}@gut8erpro.test` },
		})
		userId = user.id
		session.userId = userId
	})

	afterAll(async () => {
		await prisma.user.delete({ where: { id: userId } })
	})

	async function createReport() {
		const report = await prisma.report.create({
			data: { userId, reportType: 'HS', title: 'Tire set idempotency test' },
		})
		return report.id
	}

	async function patch(reportId: string, payload: unknown) {
		const response = await PATCH(
			new NextRequest(`http://localhost/api/reports/${reportId}/condition`, {
				method: 'PATCH',
				body: JSON.stringify(payload),
			}),
			{ params: Promise.resolve({ id: reportId }) },
		)
		expect(response.status).toBe(200)
		return (await response.json()) as { tireSets: TireSetPayload[] }
	}

	function idLessSet(setNumber: number, size: string) {
		return {
			setNumber,
			tires: ['VL', 'VR', 'HL', 'HR'].map((position) => ({ position, size })),
		}
	}

	async function storedSets(reportId: string) {
		return prisma.tireSet.findMany({
			where: { condition: { reportId } },
			include: { tires: { orderBy: { position: 'asc' } } },
			orderBy: { setNumber: 'asc' },
		})
	}

	it('lands a retried id-less set on the existing set without overwriting it', async () => {
		const reportId = await createReport()

		const first = await patch(reportId, { tireSets: [idLessSet(1, '205/55 R16')] })
		const retry = await patch(reportId, { tireSets: [idLessSet(1, '')] })

		expect(first.tireSets[0]?.id).toBeDefined()
		expect(retry.tireSets[0]?.id).toBe(first.tireSets[0]?.id)
		const sets = await storedSets(reportId)
		expect(sets).toHaveLength(1)
		expect(sets[0]?.tires.map((tire) => tire.size)).toEqual(Array(4).fill('205/55 R16'))
	})

	it('fills only the positions an existing set lacks', async () => {
		const reportId = await createReport()

		await patch(reportId, {
			tireSets: [{ setNumber: 1, tires: [{ position: 'VL', size: '205/55 R16' }] }],
		})
		await patch(reportId, { tireSets: [idLessSet(1, '')] })

		const [set] = await storedSets(reportId)
		expect(set?.tires.map((tire) => [tire.position, tire.size])).toEqual([
			['HL', ''],
			['HR', ''],
			['VL', '205/55 R16'],
			['VR', ''],
		])
	})

	it('keeps one set of four tires when two id-less writes race', async () => {
		const reportId = await createReport()
		// Both requests find no condition yet; create it up front so the race under
		// test is the tire set's, not the condition row's.
		await prisma.vehicleCondition.create({ data: { reportId } })

		await Promise.all([
			patch(reportId, { tireSets: [idLessSet(1, '')] }),
			patch(reportId, { tireSets: [idLessSet(1, '')] }),
		])

		const sets = await storedSets(reportId)
		expect(sets).toHaveLength(1)
		expect(sets[0]?.tires).toHaveLength(4)
	})

	it('still creates a new set for a set number the report does not have', async () => {
		const reportId = await createReport()

		await patch(reportId, { tireSets: [idLessSet(1, '205/55 R16')] })
		await patch(reportId, { tireSets: [idLessSet(2, '195/65 R15')] })

		const sets = await storedSets(reportId)
		expect(sets.map((set) => set.setNumber)).toEqual([1, 2])
		expect(sets[1]?.tires.map((tire) => tire.size)).toEqual(Array(4).fill('195/65 R15'))
	})

	it('matches id-less tires on an identified set by position', async () => {
		const reportId = await createReport()

		const first = await patch(reportId, { tireSets: [idLessSet(1, '205/55 R16')] })
		await patch(reportId, {
			tireSets: [
				{ id: first.tireSets[0]?.id, setNumber: 1, tires: [{ position: 'VL', size: 'new' }] },
			],
		})

		const [set] = await storedSets(reportId)
		expect(set?.tires).toHaveLength(4)
		expect(set?.tires.find((tire) => tire.position === 'VL')?.size).toBe('new')
	})
})
