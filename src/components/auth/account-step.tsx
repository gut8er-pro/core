'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { type SignupAccountInput, signupAccountSchema } from '@/lib/validations/auth'
import { useSignupStore } from '@/stores/signup-store'

function AccountStep() {
	const router = useRouter()
	const t = useTranslations('auth.signup.account')
	const tSteps = useTranslations('auth.signup.steps.account')
	const tCommon = useTranslations('common')
	const { account, setAccount, completeStep, setCurrentStep } = useSignupStore()
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignupAccountInput>({
		resolver: zodResolver(signupAccountSchema),
		defaultValues: {
			email: account.email || '',
			password: account.password || '',
			confirmPassword: account.confirmPassword || '',
		},
	})

	function onSubmit(data: SignupAccountInput) {
		setAccount(data)
		completeStep(1)
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
					{/* Email */}
					<div className="flex flex-col gap-3">
						<label className="text-[16px] font-medium text-black">{t('emailAddress')}</label>
						<input
							{...register('email')}
							type="email"
							placeholder={t('emailPlaceholder')}
							autoComplete="email"
							className="h-[54px] w-full rounded-[15px] border-[1.6px] border-[#e5e7eb] bg-white px-3.5 text-[18px] text-black placeholder:text-black/45 focus:border-primary focus:outline-none"
						/>
						{errors.email && <p className="text-[14px] text-error">{errors.email.message}</p>}
					</div>

					{/* Password */}
					<div className="flex flex-col gap-3">
						<label className="text-[16px] font-medium text-black">{t('password')}</label>
						<div className="relative">
							<input
								{...register('password')}
								type={showPassword ? 'text' : 'password'}
								placeholder={t('passwordHint')}
								autoComplete="new-password"
								className="h-[53px] w-full rounded-[15px] border-[1.6px] border-[#e5e7eb] bg-white px-3.5 pr-12 text-[18px] text-black placeholder:text-black/45 focus:border-primary focus:outline-none"
							/>
							<button
								type="button"
								tabIndex={-1}
								className="absolute right-3.5 top-1/2 -translate-y-1/2 text-grey-100 hover:text-black"
								onClick={() => setShowPassword((p) => !p)}
								aria-label={showPassword ? tCommon('hidePassword') : tCommon('showPassword')}
							>
								{showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
							</button>
						</div>
						{errors.password && <p className="text-[14px] text-error">{errors.password.message}</p>}
					</div>

					{/* Confirm password */}
					<div className="flex flex-col gap-3">
						<label className="text-[16px] font-medium text-black">{t('confirmPassword')}</label>
						<div className="relative">
							<input
								{...register('confirmPassword')}
								type={showConfirm ? 'text' : 'password'}
								placeholder={t('confirmPasswordPlaceholder')}
								autoComplete="new-password"
								className="h-[54px] w-full rounded-[15px] border-[1.6px] border-[#e5e7eb] bg-white px-3.5 pr-12 text-[18px] text-black placeholder:text-black/45 focus:border-primary focus:outline-none"
							/>
							<button
								type="button"
								tabIndex={-1}
								className="absolute right-3.5 top-1/2 -translate-y-1/2 text-grey-100 hover:text-black"
								onClick={() => setShowConfirm((p) => !p)}
								aria-label={showConfirm ? tCommon('hidePassword') : tCommon('showPassword')}
							>
								{showConfirm ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
							</button>
						</div>
						{errors.confirmPassword && (
							<p className="text-[14px] text-error">{errors.confirmPassword.message}</p>
						)}
					</div>
				</div>

				{/* Generic fallback — catches any field error not shown above */}
				{Object.keys(errors).length > 0 && (
					<div className="rounded-[15px] bg-error-light px-4 py-2.5 text-[14px] text-error">
						{t('fillRequiredFields')}
					</div>
				)}

				{/* Buttons */}
				<div className="flex gap-3.5">
					<Link href="/login" className="flex-1">
						<button
							type="button"
							className="flex h-[58px] w-full items-center justify-center rounded-[15px] border border-[#e5e7eb] bg-white px-[30px] text-[18px] font-medium text-black transition-colors hover:bg-grey-25"
						>
							{tCommon('cancel')}
						</button>
					</Link>
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

export { AccountStep }
