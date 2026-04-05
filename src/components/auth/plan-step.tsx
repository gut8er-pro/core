'use client'

import { Check, CreditCard, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useSignupStore } from '@/stores/signup-store'

const PRO_FEATURES = [
	{ key: 'unlimitedReports' },
	{ key: 'aiAutoFill' },
	{ key: 'imageDamageAnalysis' },
	{ key: 'vinAutoDetection' },
	{ key: 'prioritySupport' },
	{ key: 'customBranding' },
	{ key: 'pdfExport' },
	{ key: 'emailSupport' },
]

function PlanStep() {
	const router = useRouter()
	const t = useTranslations('auth.signup.plan')
	const tSteps = useTranslations('auth.signup.steps.plan')
	const tCommon = useTranslations('common')
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
				<h2 className="text-[44px] font-medium leading-none text-black">{tSteps('title')}</h2>
				<p className="text-[18px] leading-snug tracking-[0.18px] text-black/70">
					{tSteps('subtitle')}
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
							<h3 className="text-[23px] font-medium text-black">{t('pro')}</h3>
							<p className="text-[16px] text-black/70">{t('forProfessionals')}</p>
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
							<span className="text-[16px] text-black/70">{t('perMonth')}</span>
						</div>
						<p className="text-[14px] font-medium text-primary/70">{t('trialDays')}</p>
					</div>

					{/* Features */}
					<ul className="grid grid-cols-2 gap-x-6 gap-y-[7px]">
						{PRO_FEATURES.map((f) => (
							<li key={f.key} className="flex items-center gap-2">
								<Check className="h-3.5 w-3.5 shrink-0 text-primary" />
								<span className="text-[16px] text-black">{t(`features.${f.key}`)}</span>
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
						<h3 className="text-[18px] font-medium text-black">{t('paymentDetails')}</h3>
						<p className="text-[14px] text-black/70">{t('paymentNote')}</p>
					</div>
				</div>

				<div className="flex items-center gap-2 text-[14px] text-grey-100">
					<Shield className="h-4 w-4" />
					<span>{t('trialNote')}</span>
				</div>
			</div>

			{/* Navigation buttons */}
			<div className="flex gap-3.5">
				<button
					type="button"
					onClick={handleBack}
					className="flex h-[58px] flex-1 items-center justify-center rounded-[15px] border border-[#e5e7eb] bg-white px-[30px] text-[18px] font-medium text-black transition-colors hover:bg-grey-25"
				>
					{tCommon('back')}
				</button>
				<button
					type="button"
					onClick={handleContinue}
					className="flex h-[58px] flex-1 items-center justify-center rounded-[15px] bg-primary px-[30px] text-[18px] font-medium text-white transition-colors hover:bg-primary-hover"
				>
					{tCommon('continue')}
				</button>
			</div>
		</div>
	)
}

export { PlanStep }
