import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { awaitSectionSave, hasPendingSectionSave, resetSectionSaves } from '@/lib/api/section-saves'

/**
 * The read barrier is only as good as the writes that register with it. Every
 * section mutation goes through its hook's own patch helper — not through
 * `useAutoSave` — so each one has to be tracked too, or a GET can still
 * overtake it. These assert that registration for every section.
 */

vi.mock('@tanstack/react-query', () => ({
	useMutation: vi.fn(),
	useQuery: vi.fn(),
	useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

type Section = {
	name: string
	section: string
	load: () => Promise<{ save: (reportId: string) => Promise<unknown> }>
}

const SECTIONS: Section[] = [
	{
		name: 'condition',
		section: 'condition',
		load: async () => {
			const mod = await import('./use-condition')
			return { save: (id) => mod.patchConditionSection(id, { condition: { hard: '1' } }) }
		},
	},
	{
		name: 'invoice',
		section: 'invoice',
		load: async () => {
			const mod = await import('./use-invoice')
			return { save: (id) => mod.patchInvoiceSection(id, { invoice: { payoutDelay: 21 } }) }
		},
	},
	{
		name: 'vehicle',
		section: 'vehicle',
		load: async () => {
			const mod = await import('./use-vehicle-info')
			return { save: (id) => mod.patchVehicleInfo(id, { vin: 'X' }) }
		},
	},
	{
		name: 'accident-info',
		section: 'accident-info',
		load: async () => {
			const mod = await import('./use-accident-info')
			return { save: (id) => mod.patchAccidentInfoSection(id, { accidentInfo: {} }) }
		},
	},
	{
		name: 'calculation',
		section: 'calculation',
		load: async () => {
			const mod = await import('./use-calculation')
			return { save: (id) => mod.patchCalculationSection(id, { calculation: { costPerDay: 5 } }) }
		},
	},
]

describe('section mutations register with the save barrier', () => {
	let release: (() => void) | null

	beforeEach(() => {
		resetSectionSaves()
		release = null
		vi.stubGlobal(
			'fetch',
			vi.fn(
				() =>
					new Promise((resolve) => {
						release = () =>
							resolve({ ok: true, json: () => Promise.resolve({}) } as unknown as Response)
					}),
			),
		)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		resetSectionSaves()
	})

	for (const { name, section, load } of SECTIONS) {
		it(`${name}: a read waits for a direct mutation`, async () => {
			const { save } = await load()
			const saving = save('report-123')

			expect(hasPendingSectionSave('report-123', section)).toBe(true)

			let readReleased = false
			const reader = awaitSectionSave('report-123', section).then(() => {
				readReleased = true
			})

			await Promise.resolve()
			expect(readReleased).toBe(false)

			release?.()
			await saving
			await reader

			expect(readReleased).toBe(true)
			expect(hasPendingSectionSave('report-123', section)).toBe(false)
		})
	}
})
