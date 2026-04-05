'use client'

import { Check, CreditCard, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSignupStore } from '@/stores/signup-store'

const PRO_FEATURES = [
	{ text: 'Unlimited reports' },
	{ text: 'AI-powered auto-fill' },
	{ text: 'Image damage analysis' },
	{ text: 'VIN auto-detection' },
	{ text: 'Priority support' },
	{ text: 'Custom branding' },
	{ text: 'PDF export' },
	{ text: 'Email support' },
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
		<div className="flex flex-col gap-8">
			{/* Header */}
			<div className="flex flex-col gap-3.5">
				<h2 className="text-[44px] font-medium leading-none text-black">Your plan</h2>
				<p className="text-[18px] leading-snug tracking-[0.18px] text-black/70">
					All features included with a 7-day free trial.
				</p>
			</div>

			{/* Pro plan card */}
			<div className="relative">
				<div
					className={cn(
						'relative flex w-full flex-col gap-5 rounded-[24px] border-2 border-primary p-6',
					)}
				>
					{/* Header row */}
					<div className="flex items-start justify-between">
						<div className="flex flex-col gap-1">
							<h3 className="text-[23px] font-medium text-black">Pro</h3>
							<p className="text-[16px] text-black/70">For professionals</p>
						</div>
						{/* Active indicator */}
						<div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-primary">
							<Check className="h-3.5 w-3.5 text-white" />
						</div>
					</div>

					{/* Price */}
					<div className="flex flex-col gap-0.5">
						<div className="flex items-baseline gap-1.5">
							<span className="text-[35px] font-medium leading-none text-black">&euro;69</span>
							<span className="text-[16px] text-black/70">/month</span>
						</div>
						<p className="text-[14px] font-medium text-primary/70">7 days free</p>
					</div>

					{/* Features */}
					<ul className="grid grid-cols-2 gap-x-6 gap-y-[7px]">
						{PRO_FEATURES.map((f) => (
							<li key={f.text} className="flex items-center gap-2">
								<Check className="h-3.5 w-3.5 shrink-0 text-primary" />
								<span className="text-[16px] text-black">{f.text}</span>
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* Payment info note */}
			<div className="flex flex-col gap-4 rounded-[15px] bg-[#f3f4f6] p-6">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
						<CreditCard className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h3 className="text-[18px] font-medium text-black">Payment details</h3>
						<p className="text-[14px] text-black/70">
							You&apos;ll enter your card on the secure Stripe checkout page after creating your
							account.
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2 text-[14px] text-grey-100">
					<Shield className="h-4 w-4" />
					<span>You won&apos;t be charged until your 7-day trial ends. Cancel anytime.</span>
				</div>
			</div>

			{/* Navigation buttons */}
			<div className="flex gap-3.5">
				<button
					type="button"
					onClick={handleBack}
					className="flex h-[58px] flex-1 items-center justify-center rounded-[15px] border border-[#e5e7eb] bg-white px-[30px] text-[18px] font-medium text-black transition-colors hover:bg-grey-25"
				>
					Back
				</button>
				<button
					type="button"
					onClick={handleContinue}
					className="flex h-[58px] flex-1 items-center justify-center rounded-[15px] bg-primary px-[30px] text-[18px] font-medium text-white transition-colors hover:bg-primary-hover"
				>
					Continue
				</button>
			</div>
		</div>
	)
}

export { PlanStep }
