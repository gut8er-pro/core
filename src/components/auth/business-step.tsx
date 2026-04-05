'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { type SignupBusinessInput, signupBusinessSchema } from '@/lib/validations/auth'
import { useSignupStore } from '@/stores/signup-store'

const INPUT_CLS =
	'h-[53px] w-full rounded-[15px] border-[1.6px] border-[#e5e7eb] bg-white px-3.5 text-[18px] text-black placeholder:text-black/45 focus:border-primary focus:outline-none'
const LABEL_CLS = 'text-[16px] font-medium text-black'
const FIELD_CLS = 'flex flex-col gap-3'

function BusinessStep() {
	const router = useRouter()
	const t = useTranslations('auth.signup.business')
	const tSteps = useTranslations('auth.signup.steps.business')
	const tAccount = useTranslations('auth.signup.account')
	const tCommon = useTranslations('common')
	const { business, setBusiness, completeStep, setCurrentStep } = useSignupStore()

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignupBusinessInput>({
		resolver: zodResolver(signupBusinessSchema),
		defaultValues: {
			companyName: business.companyName || '',
			street: business.street || '',
			postcode: business.postcode || '',
			city: business.city || '',
			taxId: business.taxId || '',
			vatId: business.vatId || '',
		},
	})

	function onSubmit(data: SignupBusinessInput) {
		setBusiness(data)
		completeStep(3)
		setCurrentStep(4)
		router.push('/signup/plan')
	}

	function handleBack() {
		setCurrentStep(2)
		router.push('/signup/personal')
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

			<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
				<div className="flex flex-col gap-6">
					{/* Company name */}
					<div className={FIELD_CLS}>
						<label className={LABEL_CLS}>{t('companyName')}</label>
						<input
							{...register('companyName')}
							placeholder={t('companyPlaceholder')}
							className={INPUT_CLS}
						/>
						{errors.companyName && (
							<p className="text-[14px] text-error">{errors.companyName.message}</p>
						)}
					</div>

					{/* Street */}
					<div className={FIELD_CLS}>
						<label className={LABEL_CLS}>{t('street')}</label>
						<input
							{...register('street')}
							placeholder={t('streetPlaceholder')}
							className={INPUT_CLS}
						/>
						{errors.street && <p className="text-[14px] text-error">{errors.street.message}</p>}
					</div>

					{/* Postcode + City */}
					<div className="flex gap-3.5">
						<div className={`${FIELD_CLS} w-[220px] shrink-0`}>
							<label className={LABEL_CLS}>{t('postcode')}</label>
							<input
								{...register('postcode')}
								placeholder={t('postcodePlaceholder')}
								className={INPUT_CLS}
							/>
							{errors.postcode && (
								<p className="text-[14px] text-error">{errors.postcode.message}</p>
							)}
						</div>
						<div className={`${FIELD_CLS} flex-1`}>
							<label className={LABEL_CLS}>{t('city')}</label>
							<input
								{...register('city')}
								placeholder={t('cityPlaceholder')}
								className={INPUT_CLS}
							/>
							{errors.city && <p className="text-[14px] text-error">{errors.city.message}</p>}
						</div>
					</div>

					{/* Tax ID + VAT ID */}
					<div className="grid grid-cols-2 gap-3.5">
						<div className={FIELD_CLS}>
							<label className={LABEL_CLS}>{t('taxId')}</label>
							<input
								{...register('taxId')}
								placeholder={t('taxIdPlaceholder')}
								className={INPUT_CLS}
							/>
							{errors.taxId && <p className="text-[14px] text-error">{errors.taxId.message}</p>}
						</div>
						<div className={FIELD_CLS}>
							<label className={LABEL_CLS}>{t('vatId')}</label>
							<input
								{...register('vatId')}
								placeholder={t('vatIdPlaceholder')}
								className={INPUT_CLS}
							/>
							{errors.vatId && <p className="text-[14px] text-error">{errors.vatId.message}</p>}
						</div>
					</div>
				</div>

				{/* Generic fallback — catches any field error not shown above */}
				{Object.keys(errors).length > 0 && (
					<div className="rounded-[15px] bg-error-light px-4 py-2.5 text-[14px] text-error">
						{tAccount('fillRequiredFields')}
					</div>
				)}

				{/* Buttons */}
				<div className="flex gap-3.5">
					<button
						type="button"
						onClick={handleBack}
						className="flex h-[58px] flex-1 items-center justify-center rounded-[15px] border border-[#e5e7eb] bg-white px-[30px] text-[18px] font-medium text-black transition-colors hover:bg-grey-25"
					>
						{tCommon('back')}
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						className="flex h-[58px] flex-1 items-center justify-center rounded-[15px] bg-primary px-[30px] text-[18px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
					>
						{isSubmitting ? tCommon('saving') : tCommon('continue')}
					</button>
				</div>
			</form>
		</div>
	)
}

export { BusinessStep }
