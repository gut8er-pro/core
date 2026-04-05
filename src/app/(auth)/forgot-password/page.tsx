'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useActionState, useState } from 'react'
import { requestPasswordReset } from '@/lib/auth/actions'

function ForgotPasswordPage() {
	const t = useTranslations('auth.forgotPassword')
	const tLogin = useTranslations('auth.login')
	const [sent, setSent] = useState(false)
	const [error, formAction, isPending] = useActionState(
		async (_prev: string | null, formData: FormData) => {
			const result = await requestPasswordReset(formData)
			if (result.error) return result.error
			setSent(true)
			return null
		},
		null,
	)

	return (
		<div className="flex min-h-screen bg-white">
			{/* Left branding panel */}
			<div className="relative hidden w-1/2 flex-col py-6 pl-20 pr-0 lg:flex">
				<div className="relative flex flex-1 flex-col overflow-hidden rounded-[40px] bg-primary/10 px-10 pt-10 pb-0">
					<div className="z-10">
						<Link href="/">
							<Image src="/images/logo.svg" alt="Gut8erPRO" width={131} height={31} priority />
						</Link>
					</div>
					<h1 className="z-10 mt-12 text-[36px] font-medium leading-[46px] text-black">
						{tLogin('tagline')}
					</h1>
					<div className="absolute bottom-0 left-0 right-0">
						<Image
							src="/images/login-car-illustration.webp"
							alt="Vehicle assessment illustration"
							width={600}
							height={642}
							className="w-full object-contain"
							priority
						/>
					</div>
				</div>
			</div>

			{/* Right form */}
			<div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
				<div className="w-full max-w-[519px]">
					{/* Mobile logo */}
					<div className="mb-8 lg:hidden">
						<Link href="/">
							<Image src="/images/logo.svg" alt="Gut8erPRO" width={131} height={31} />
						</Link>
					</div>

					{sent ? (
						<>
							<h2 className="text-[36px] font-medium leading-[46px] text-black">
								{t('checkYourEmail')}
							</h2>
							<p className="mt-3.5 text-[16px] leading-6 text-grey-100">{t('emailSentMessage')}</p>
							<p className="mt-2 text-[14px] text-grey-100">{t('didntReceiveEmail')}</p>

							<button
								type="button"
								onClick={() => setSent(false)}
								className="mt-8 flex h-[58px] w-full cursor-pointer items-center justify-center rounded-[15px] border-[1.6px] border-[#e5e7eb] bg-white text-[18px] font-medium text-black transition-colors hover:bg-grey-25"
							>
								{t('tryAgain')}
							</button>

							<Link
								href="/login"
								className="mt-4 block text-center text-[16px] font-medium text-primary hover:text-primary-hover"
							>
								{t('backToLogin')}
							</Link>
						</>
					) : (
						<>
							<h2 className="text-[36px] font-medium leading-[46px] text-black">{t('title')}</h2>
							<p className="mt-3.5 text-[16px] leading-6 text-grey-100">{t('subtitle')}</p>

							{error && (
								<div className="mt-4 rounded-[15px] bg-error-light px-4 py-2.5 text-[16px] text-error">
									{error}
								</div>
							)}

							<form action={formAction} className="mt-10 flex flex-col gap-6">
								<div className="flex flex-col gap-3">
									<label className="text-[18px] font-medium text-black">
										{tLogin('emailAddress')}
									</label>
									<input
										name="email"
										type="email"
										placeholder={tLogin('enterYourEmail')}
										required
										autoComplete="email"
										className="h-[58px] w-full rounded-[15px] border-[1.6px] border-[#e5e7eb] bg-white px-3.5 text-[18px] text-black placeholder:text-black/45 focus:border-primary focus:outline-none"
									/>
								</div>

								<button
									type="submit"
									disabled={isPending}
									className="flex h-[58px] w-full cursor-pointer items-center justify-center rounded-[15px] bg-primary text-[18px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
								>
									{isPending ? t('sending') : t('sendResetLink')}
								</button>
							</form>

							<Link
								href="/login"
								className="mt-6 block text-center text-[16px] font-medium text-primary hover:text-primary-hover"
							>
								{t('backToLogin')}
							</Link>
						</>
					)}
				</div>
			</div>
		</div>
	)
}

export default ForgotPasswordPage
