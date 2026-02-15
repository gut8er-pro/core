'use client'

/**
 * Stripe Elements provider wrapper.
 *
 * NOTE: This module is a forward-looking placeholder. The actual
 * `@stripe/react-stripe-js` and `@stripe/stripe-js` packages are NOT
 * installed yet. Once they are added the `StripeProvider` component
 * below can wrap any page that needs Stripe Elements (e.g. a future
 * inline card form).
 *
 * For now, card collection during signup is handled visually with
 * standard TextField inputs. Real payment processing happens
 * post-signup via the Stripe Checkout session created in
 * `/api/stripe/checkout`.
 */

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

/**
 * Placeholder — will initialize Stripe.js once `@stripe/stripe-js` is
 * installed.  Usage:
 *
 * ```ts
 * import { loadStripe } from '@stripe/stripe-js'
 * const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
 * ```
 */
function getStripePublishableKey(): string {
	return STRIPE_PUBLISHABLE_KEY
}

/**
 * Placeholder provider component.
 *
 * Once `@stripe/react-stripe-js` is installed, replace the children
 * pass-through with:
 *
 * ```tsx
 * import { Elements } from '@stripe/react-stripe-js'
 * import { loadStripe } from '@stripe/stripe-js'
 *
 * const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
 *
 * function StripeProvider({ children }: { children: React.ReactNode }) {
 *   return <Elements stripe={stripePromise}>{children}</Elements>
 * }
 * ```
 */
function StripeProvider({ children }: { children: React.ReactNode }) {
	return <>{children}</>
}

export { StripeProvider, getStripePublishableKey }
