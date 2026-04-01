'use client'

import { Check, CreditCard, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useSignupStore } from '@/stores/signup-store'

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

type PlanType = 'free' | 'pro'

function formatCardNumber(value: string) {
	const digits = value.replace(/\D/g, '').slice(0, 16)
	return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value: string) {
	const digits = value.replace(/\D/g, '').slice(0, 4)
	if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
	return digits
}

function PlanStep() {
	const router = useRouter()
	const { setPlan, completeStep, setCurrentStep } = useSignupStore()
	const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro')
	const [cardNumber, setCardNumber] = useState('')
	const [expiry, setExpiry] = useState('')
	const [cvc, setCvc] = useState('')
	const [cardholderName, setCardholderName] = useState('')

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
				<h2 className="text-[44px] font-medium leading-none text-black">Choose your plan</h2>
				<p className="text-[18px] leading-snug tracking-[0.18px] text-black/70">
					Select the plan that works best for you.
				</p>
			</div>

			{/* Plan cards */}
			<div className="grid grid-cols-2 gap-3">
				{/* Free plan */}
				<button
					type="button"
					onClick={() => setSelectedPlan('free')}
					className={cn(
						'relative flex flex-col gap-4 rounded-[24px] border-2 p-6 text-left transition-colors',
						selectedPlan === 'free' ? 'border-primary' : 'border-[#e5e7eb]',
					)}
				>
					{/* Radio */}
					<div className="absolute right-5 top-5">
						<div
							className={cn(
								'flex h-6 w-6 items-center justify-center rounded-full border-2',
								selectedPlan === 'free' ? 'border-primary bg-primary' : 'border-[#e5e7eb] bg-white',
							)}
						>
							{selectedPlan === 'free' && <Check className="h-3.5 w-3.5 text-white" />}
						</div>
					</div>

					<div className="flex flex-col gap-1">
						<h3 className="text-[23px] font-medium text-black">Free</h3>
						<p className="text-[16px] text-black/70">For getting started</p>
					</div>

					<div className="flex flex-col gap-0.5">
						<div className="flex items-baseline gap-1.5">
							<span className="text-[35px] font-medium leading-none text-black">€0</span>
							<span className="text-[16px] text-black/70">forever</span>
						</div>
					</div>

					<ul className="flex flex-col gap-[7px]">
						{FREE_FEATURES.map((f) => (
							<li key={f.text} className="flex items-center gap-2">
								{f.included ? (
									<Check className="h-3.5 w-3.5 shrink-0 text-primary" />
								) : (
									<X className="h-3.5 w-3.5 shrink-0 text-black/30" />
								)}
								<span className={cn('text-[16px]', f.included ? 'text-black' : 'text-black/45')}>
									{f.text}
								</span>
							</li>
						))}
					</ul>
				</button>

				{/* Pro plan */}
				<div className="relative">
					{/* Most Popular badge — centered on top border */}
					<div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-1000">
						<span className="rounded-[15px] bg-primary px-3.5 py-1.5 text-[14px] font-medium uppercase text-white">
							Most Popular
						</span>
					</div>

					<button
						type="button"
						onClick={() => setSelectedPlan('pro')}
						className={cn(
							'relative flex w-full flex-col gap-4 rounded-[24px] border-2 p-6 text-left transition-colors',
							selectedPlan === 'pro' ? 'border-primary' : 'border-[#e5e7eb]',
						)}
					>
						{/* Radio */}
						<div className="absolute right-5 top-5">
							<div
								className={cn(
									'flex h-6 w-6 items-center justify-center rounded-full border-2',
									selectedPlan === 'pro'
										? 'border-primary bg-primary'
										: 'border-[#e5e7eb] bg-white',
								)}
							>
								{selectedPlan === 'pro' && <Check className="h-3.5 w-3.5 text-white" />}
							</div>
						</div>

						<div className="flex flex-col gap-1">
							<h3 className="text-[23px] font-medium text-black">Pro</h3>
							<p className="text-[16px] text-black/70">For professionals</p>
						</div>

						<div className="flex flex-col gap-0.5">
							<div className="flex items-baseline gap-1.5">
								<span className="text-[35px] font-medium leading-none text-black">€49</span>
								<span className="text-[16px] text-black/70">/month</span>
							</div>
							<p className="text-[14px] font-medium text-primary/70">14 days free</p>
						</div>

						<ul className="flex flex-col gap-[7px]">
							{PRO_FEATURES.map((f) => (
								<li key={f.text} className="flex items-center gap-2">
									<Check className="h-3.5 w-3.5 shrink-0 text-primary" />
									<span className="text-[16px] text-black">{f.text}</span>
								</li>
							))}
						</ul>
					</button>
				</div>
			</div>

			{/* Payment details */}
			<div className="flex flex-col gap-5 rounded-[15px] bg-[#f3f4f6] p-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<h3 className="text-[23px] font-medium text-black">Payment details</h3>
					<p className="text-[16px] text-black/70">
						Secured by <span className="font-medium text-black">Stripe</span>
					</p>
				</div>

				{/* Card number */}
				<div className="flex flex-col gap-3">
					<label className="text-[16px] font-medium text-black">Card number</label>
					<div className="relative">
						<input
							type="text"
							inputMode="numeric"
							placeholder="1234 5678 9012 3456"
							value={cardNumber}
							onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
							className="h-[58px] w-full rounded-[15px] border-2 border-[#f3f4f6] bg-white px-3.5 pr-12 text-[18px] font-light text-black placeholder:text-black/45 focus:border-primary focus:outline-none"
						/>
						<CreditCard className="pointer-events-none absolute right-3.5 top-1/2 h-6 w-6 -translate-y-1/2 text-black/30" />
					</div>
				</div>

				{/* Expiry + CVC */}
				<div className="grid grid-cols-2 gap-3">
					<div className="flex flex-col gap-3">
						<label className="text-[16px] font-medium text-black">Expiry date</label>
						<input
							type="text"
							inputMode="numeric"
							placeholder="MM/YY"
							value={expiry}
							onChange={(e) => setExpiry(formatExpiry(e.target.value))}
							className="h-[58px] w-full rounded-[15px] border-2 border-[#f3f4f6] bg-white px-3.5 text-[18px] font-light text-black placeholder:text-black/45 focus:border-primary focus:outline-none"
						/>
					</div>
					<div className="flex flex-col gap-3">
						<label className="text-[16px] font-medium text-black">CVC</label>
						<input
							type="text"
							inputMode="numeric"
							placeholder="123"
							value={cvc}
							onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
							className="h-[58px] w-full rounded-[15px] border-2 border-[#f3f4f6] bg-white px-3.5 text-[18px] font-light text-black placeholder:text-black/45 focus:border-primary focus:outline-none"
						/>
					</div>
				</div>

				{/* Cardholder name */}
				<div className="flex flex-col gap-3">
					<label className="text-[16px] font-medium text-black">Cardholder name</label>
					<input
						type="text"
						placeholder="Name on card"
						value={cardholderName}
						onChange={(e) => setCardholderName(e.target.value)}
						className="h-[58px] w-full rounded-[15px] border-2 border-[#f3f4f6] bg-white px-3.5 text-[18px] font-light text-black placeholder:text-black/45 focus:border-primary focus:outline-none"
					/>
				</div>

				<p className="text-center text-[16px] text-grey-100">
					You won't be charged until your 14-day trial ends. Cancel anytime.
				</p>
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
