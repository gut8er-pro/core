'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { consumeQueryParam, PAYMENT_PARAM, PAYMENT_SUCCESS } from '@/lib/navigation'
import { waitForEntitlement } from './use-subscription'

/**
 * True while this page is waiting for the Stripe webhook to catch up with a Checkout
 * the user has just completed.
 *
 * Checkout redirects as soon as the card clears; entitlement is written separately, by
 * the webhook, which is its only writer (ADR-0003). For the second or two in between a
 * paying customer is genuinely lapsed in our database, and a screen that read `plan`
 * straight away would tell them so — refusing the first report of a subscription they
 * have just bought. The fix is to wait here, not to grant entitlement early: that is the
 * hole `completeSignup` used to leave open, where abandoning Checkout bought the product.
 *
 * Reads the param off `location` rather than `useSearchParams` so the caller does not
 * need a Suspense boundary, and clears it afterwards so a refresh does not wait again.
 */
function useCheckoutReturn(): boolean {
	const queryClient = useQueryClient()
	const [isAwaitingEntitlement, setIsAwaitingEntitlement] = useState(false)

	/**
	 * The wait happens once per arrival, and both of these exist to keep it that way.
	 *
	 * Reading the param consumes it, so the effect is not repeatable — a second run finds
	 * nothing and would have to be a no-op anyway. It gets two: React StrictMode mounts,
	 * tears down and mounts again in development, and a re-render would restart it too if
	 * the query client were named as a dependency. Neither may discard the answer the
	 * first run is waiting for; that would leave the button spinning for ever, a worse
	 * lie than the flicker this exists to prevent. So: a ref to start once, no cleanup
	 * that cancels, and a client held rather than depended on. Settling state after an
	 * unmount is a no-op in React 18+, which is what makes dropping the cleanup safe.
	 */
	const hasStartedRef = useRef(false)
	const queryClientRef = useRef(queryClient)
	queryClientRef.current = queryClient

	useEffect(() => {
		if (hasStartedRef.current) return

		// Consumes the param: a refresh mid-wait should show the account as it actually
		// is rather than start the clock again.
		if (consumeQueryParam(PAYMENT_PARAM) !== PAYMENT_SUCCESS) return

		hasStartedRef.current = true
		setIsAwaitingEntitlement(true)

		waitForEntitlement().finally(() => {
			setIsAwaitingEntitlement(false)
			// Whether the webhook landed or the budget ran out, everything reading `plan`
			// should now read it again rather than sit on what it fetched on arrival.
			queryClientRef.current.invalidateQueries({ queryKey: ['settings'] })
			queryClientRef.current.invalidateQueries({ queryKey: ['subscription'] })
		})
	}, [])

	return isAwaitingEntitlement
}

export { useCheckoutReturn }
