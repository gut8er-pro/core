import { renderHook, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The screen Stripe Checkout lands on. Its whole job is to not tell a customer who has
 * just paid that they have not paid — see `waitForEntitlement` for why that window
 * exists at all.
 */

const invalidateQueries = vi.fn()
const waitForEntitlement = vi.fn()

// Deliberately a fresh object per call, as an unstable dependency would be: the wait is
// one-shot, and a re-render must not restart it into a URL whose param is already gone.
vi.mock('@tanstack/react-query', () => ({
	useQueryClient: () => ({ invalidateQueries }),
}))
vi.mock('./use-subscription', () => ({
	waitForEntitlement: (...args: unknown[]) => waitForEntitlement(...args),
}))

const { useCheckoutReturn } = await import('./use-checkout-return')

function arriveAt(url: string) {
	window.history.replaceState(null, '', url)
}

beforeEach(() => {
	vi.clearAllMocks()
	waitForEntitlement.mockResolvedValue(true)
})

describe('useCheckoutReturn', () => {
	it('does nothing on an ordinary visit to the dashboard', () => {
		arriveAt('/')

		const { result } = renderHook(() => useCheckoutReturn())

		expect(result.current).toBe(false)
		expect(waitForEntitlement).not.toHaveBeenCalled()
	})

	// The param is a hint about timing from Stripe's redirect, and anyone can type it.
	// It must never be read as entitlement — it only decides whether to wait.
	it('waits for the webhook when Checkout has just redirected back', async () => {
		arriveAt(`/?payment=success`)
		let resolve: (value: boolean) => void = () => {}
		waitForEntitlement.mockReturnValue(
			new Promise<boolean>((r) => {
				resolve = r
			}),
		)

		const { result } = renderHook(() => useCheckoutReturn())

		await waitFor(() => expect(result.current).toBe(true))
		resolve(true)
		await waitFor(() => expect(result.current).toBe(false))
		expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['settings'] })
	})

	it('clears the param so a refresh mid-wait does not start the clock again', async () => {
		arriveAt(`/?payment=success&new-report=1`)

		renderHook(() => useCheckoutReturn())

		await waitFor(() => expect(window.location.search).toBe('?new-report=1'))
	})

	/**
	 * Next runs the app in StrictMode in development, which mounts, tears down, and
	 * mounts again. The effect must survive that: it clears the param before it starts
	 * waiting, so a second run finds nothing to do — and if the first run's answer were
	 * discarded along with it, the button would sit on "Abonnement wird aktiviert …" for
	 * ever, which is a worse lie than the flicker this exists to prevent.
	 */
	it('survives the double mount React StrictMode performs', async () => {
		arriveAt(`/?payment=success`)

		const { result } = renderHook(() => useCheckoutReturn(), { wrapper: StrictMode })

		await waitFor(() => expect(result.current).toBe(false))
		expect(waitForEntitlement).toHaveBeenCalledTimes(1)
		expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['settings'] })
	})

	// A webhook that never arrives is a state this product has actually been in. The wait
	// ends either way, and the account is then whatever it honestly is.
	it('stops waiting when the webhook never lands', async () => {
		arriveAt(`/?payment=success`)
		waitForEntitlement.mockResolvedValue(false)

		const { result } = renderHook(() => useCheckoutReturn())

		await waitFor(() => expect(result.current).toBe(false))
		expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['settings'] })
	})
})
