'use client'

import { useRouter } from 'next/navigation'
import { Check, Shield, CreditCard } from 'lucide-react'
import { useSignupStore } from '@/stores/signup-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const PRO_FEATURES = [
	{ text: 'Unlimited reports', included: true },
	{ text: 'AI-powered auto-fill', included: true },
	{ text: 'Image damage analysis', included: true },
	{ text: 'VIN auto-detection', included: true },
	{ text: 'PDF export & email', included: true },
	{ text: 'Priority support', included: true },
	{ text: 'Custom branding', included: true },
]

function PlanStep() {
	const router = useRouter()
	const { setPlan, completeStep, setCurrentStep } = useSignupStore()

	function handleContinue() {
		setPlan({ plan: 'pro' })
		completeStep(4)
		setCurrentStep(5)
		router.push('/signup/integrations')
	}

	function handleBack() {
		setCurrentStep(3)
		router.push('/signup/business')
	}

	return (
		<div>
			<h2 className="mb-1 text-h2 font-bold text-black">Your plan</h2>
			<p className="mb-8 text-body text-grey-100">
				All features included with a 14-day free trial.
			</p>

			<Card
				variant="selected"
				padding="lg"
				className="relative"
			>
				<div className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-caption font-semibold uppercase text-white">
					14 Days Free
				</div>

				<div className="flex flex-col gap-4">
					<div>
						<h3 className="text-h4 font-semibold text-black">Pro</h3>
						<p className="text-body-sm text-grey-100">Full access to all features</p>
					</div>

					<div>
						<span className="text-h1 font-bold text-black">€49</span>
						<span className="text-body-sm text-grey-100">/month</span>
						<p className="text-caption text-primary">14 days free trial</p>
					</div>

					<ul className="flex flex-col gap-1">
						{PRO_FEATURES.map((feature) => (
							<li key={feature.text} className="flex items-center gap-1 text-body-sm">
								<Check className="h-4 w-4 shrink-0 text-primary" />
								<span className="text-black">{feature.text}</span>
							</li>
						))}
					</ul>
				</div>
			</Card>

			<div className="mt-6 rounded-lg border border-primary/30 bg-primary-light p-6">
				<div className="mb-3 flex items-center gap-2">
					<CreditCard className="h-5 w-5 text-primary" />
					<h3 className="text-h4 font-semibold text-black">14-day free trial</h3>
				</div>
				<p className="mb-2 text-body-sm text-grey-200">
					After creating your account, you'll be redirected to Stripe's secure checkout to set up your payment method.
				</p>
				<p className="mb-3 text-body-sm text-grey-200">
					You won't be charged until your 14-day trial ends. Cancel anytime.
				</p>
				<div className="flex items-center gap-1.5 text-caption text-grey-100">
					<Shield className="h-3.5 w-3.5" />
					<span>Payments secured by Stripe</span>
				</div>
			</div>

			<div className="mt-6 flex items-center gap-4">
				<Button type="button" variant="ghost" onClick={handleBack}>
					Back
				</Button>
				<Button type="button" onClick={handleContinue} className="flex-1">
					Continue
				</Button>
			</div>
		</div>
	)
}

export { PlanStep }
