import type Stripe from 'stripe'
import { appUrl } from '@/lib/urls'
import { getStripeClient } from './client'

const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? ''

type SubscriptionInfo = {
	id: string
	status: Stripe.Subscription.Status
	planId: string
	currentPeriodStart: string | null
	currentPeriodEnd: string | null
	trialEnd: string | null
	cancelAtPeriodEnd: boolean
	cancelAt: string | null
}

/**
 * The statuses under which a customer has a subscription *right now*, most definite first.
 *
 * This is a display question, not an entitlement one — `User.plan` answers that, and this
 * module must never write it (ADR-0003). `past_due` belongs here because Stripe is still
 * retrying the card over roughly two weeks and the subscription is still standing: telling
 * such a customer they have none offers them "Zahlung einrichten" and walks them into a
 * second subscription alongside the one they already owe on.
 */
const CURRENT_STATUSES = [
	'active',
	'trialing',
	'past_due',
] as const satisfies readonly Stripe.Subscription.Status[]

function toIso(epochSeconds: number | null | undefined): string | null {
	return epochSeconds ? new Date(epochSeconds * 1000).toISOString() : null
}

async function createCheckoutSession(
	userId: string,
	priceId: string,
	customerId?: string,
	options?: { successUrl?: string; cancelUrl?: string },
): Promise<string> {
	const stripe = getStripeClient()

	const session = await stripe.checkout.sessions.create({
		mode: 'subscription',
		payment_method_types: ['card'],
		...(customerId ? { customer: customerId } : {}),
		line_items: [
			{
				price: priceId || PRO_PRICE_ID,
				quantity: 1,
			},
		],
		subscription_data: {
			trial_period_days: 7,
			metadata: { userId },
		},
		metadata: { userId },
		success_url: options?.successUrl ?? appUrl('/signup/complete?payment=success'),
		cancel_url: options?.cancelUrl ?? appUrl('/signup/complete?payment=cancelled'),
	})

	if (!session.url) {
		throw new Error('Failed to create checkout session URL')
	}

	return session.url
}

async function createCustomerPortalSession(customerId: string): Promise<string> {
	const stripe = getStripeClient()

	const session = await stripe.billingPortal.sessions.create({
		customer: customerId,
		return_url: appUrl('/settings/billing'),
	})

	return session.url
}

/**
 * The customer's current subscription as Stripe has it, or null.
 *
 * Asked of Stripe by customer rather than read back from `User.stripeSubscriptionId`:
 * that column has one writer, the webhook, and it was NULL for every account in the
 * September 2026 audit — which is how the billing page came to print "no active
 * subscription" directly above three paid invoices it had just fetched from Stripe.
 *
 * The statuses are tried in order rather than taking the newest of `status: 'all'`.
 * "Newest" and "current" coincide only for a customer who has never had two, which is
 * exactly how that reading breaks quietly; a customer whose only subscription is
 * cancelled has none, and is told so.
 */
async function getSubscription(customerId: string): Promise<SubscriptionInfo | null> {
	const stripe = getStripeClient()

	for (const status of CURRENT_STATUSES) {
		const subscriptions = await stripe.subscriptions.list({
			customer: customerId,
			status,
			limit: 1,
		})
		const sub = subscriptions.data[0]
		if (!sub) continue

		// Stripe v20 moved the billing period from the subscription onto its items.
		const item = sub.items?.data?.[0]

		return {
			id: sub.id,
			status: sub.status,
			planId: item?.price?.id ?? '',
			currentPeriodStart: toIso(item?.current_period_start),
			currentPeriodEnd: toIso(item?.current_period_end),
			trialEnd: toIso(sub.trial_end),
			cancelAtPeriodEnd: sub.cancel_at_period_end,
			cancelAt: toIso(sub.cancel_at),
		}
	}

	return null
}

function isProPlan(subscription: { planId: string } | null): boolean {
	if (!subscription) return false
	return subscription.planId === PRO_PRICE_ID
}

export type { SubscriptionInfo }
export { createCheckoutSession, createCustomerPortalSession, getSubscription, isProPlan }
