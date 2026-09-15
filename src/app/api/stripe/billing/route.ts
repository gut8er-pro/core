import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { prisma } from '@/lib/prisma'
import { getStripeClient } from '@/lib/stripe/client'
import { getSubscription } from '@/lib/stripe/subscription'

async function GET() {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const dbUser = await prisma.user.findUnique({
		where: { id: user?.id },
		select: {
			plan: true,
			stripeCustomerId: true,
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
		// Asked of Stripe by customer, not read back from `User.stripeSubscriptionId`. That
		// column is written only by the webhook, so while delivery was down it was NULL for
		// paying accounts and this page announced "Kein aktives Abonnement" above the very
		// invoices it fetched below. `plan` stays untouched here — ADR-0003.
		const subscription = await getSubscription(dbUser.stripeCustomerId)
		response.subscription = subscription

		// `trialEndsAt` is a cache of Stripe's `trial_end` and has no vote (CONTEXT.md), so
		// the moment the subscription itself is in hand it stops voting. It has the same
		// sole writer as the id above and was NULL for the same accounts; left to decide,
		// it shows a customer in the middle of their trial a renewal date instead of the
		// days they have left. With no subscription to defer to, the cache is all there is.
		if (subscription) {
			response.trialEndsAt = subscription.trialEnd
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
