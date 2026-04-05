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
		plan: data.plan ?? 'PRO',
		trialEndsAt: data.trialEndsAt ?? null,
		stripeCustomerId: data.stripeCustomerId ?? null,
		stripeSubscriptionId: data.stripeSubscriptionId ?? null,
	}
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

type BillingSubscription = {
	id: string
	status: string
	currentPeriodEnd: string
	currentPeriodStart: string
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
}
