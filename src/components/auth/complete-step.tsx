'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { CheckCircle2, FileText, Sparkles, Settings, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const QUICK_START_CARDS = [
	{
		icon: FileText,
		title: 'Create Report',
		description: 'Start your first assessment',
	},
	{
		icon: Sparkles,
		title: 'Enjoy AI',
		description: 'Learn from tooltips',
	},
	{
		icon: Settings,
		title: 'Settings',
		description: 'Customize your workspace',
	},
]

function CompleteStep() {
	const router = useRouter()
	const searchParams = useSearchParams()

	const email = searchParams.get('email')

	const [isRedirecting, setIsRedirecting] = useState(false)
	const [stripeError, setStripeError] = useState<string | null>(null)

	async function handleSetupPayment() {
		setIsRedirecting(true)
		setStripeError(null)
		try {
			const res = await fetch('/api/stripe/checkout', { method: 'POST' })
			const data = await res.json()
			if (!res.ok || !data.url) {
				setStripeError(data.error || 'Failed to start payment setup. Please try again.')
				setIsRedirecting(false)
				return
			}
			window.location.href = data.url
		} catch {
			setStripeError('Failed to connect to payment provider. Please try again.')
			setIsRedirecting(false)
		}
	}

	function handleSkipPayment() {
		router.push('/dashboard')
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-6 py-8">
			<div className="w-full max-w-xl text-center">
				<div className="mb-6 flex justify-center">
					<div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-light">
						<CheckCircle2 className="h-12 w-12 text-primary" />
					</div>
				</div>

				<h1 className="mb-1 text-h1 font-bold text-black">Welcome aboard!</h1>
				<p className="mb-4 text-body text-grey-100">
					Your account has been created successfully.
				</p>

				<div className="mb-6 inline-flex items-center gap-1 rounded-full border border-primary bg-primary-light px-4 py-1">
					<Sparkles className="h-4 w-4 text-primary" />
					<span className="text-body-sm font-semibold text-primary">Pro Plan — 14-day trial</span>
				</div>

				<div className="mb-8 rounded-lg border border-primary/30 bg-primary-light p-6 text-left">
					<div className="mb-3 flex items-center gap-2">
						<CreditCard className="h-5 w-5 text-primary" />
						<h3 className="text-h4 font-semibold text-black">Set up your payment</h3>
					</div>
					<p className="mb-4 text-body-sm text-grey-200">
						Complete your Pro subscription setup via Stripe's secure checkout. Your 14-day free trial starts immediately — you won't be charged until it ends.
					</p>

					{stripeError && (
						<p className="mb-4 rounded-md bg-error-light px-3 py-2 text-body-sm text-error">
							{stripeError}
						</p>
					)}

					<div className="flex items-center gap-3">
						<Button
							type="button"
							onClick={handleSetupPayment}
							loading={isRedirecting}
							className="flex-1"
						>
							<CreditCard className="mr-2 h-4 w-4" />
							Set up payment
						</Button>
						<Button
							type="button"
							variant="ghost"
							onClick={handleSkipPayment}
							disabled={isRedirecting}
						>
							Skip for now
						</Button>
					</div>
					<p className="mt-3 text-caption text-grey-100">
						You can set up payment later in Settings.
					</p>
				</div>

				<div className="mb-8 grid grid-cols-3 gap-4">
					{QUICK_START_CARDS.map((card) => (
						<Card key={card.title} variant="selectable" padding="md">
							<div className="flex flex-col items-center gap-2 text-center">
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-light">
									<card.icon className="h-6 w-6 text-primary" />
								</div>
								<div>
									<p className="text-body-sm font-semibold text-black">{card.title}</p>
									<p className="text-caption text-grey-100">{card.description}</p>
								</div>
							</div>
						</Card>
					))}
				</div>

				{email && (
					<p className="text-caption text-grey-100">
						We've sent a confirmation email to{' '}
						<span className="font-semibold text-black">{email}</span>
					</p>
				)}
			</div>
		</div>
	)
}

export { CompleteStep }
