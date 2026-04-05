import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { prisma } from '@/lib/prisma'
import { getStripeClient } from '@/lib/stripe/client'
import { createCheckoutSession } from '@/lib/stripe/subscription'

async function POST() {
	if (!process.env.STRIPE_SECRET_KEY) {
		return NextResponse.json(
			{
				error:
					'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.',
			},
			{ status: 503 },
		)
	}

	const { user, error } = await getAuthenticatedUser()
	if (error || !user) return unauthorizedResponse()

	const dbUser = await prisma.user.findUnique({
		where: { id: user.id },
		select: { stripeCustomerId: true, email: true },
	})

	if (!dbUser) {
		return NextResponse.json({ error: 'User not found' }, { status: 404 })
	}

	let customerId = dbUser.stripeCustomerId

	// Create Stripe customer if not exists
	if (!customerId) {
		const stripe = getStripeClient()
		const customer = await stripe.customers.create({
			email: dbUser.email ?? user.email ?? undefined,
			metadata: { userId: user.id },
		})
		customerId = customer.id

		await prisma.user.update({
			where: { id: user.id },
			data: { stripeCustomerId: customerId },
		})
	}

	const priceId = process.env.STRIPE_PRO_PRICE_ID ?? ''
	const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
	const url = await createCheckoutSession(user.id ?? '', priceId, customerId, {
		successUrl: `${appUrl}/dashboard?payment=success`,
		cancelUrl: `${appUrl}/settings/billing`,
	})

	return NextResponse.json({ url })
}

export { POST }
