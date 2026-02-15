import { getStripeClient } from './client'

const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

type SubscriptionInfo = {
	status: string
	trialEnd?: number
	planId: string
}

async function createCheckoutSession(userId: string, priceId: string, customerId?: string): Promise<string> {
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
			trial_period_days: 14,
			metadata: { userId },
		},
		metadata: { userId },
		success_url: `${APP_URL}/dashboard?payment=success`,
		cancel_url: `${APP_URL}/dashboard`,
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
		return_url: `${APP_URL}/settings`,
	})

	return session.url
}

async function getSubscription(customerId: string): Promise<SubscriptionInfo | null> {
	const stripe = getStripeClient()

	const subscriptions = await stripe.subscriptions.list({
		customer: customerId,
		status: 'all',
		limit: 1,
	})

	const sub = subscriptions.data[0]
	if (!sub) return null

	const priceId = sub.items.data[0]?.price?.id ?? ''

	return {
		status: sub.status,
		trialEnd: sub.trial_end ?? undefined,
		planId: priceId,
	}
}

function isProPlan(subscription: { planId: string } | null): boolean {
	if (!subscription) return false
	return subscription.planId === PRO_PRICE_ID
}

export { createCheckoutSession, createCustomerPortalSession, getSubscription, isProPlan }
export type { SubscriptionInfo }
