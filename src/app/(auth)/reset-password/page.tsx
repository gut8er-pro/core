'use client'

import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useState } from 'react'
import { updatePassword } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/client'
import { marketingUrl } from '@/lib/urls'

function ResetPasswordPage() {
	const t = useTranslations('auth.resetPassword')
	const tLogin = useTranslations('auth.login')
	const tCommon = useTranslations('common')
	const router = useRouter()
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)
	const [success, setSuccess] = useState(false)
	const [exchangingLink, setExchangingLink] = useState(false)
	const [linkError, setLinkError] = useState<string | null>(null)

	/**
	 * A link that arrives with its session in the fragment never reached the server, so
	 * there is no session cookie yet — and `updatePassword` is a server action that reads
	 * exactly that cookie. This effect writes it, and submit stays disabled until it has,
	 * because submitting earlier would race the cookie and report the link as expired.
	 * Links that came through `/auth/callback` carry no fragment and skip all of this,
	 * already holding a session.
	 *
	 * The tokens are handed over explicitly rather than left to `detectSessionInUrl`:
	 * `createBrowserClient` pins `flowType: 'pkce'` after spreading its options, so it
	 * cannot be configured otherwise, and auth-js answers an implicit fragment on a PKCE
	 * client with `AuthPKCEGrantCodeExchangeError('Not a valid PKCE flow url.')` — which
	 * initialisation swallows. Automatic detection is therefore a silent no-op here, and
	 * `setSession` is what actually persists through the cookie-backed storage.
	 */
	useEffect(() => {
		const hash = window.location.hash
		if (hash.length < 2) return
		const params = new URLSearchParams(hash.slice(1))

		if (params.has('error')) {
			setLinkError(t('linkInvalid'))
			// Drop the spent fragment so a reload does not resurrect the error.
			window.history.replaceState(null, '', window.location.pathname)
			return
		}

		const accessToken = params.get('access_token')
		const refreshToken = params.get('refresh_token')
		if (params.get('type') !== 'recovery' || !accessToken || !refreshToken) return

		setExchangingLink(true)
		createClient()
			.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
			.then(({ data, error }) => {
				if (error || !data.session) setLinkError(t('linkInvalid'))
				// Nothing else clears the fragment on this path — the auth-js strip belongs
				// to the detection routine that never runs — and it holds a live refresh
				// token, so it must not be left in the URL or in history.
				window.history.replaceState(null, '', window.location.pathname)
			})
			.finally(() => setExchangingLink(false))
	}, [t])

	const [error, formAction, isPending] = useActionState(
		async (_prev: string | null, formData: FormData) => {
			const password = formData.get('password') as string
			const confirmPassword = formData.get('confirmPassword') as string

			if (password !== confirmPassword) {
				return t('passwordsDoNotMatch')
			}
			if (password.length < 8) {
				return t('passwordMinLength')
			}

			const result = await updatePassword(formData)
			if (result.error) return result.error

			setSuccess(true)
			setTimeout(() => router.push('/login'), 3000)
			return null
		},
		null,
	)

	return (
		<div className="flex min-h-full bg-white">
			{/* Left branding panel */}
			<div className="relative hidden w-1/2 flex-col py-6 pl-20 pr-0 lg:flex">
				<div className="relative flex flex-1 flex-col overflow-hidden rounded-[40px] bg-primary/10 px-10 pt-10 pb-0">
					<div className="z-10">
						<a href={marketingUrl()}>
							<Image src="/images/logo.svg" alt="Gut8erPRO" width={131} height={31} priority />
						</a>
					</div>
					<h1 className="z-10 mt-12 text-[36px] font-medium leading-[46px] text-black">
						{tLogin('tagline')}
					</h1>
					<div className="absolute bottom-8 left-0 right-0">
						<Image
							src="/images/login-car-scene.webp"
							alt="Vehicle assessment illustration"
							width={1400}
							height={841}
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
						<a href={marketingUrl()}>
							<Image src="/images/logo.svg" alt="Gut8erPRO" width={131} height={31} />
						</a>
					</div>

					{success ? (
						<>
							<h2 className="text-[36px] font-medium leading-[46px] text-black">
								{t('passwordUpdated')}
							</h2>
							<p className="mt-3.5 text-[16px] leading-6 text-grey-100">{t('successMessage')}</p>
							<Link
								href="/login"
								className="mt-8 block text-center text-[16px] font-medium text-primary hover:text-primary-hover"
							>
								{t('goToLogin')}
							</Link>
						</>
					) : (
						<>
							<h2 className="text-[36px] font-medium leading-[46px] text-black">{t('title')}</h2>
							<p className="mt-3.5 text-[16px] leading-6 text-grey-100">{t('subtitle')}</p>

							{(error ?? linkError) && (
								<div className="mt-4 rounded-[15px] bg-error-light px-4 py-2.5 text-[16px] text-error">
									{error ?? linkError}
								</div>
							)}

							{linkError && (
								<Link
									href="/forgot-password"
									className="mt-4 block text-[16px] font-medium text-primary hover:text-primary-hover"
								>
									{t('requestNewLink')}
								</Link>
							)}

							<form action={formAction} className="mt-10 flex flex-col gap-6">
								<div className="flex flex-col gap-3">
									<label className="text-[18px] font-medium text-black">{t('newPassword')}</label>
									<div className="relative">
										<input
											name="password"
											type={showPassword ? 'text' : 'password'}
											placeholder={t('newPasswordPlaceholder')}
											required
											minLength={8}
											autoComplete="new-password"
											className="h-[58px] w-full rounded-[15px] border-[1.6px] border-[#e5e7eb] bg-white px-3.5 pr-12 text-[18px] text-black placeholder:text-black/45 focus:border-primary focus:outline-none"
										/>
										<button
											type="button"
											tabIndex={-1}
											className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-grey-100 hover:text-black"
											onClick={() => setShowPassword((p) => !p)}
											aria-label={showPassword ? tCommon('hidePassword') : tCommon('showPassword')}
										>
											{showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
										</button>
									</div>
								</div>

								<div className="flex flex-col gap-3">
									<label className="text-[18px] font-medium text-black">
										{t('confirmPassword')}
									</label>
									<div className="relative">
										<input
											name="confirmPassword"
											type={showConfirm ? 'text' : 'password'}
											placeholder={t('confirmPasswordPlaceholder')}
											required
											minLength={8}
											autoComplete="new-password"
											className="h-[58px] w-full rounded-[15px] border-[1.6px] border-[#e5e7eb] bg-white px-3.5 pr-12 text-[18px] text-black placeholder:text-black/45 focus:border-primary focus:outline-none"
										/>
										<button
											type="button"
											tabIndex={-1}
											className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-grey-100 hover:text-black"
											onClick={() => setShowConfirm((p) => !p)}
											aria-label={showConfirm ? tCommon('hidePassword') : tCommon('showPassword')}
										>
											{showConfirm ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
										</button>
									</div>
								</div>

								<button
									type="submit"
									disabled={isPending || exchangingLink}
									className="flex h-[58px] w-full cursor-pointer items-center justify-center rounded-[15px] bg-primary text-[18px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
								>
									{exchangingLink
										? t('verifyingLink')
										: isPending
											? t('updating')
											: t('updatePassword')}
								</button>
							</form>
						</>
					)}
				</div>
			</div>
		</div>
	)
}

export default ResetPasswordPage
