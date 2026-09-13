import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

type AuthError = 'Unauthorized' | 'PaymentRequired'

async function getAuthenticatedUser() {
	const supabase = await createClient()
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser()

	if (error || !user) {
		return { user: null, error: 'Unauthorized' as const }
	}

	return { user, error: null }
}

/**
 * Authentication *and* entitlement, for the actions a subscription pays for.
 *
 * The product rule: a subscription buys the ability to *create* reports and to use the
 * AI features. It does not gate access to work the user has already produced — when a
 * subscription lapses they keep their account, their reports, their PDFs and their
 * invoice history, and can still read, edit, export and send them. Only `POST /api/reports`
 * and the AI routes call this; everything else stays on `getAuthenticatedUser`.
 *
 * `plan` is the entitlement flag: the Stripe webhook is its only writer after signup and
 * already encodes the nuance (`past_due` is not entitled, a cancelled or paused
 * subscription downgrades to FREE). So this asks the one question, and the billing rules
 * stay in the webhook rather than being restated here.
 */
async function getEntitledUser() {
	const { user, error } = await getAuthenticatedUser()
	if (error || !user) {
		return { user: null, error }
	}

	const dbUser = await prisma.user.findUnique({
		where: { id: user.id },
		select: { plan: true },
	})

	if (dbUser?.plan !== 'PRO') {
		return { user: null, error: 'PaymentRequired' as const }
	}

	return { user, error: null }
}

function unauthorizedResponse() {
	return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function paymentRequiredResponse() {
	return NextResponse.json({ error: 'Subscription required' }, { status: 402 })
}

function authErrorResponse(error: AuthError | null) {
	return error === 'PaymentRequired' ? paymentRequiredResponse() : unauthorizedResponse()
}

export type { AuthError }
export {
	authErrorResponse,
	getAuthenticatedUser,
	getEntitledUser,
	paymentRequiredResponse,
	unauthorizedResponse,
}
