import { useMutation, useQuery } from '@tanstack/react-query'

type SubscriptionStatus = {
	plan: 'FREE' | 'PRO'
	trialEndsAt: string | null
	stripeCustomerId: string | null
	stripeSubscriptionId: string | null
}

async function fetchSubscription(): Promise<SubscriptionStatus> {
	const response = await fetch('/api/settings')
	if (!response.ok) {
		throw new Error('Failed to fetch subscription status')
	}
	const data = await response.json()
	return {
		// Fails closed: a body we cannot read is not an entitlement. ADR-0003.
		plan: data.plan ?? 'FREE',
		trialEndsAt: data.trialEndsAt ?? null,
		stripeCustomerId: data.stripeCustomerId ?? null,
		stripeSubscriptionId: data.stripeSubscriptionId ?? null,
	}
}

/**
 * How long we will wait for the Stripe webhook after a user returns from Checkout.
 *
 * Checkout redirects the moment the card clears; `customer.subscription.created` reaches
 * our webhook separately, normally within a second or two. Until it lands the account is
 * honestly lapsed — the webhook is the only writer of entitlement (ADR-0003) — so the
 * screen the user arrives on waits rather than telling a paying customer they have not
 * paid. The budget is finite on purpose: a webhook that never arrives is a state this
 * product has actually been in for a month, and the honest end of the wait is the lapsed
 * account, which the next paid action explains.
 */
const ENTITLEMENT_POLL_INTERVAL_MS = 750
const ENTITLEMENT_POLL_TIMEOUT_MS = 12_000

async function waitForEntitlement(options?: {
	timeoutMs?: number
	intervalMs?: number
}): Promise<boolean> {
	const intervalMs = options?.intervalMs ?? ENTITLEMENT_POLL_INTERVAL_MS
	const timeoutMs = options?.timeoutMs ?? ENTITLEMENT_POLL_TIMEOUT_MS
	const attempts = Math.max(1, Math.ceil(timeoutMs / intervalMs))

	for (let attempt = 0; attempt < attempts; attempt++) {
		if (attempt > 0) {
			await new Promise((resolve) => setTimeout(resolve, intervalMs))
		}
		try {
			const { plan } = await fetchSubscription()
			if (plan === 'PRO') return true
		} catch {
			// A settings read that failed is not an answer. Keep asking until the budget
			// runs out rather than reporting a network blip as a lapsed account.
		}
	}

	return false
}

async function createCheckout(): Promise<{ url: string }> {
	const response = await fetch('/api/stripe/checkout', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
	})
	if (!response.ok) {
		throw new Error('Failed to create checkout session')
	}
	return response.json()
}

async function createPortal(): Promise<{ url: string }> {
	const response = await fetch('/api/stripe/portal', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
	})
	if (!response.ok) {
		throw new Error('Failed to create portal session')
	}
	return response.json()
}

function useSubscription() {
	return useQuery({
		queryKey: ['subscription'],
		queryFn: fetchSubscription,
	})
}

function useCreateCheckout() {
	return useMutation({
		mutationFn: createCheckout,
		onSuccess: (data) => {
			window.location.href = data.url
		},
	})
}

function useCreatePortal() {
	return useMutation({
		mutationFn: createPortal,
		onSuccess: (data) => {
			window.location.href = data.url
		},
	})
}

type BillingInvoice = {
	id: string
	date: string | null
	amount: string
	currency: string
	status: string | null
	description: string
	invoicePdf: string | null
	hostedInvoiceUrl: string | null
}

type BillingPaymentMethod = {
	brand: string
	last4: string
	expMonth: number
	expYear: number
}

/** Mirrors what `GET /api/stripe/billing` reads off Stripe — see `SubscriptionInfo`. */
type BillingSubscription = {
	id: string
	status: string
	currentPeriodEnd: string | null
	currentPeriodStart: string | null
	trialEnd: string | null
	cancelAtPeriodEnd: boolean
	cancelAt: string | null
}

type BillingData = {
	plan: 'FREE' | 'PRO'
	trialEndsAt: string | null
	subscription: BillingSubscription | null
	paymentMethod: BillingPaymentMethod | null
	invoices: BillingInvoice[]
}

async function fetchBilling(): Promise<BillingData> {
	const response = await fetch('/api/stripe/billing')
	if (!response.ok) {
		throw new Error('Failed to fetch billing data')
	}
	return response.json()
}

function useBilling() {
	return useQuery({
		queryKey: ['billing'],
		queryFn: fetchBilling,
	})
}

export type {
	BillingData,
	BillingInvoice,
	BillingPaymentMethod,
	BillingSubscription,
	SubscriptionStatus,
}
export {
	createCheckout,
	createPortal,
	fetchBilling,
	fetchSubscription,
	useBilling,
	useCreateCheckout,
	useCreatePortal,
	useSubscription,
	waitForEntitlement,
}
