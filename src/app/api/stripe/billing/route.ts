import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { prisma } from '@/lib/prisma'
import { getStripeClient } from '@/lib/stripe/client'

async function GET() {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const dbUser = await prisma.user.findUnique({
		where: { id: user?.id },
		select: {
			plan: true,
			stripeCustomerId: true,
			stripeSubscriptionId: true,
			trialEndsAt: true,
		},
	})

	if (!dbUser) {
		return NextResponse.json({ error: 'User not found' }, { status: 404 })
	}

	// Default response when no Stripe data
	const response: Record<string, unknown> = {
		plan: dbUser.plan,
		trialEndsAt: dbUser.trialEndsAt?.toISOString() ?? null,
		subscription: null,
		paymentMethod: null,
		invoices: [],
	}

	if (!dbUser.stripeCustomerId || !process.env.STRIPE_SECRET_KEY) {
		return NextResponse.json(response)
	}

	const stripe = getStripeClient()

	try {
		// Fetch active subscription
		if (dbUser.stripeSubscriptionId) {
			const subscription = await stripe.subscriptions.retrieve(dbUser.stripeSubscriptionId)
			// In Stripe v20+, current_period is on the subscription item
			const item = subscription.items?.data?.[0]
			const periodEnd = item?.current_period_end
			const periodStart = item?.current_period_start
			response.subscription = {
				id: subscription.id,
				status: subscription.status,
				currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
				currentPeriodStart: periodStart ? new Date(periodStart * 1000).toISOString() : null,
				trialEnd: subscription.trial_end
					? new Date(subscription.trial_end * 1000).toISOString()
					: null,
				cancelAtPeriodEnd: subscription.cancel_at_period_end,
				cancelAt: subscription.cancel_at
					? new Date(subscription.cancel_at * 1000).toISOString()
					: null,
			}
		}

		// Fetch default payment method
		const customer = await stripe.customers.retrieve(dbUser.stripeCustomerId)
		if (!customer.deleted) {
			const defaultPmId =
				typeof customer.invoice_settings?.default_payment_method === 'string'
					? customer.invoice_settings.default_payment_method
					: customer.invoice_settings?.default_payment_method?.id

			if (defaultPmId) {
				const pm = await stripe.paymentMethods.retrieve(defaultPmId)
				if (pm.card) {
					response.paymentMethod = {
						brand: pm.card.brand,
						last4: pm.card.last4,
						expMonth: pm.card.exp_month,
						expYear: pm.card.exp_year,
					}
				}
			} else {
				// Try to get payment method from subscription
				const paymentMethods = await stripe.paymentMethods.list({
					customer: dbUser.stripeCustomerId,
					type: 'card',
					limit: 1,
				})
				const pm = paymentMethods.data[0]
				if (pm?.card) {
					response.paymentMethod = {
						brand: pm.card.brand,
						last4: pm.card.last4,
						expMonth: pm.card.exp_month,
						expYear: pm.card.exp_year,
					}
				}
			}
		}

		// Fetch recent invoices
		const invoices = await stripe.invoices.list({
			customer: dbUser.stripeCustomerId,
			limit: 12,
		})

		response.invoices = invoices.data
			.filter((inv) => inv.status !== 'draft')
			.map((inv) => ({
				id: inv.id,
				date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
				amount: inv.amount_paid != null ? (inv.amount_paid / 100).toFixed(2) : '0.00',
				currency: inv.currency?.toUpperCase() ?? 'EUR',
				status: inv.status,
				description: inv.lines?.data?.[0]?.description ?? 'Pro Plan',
				invoicePdf: inv.invoice_pdf ?? null,
				hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
			}))
	} catch (stripeError) {
		console.error('[billing API] Stripe error:', stripeError)
		// Return what we have — don't fail the entire request
	}

	return NextResponse.json(response)
}

export { GET }
