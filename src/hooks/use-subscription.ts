import { useQuery, useMutation } from '@tanstack/react-query'

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

export { useSubscription, useCreateCheckout, useCreatePortal, fetchSubscription, createCheckout, createPortal }
export type { SubscriptionStatus }
