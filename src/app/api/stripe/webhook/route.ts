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

	// Subscription statuses where the user gets PRO access.
	// `past_due` is intentionally excluded — Stripe is still retrying the card
	// and the user should lose access until the invoice clears.
	const ACTIVE_STATUSES: Stripe.Subscription.Status[] = ['active', 'trialing']

	try {
		switch (event.type) {
			case 'customer.subscription.created':
			case 'customer.subscription.updated': {
				const subscription = event.data.object as Stripe.Subscription
				const customerId = subscription.customer as string
				const isActive = ACTIVE_STATUSES.includes(subscription.status)

				await prisma.user.update({
					where: { stripeCustomerId: customerId },
					data: {
						plan: isActive ? 'PRO' : 'FREE',
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

			case 'invoice.payment_succeeded': {
				const invoice = event.data.object as Stripe.Invoice
				const customerId = invoice.customer as string

				if (invoice.billing_reason === 'subscription_create') {
					const subscriptionId =
						(invoice as unknown as { subscription?: string }).subscription ?? null

					await prisma.user.update({
						where: { stripeCustomerId: customerId },
						data: {
							plan: 'PRO',
							stripeSubscriptionId: subscriptionId,
						},
					})
				}
				break
			}

			case 'invoice.payment_failed': {
				const invoice = event.data.object as Stripe.Invoice
				const customerId = invoice.customer as string

				// After all retries fail Stripe will fire subscription.deleted, which is
				// where we downgrade. But for the user's first failed retry attempt
				// after the trial we revoke access immediately — they should not
				// keep generating reports while we're chasing payment.
				if (invoice.billing_reason === 'subscription_cycle' && invoice.attempt_count >= 2) {
					await prisma.user.update({
						where: { stripeCustomerId: customerId },
						data: { plan: 'FREE' },
					})
				}
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
