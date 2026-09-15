import { type NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripeClient } from '@/lib/stripe/client'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''

async function POST(request: NextRequest) {
	const body = await request.text()
	const signature = request.headers.get('stripe-signature')

	if (!signature) {
		return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
	}

	const stripe = getStripeClient()
	let event: Stripe.Event

	try {
		event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		console.error('Webhook signature verification failed:', message)
		return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
	}

	/**
	 * The subscription statuses that carry entitlement. Named as `ENTITLED_STATUSES` is in
	 * `scripts/reconcile-subscriptions.mjs`, which must hold the same list: the script is
	 * the only other thing allowed to write `plan`, and a disagreement between them lapses
	 * by hand the customer this keeps.
	 *
	 * `past_due` is one of them. Stripe retries a failed card over roughly two weeks and
	 * the subscription is still standing throughout; revoking on the first failure takes
	 * the product away from a customer who is about to pay, in a tool they bill their own
	 * clients from, and does it silently — there is no dunning mail. `customer.subscription.deleted`
	 * is what downgrades, once Stripe has given up. See ADR-0003.
	 */
	const ENTITLED_STATUSES: Stripe.Subscription.Status[] = ['active', 'trialing', 'past_due']

	try {
		switch (event.type) {
			case 'customer.subscription.created':
			case 'customer.subscription.updated': {
				const subscription = event.data.object as Stripe.Subscription
				const customerId = subscription.customer as string
				const isEntitled = ENTITLED_STATUSES.includes(subscription.status)

				await prisma.user.update({
					where: { stripeCustomerId: customerId },
					data: {
						plan: isEntitled ? 'PRO' : 'FREE',
						stripeSubscriptionId: subscription.id,
						trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
					},
				})
				break
			}

			case 'customer.subscription.deleted':
			case 'customer.subscription.paused': {
				const subscription = event.data.object as Stripe.Subscription
				const customerId = subscription.customer as string

				await prisma.user.update({
					where: { stripeCustomerId: customerId },
					data: {
						plan: 'FREE',
						stripeSubscriptionId: null,
						trialEndsAt: null,
					},
				})
				break
			}

			// There is deliberately no `invoice.payment_succeeded` branch. It used to write
			// `plan` and `stripeSubscriptionId` a second time on a new subscription, racing
			// the `customer.subscription.created` above for the same columns and adding no
			// coverage of its own. Per ADR-0003 there is one writer of entitlement.

			case 'invoice.payment_failed': {
				const invoice = event.data.object as Stripe.Invoice
				const customerId = invoice.customer as string

				// Reported, never acted on. This branch used to lapse the account on the
				// second failed attempt, which is the same hard line `past_due` above
				// rejects, reached by another route. When Stripe finishes retrying it
				// fires `customer.subscription.deleted`, and that is where we downgrade.
				console.error(
					`Payment failed for customer ${customerId}, invoice ${invoice.id} (attempt ${invoice.attempt_count})`,
				)
				break
			}

			default:
				// Unhandled event type — log but do not error
				console.log(`Unhandled Stripe event type: ${event.type}`)
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		console.error(`Error processing webhook event ${event.type}:`, message)
		// Return 200 anyway for "user row not found" so Stripe doesn't keep
		// retrying — only return 500 on genuine programming errors.
		if (message.includes('Record to update not found')) {
			return NextResponse.json({ received: true, warning: message })
		}
		return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
	}

	return NextResponse.json({ received: true })
}

export { POST }
