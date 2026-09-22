import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@/test/test-utils'
import CalculationPage from './page'

const photosResult = vi.hoisted(() => ({ current: { photos: [] as Array<{ id: string }> } }))
const autoFillFetch = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
	useParams: () => ({ id: 'report-1' }),
}))

vi.mock('@/hooks/use-photos', () => ({
	usePhotos: () => ({ data: photosResult.current }),
}))

vi.mock('@/hooks/use-reports', () => ({
	useReport: () => ({ data: { id: 'report-1', reportType: 'HS', isLocked: false } }),
}))

vi.mock('@/hooks/use-settings', () => ({
	useUserSettings: () => ({ data: { integrations: [] } }),
}))

vi.mock('@/hooks/use-calculation', () => ({
	useCalculation: () => ({ data: { calculation: null, additionalCosts: [] }, isLoading: false }),
	useSaveCalculation: () => ({ mutate: vi.fn() }),
	fetchCalculation: vi.fn(() => Promise.resolve({ calculation: null, additionalCosts: [] })),
}))

vi.mock('@/hooks/use-auto-save', () => ({
	useAutoSave: () => ({
		saveField: vi.fn(),
		saveFields: vi.fn(),
		flushNow: vi.fn(),
		state: { status: 'idle', error: null },
	}),
}))

vi.mock('@/hooks/use-subscription-notice', () => ({
	useSubscriptionNotice: () => ({ message: 'subscription', notify: vi.fn() }),
}))

/**
 * The AI card's photo guard. `usePhotos` resolves to `{ photos: Photo[] }`, not
 * an array — reading `.length` off the wrapper would make the guard
 * unreachable and fire an AI run against a report with nothing to analyse.
 */
describe('CalculationPage — AI correction photo guard', () => {
	function clickAiCard() {
		fireEvent.click(screen.getByRole('button', { name: /AI Calculation/i }))
	}

	it('blocks the AI run and explains why when the report has no photos', async () => {
		photosResult.current = { photos: [] }
		vi.stubGlobal('fetch', autoFillFetch)
		autoFillFetch.mockClear()

		render(<CalculationPage />)
		clickAiCard()

		await waitFor(() => {
			expect(screen.getAllByText(/Upload photos of the damage first/i).length).toBeGreaterThan(0)
		})
		expect(autoFillFetch).not.toHaveBeenCalled()

		vi.unstubAllGlobals()
	})

	it('runs the AI when the report has photos', async () => {
		photosResult.current = { photos: [{ id: 'photo-1' }] }
		autoFillFetch.mockClear()
		autoFillFetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: () => Promise.resolve({ fieldsUpdated: [] }),
		})
		vi.stubGlobal('fetch', autoFillFetch)

		render(<CalculationPage />)
		clickAiCard()

		await waitFor(() => {
			expect(autoFillFetch).toHaveBeenCalledWith(
				'/api/reports/report-1/calculation/auto-fill',
				expect.objectContaining({ method: 'POST' }),
			)
		})
		expect(screen.queryAllByText(/Upload photos of the damage first/i)).toHaveLength(0)

		vi.unstubAllGlobals()
	})
})
