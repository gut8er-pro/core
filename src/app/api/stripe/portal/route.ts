import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { prisma } from '@/lib/prisma'
import { createCustomerPortalSession } from '@/lib/stripe/subscription'

async function POST() {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const dbUser = await prisma.user.findUnique({
		where: { id: user!.id },
		select: { stripeCustomerId: true },
	})

	if (!dbUser?.stripeCustomerId) {
		return NextResponse.json(
			{ error: 'No Stripe customer found. Please subscribe first.' },
			{ status: 400 },
		)
	}

	const url = await createCustomerPortalSession(dbUser.stripeCustomerId)

	return NextResponse.json({ url })
}

export { POST }
