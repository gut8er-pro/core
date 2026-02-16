'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Shield } from 'lucide-react'
import { useSignupStore } from '@/stores/signup-store'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/text-field'
import { cn } from '@/lib/utils'

const FREE_FEATURES = [
	{ text: 'Unlimited reports', included: true },
	{ text: 'Manual data entry', included: true },
	{ text: 'PDF export', included: true },
	{ text: 'Email support', included: true },
	{ text: 'No AI auto-fill', included: false },
	{ text: 'No image analysis', included: false },
]

const PRO_FEATURES = [
	{ text: 'Everything in Free', included: true },
	{ text: 'AI-powered auto-fill', included: true },
	{ text: 'Image damage analysis', included: true },
	{ text: 'VIN auto-detection', included: true },
	{ text: 'Priority support', included: true },
	{ text: 'Custom branding', included: true },
]

type PlanType = 'pro'

function PlanStep() {
	const router = useRouter()
	const { setPlan, completeStep, setCurrentStep } = useSignupStore()
	const [selectedPlan] = useState<PlanType>('pro')

	function handleContinue() {
		setPlan({ plan: selectedPlan })
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
			<h2 className="mb-1 text-h2 font-bold text-black">Choose your plan</h2>
			<p className="mb-8 text-body text-grey-100">
				Select the plan that works best for you.
			</p>

			{/* Plan cards side by side */}
			<div className="mb-6 grid grid-cols-2 gap-4">
				{/* Free plan */}
				<div className="relative rounded-xl border border-border p-5">
					<div className="absolute right-4 top-4">
						<div className="h-5 w-5 rounded-full border-2 border-grey-50" />
					</div>
					<div className="flex flex-col gap-3">
						<div>
							<h3 className="text-h4 font-semibold text-black">Free</h3>
							<p className="text-caption text-grey-100">For getting started</p>
						</div>
						<div>
							<span className="text-h2 font-bold text-black">€0</span>
							<span className="text-caption text-grey-100"> forever</span>
						</div>
						<ul className="flex flex-col gap-1">
							{FREE_FEATURES.map((f) => (
								<li key={f.text} className="flex items-center gap-1.5 text-caption">
									{f.included ? (
										<Check className="h-3.5 w-3.5 shrink-0 text-primary" />
									) : (
										<X className="h-3.5 w-3.5 shrink-0 text-grey-50" />
									)}
									<span className={f.included ? 'text-black' : 'text-grey-100'}>{f.text}</span>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Pro plan */}
				<div className="relative rounded-xl border-2 border-primary p-5">
					<div className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
						Most Popular
					</div>
					<div className="absolute right-4 top-4">
						<div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
							<Check className="h-3 w-3 text-white" />
						</div>
					</div>
					<div className="flex flex-col gap-3">
						<div>
							<h3 className="text-h4 font-semibold text-black">Pro</h3>
							<p className="text-caption text-grey-100">For professionals</p>
						</div>
						<div>
							<span className="text-h2 font-bold text-black">€49</span>
							<span className="text-caption text-grey-100"> /month</span>
							<p className="text-caption text-primary">14 days free</p>
						</div>
						<ul className="flex flex-col gap-1">
							{PRO_FEATURES.map((f) => (
								<li key={f.text} className="flex items-center gap-1.5 text-caption">
									<Check className="h-3.5 w-3.5 shrink-0 text-primary" />
									<span className="text-black">{f.text}</span>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>

			{/* Payment details */}
			<div className="rounded-xl border border-border p-6">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-h4 font-semibold text-black">Payment details</h3>
					<div className="flex items-center gap-1.5 text-caption text-grey-100">
						<span>Secured by</span>
						<span className="font-bold text-black">Stripe</span>
					</div>
				</div>

				<div className="flex flex-col gap-4">
					<TextField
						label="Card number"
						placeholder="1234 5678 9012 3456"
					/>
					<div className="grid grid-cols-2 gap-4">
						<TextField
							label="Expiry date"
							placeholder="MM/YY"
						/>
						<TextField
							label="CVC"
							placeholder="123"
						/>
					</div>
					<TextField
						label="Cardholder name"
						placeholder="Name on card"
					/>
				</div>

				<p className="mt-4 text-caption text-grey-100">
					You won't be charged until your 14-day trial ends. Cancel anytime.
				</p>
			</div>

			<div className="mt-6 flex items-center gap-4">
				<Button type="button" variant="outline" onClick={handleBack} className="flex-1">
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
