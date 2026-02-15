import { NextResponse, type NextRequest } from 'next/server'
import { getStripeClient } from '@/lib/stripe/client'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''

async function POST(request: NextRequest) {
	const body = await request.text()
	const signature = request.headers.get('stripe-signature')

	if (!signature) {
		return NextResponse.json(
			{ error: 'Missing stripe-signature header' },
			{ status: 400 },
		)
	}

	const stripe = getStripeClient()
	let event: Stripe.Event

	try {
		event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		console.error('Webhook signature verification failed:', message)
		return NextResponse.json(
			{ error: 'Invalid signature' },
			{ status: 400 },
		)
	}

	try {
		switch (event.type) {
			case 'customer.subscription.created':
			case 'customer.subscription.updated': {
				const subscription = event.data.object as Stripe.Subscription
				const customerId = subscription.customer as string
				const status = subscription.status
				const priceId = subscription.items.data[0]?.price?.id ?? ''
				const isActive = status === 'active' || status === 'trialing'

				await prisma.user.update({
					where: { stripeCustomerId: customerId },
					data: {
						plan: 'PRO',
						stripeSubscriptionId: subscription.id,
						trialEndsAt: subscription.trial_end
							? new Date(subscription.trial_end * 1000)
							: null,
					},
				})
				break
			}

			case 'customer.subscription.deleted': {
				const subscription = event.data.object as Stripe.Subscription
				const customerId = subscription.customer as string

				await prisma.user.update({
					where: { stripeCustomerId: customerId },
					data: {
						plan: 'PRO',
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
					const subscriptionId = (invoice as unknown as { subscription?: string }).subscription ?? null

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

				console.error(
					`Payment failed for customer ${customerId}, invoice ${invoice.id}`,
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
		return NextResponse.json(
			{ error: 'Webhook handler failed' },
			{ status: 500 },
		)
	}

	return NextResponse.json({ received: true })
}

export { POST }
