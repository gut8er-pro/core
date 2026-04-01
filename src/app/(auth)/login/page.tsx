'use client'

import { useActionState, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { login, signInWithGoogle, signInWithApple } from '@/lib/auth/actions'

function LoginPage() {
	const [error, formAction, isPending] = useActionState(
		async (_prev: string | null, formData: FormData) => {
			const result = await login(formData)
			return result.error ?? null
		},
		null,
	)

	const [showPassword, setShowPassword] = useState(false)

	return (
		<div className="flex min-h-screen bg-white">
			{/* Left branding panel — inset green card */}
			<div className="relative hidden w-1/2 flex-col py-6 pl-20 pr-0 lg:flex">
				<div className="relative flex flex-1 flex-col overflow-hidden rounded-[40px] bg-primary/10 px-10 pt-10 pb-0">
					{/* Logo */}
					<div className="z-10">
						<Link href="/">
							<Image src="/images/logo.svg" alt="Gut8erPRO" width={131} height={31} priority />
						</Link>
					</div>

					{/* Title */}
					<h1 className="z-10 mt-12 text-[36px] font-medium leading-[46px] text-black">
						Professional Vehicle<br />Assessment Web App
					</h1>

					{/* Stat badges */}
					<div className="z-10 mt-8 flex gap-3.5">
						<StatBadge label="Report time" value="-35%" />
						<StatBadge label="Less manual work" value="-40%" />
					</div>

					{/* Car illustration — anchored to bottom */}
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

			{/* Right login form */}
			<div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
				<div className="w-full max-w-[519px]">
					{/* Mobile logo */}
					<div className="mb-8 lg:hidden">
						<Link href="/">
							<Image src="/images/logo.svg" alt="Gut8erPRO" width={131} height={31} />
						</Link>
					</div>

					{/* Header */}
					<h2 className="text-[36px] font-medium leading-[46px] text-black">Welcome back</h2>
					<p className="mt-3.5 text-[16px] leading-6 text-grey-100">
						Please log in to your account to continue.
					</p>

					{error && (
						<div className="mt-4 rounded-[15px] bg-error-light px-4 py-2.5 text-[16px] text-error">
							{error}
						</div>
					)}

					{/* Form */}
					<form action={formAction} className="mt-10 flex flex-col gap-6">
						{/* Email */}
						<div className="flex flex-col gap-3">
							<label className="text-[18px] font-medium text-black">Email address</label>
							<input
								name="email"
								type="email"
								placeholder="Enter your email"
								required
								autoComplete="email"
								className="h-[58px] w-full rounded-[15px] border-[1.6px] border-[#e5e7eb] bg-white px-3.5 text-[18px] text-black placeholder:text-black/45 focus:border-primary focus:outline-none"
							/>
						</div>

						{/* Password */}
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<label className="text-[18px] font-medium text-black">Password</label>
								<Link
									href="/forgot-password"
									className="text-[16px] font-medium text-primary hover:text-primary-hover"
								>
									Forgot password?
								</Link>
							</div>
							<div className="relative">
								<input
									name="password"
									type={showPassword ? 'text' : 'password'}
									placeholder="Enter your password"
									required
									autoComplete="current-password"
									className="h-[58px] w-full rounded-[15px] border-[1.6px] border-[#e5e7eb] bg-white px-3.5 pr-12 text-[18px] text-black placeholder:text-black/45 focus:border-primary focus:outline-none"
								/>
								<button
									type="button"
									tabIndex={-1}
									className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-grey-100 hover:text-black"
									onClick={() => setShowPassword((prev) => !prev)}
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									{showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
								</button>
							</div>
						</div>

						{/* Log in button */}
						<button
							type="submit"
							disabled={isPending}
							className="flex h-[58px] w-full cursor-pointer items-center justify-center rounded-[15px] bg-primary text-[18px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
						>
							{isPending ? 'Logging in...' : 'Log in'}
						</button>
					</form>

					{/* Sign up link */}
					<p className="mt-6 text-center text-[16px] text-black">
						Don&apos;t have an account?{' '}
						<Link
							href="/signup/account"
							className="font-medium text-primary underline hover:text-primary-hover"
						>
							Sign Up
						</Link>
					</p>

					{/* Or divider */}
					<div className="my-5 flex items-center gap-3">
						<div className="h-px flex-1 bg-[#e5e7eb]" />
						<span className="text-[16px] text-grey-100">Or</span>
						<div className="h-px flex-1 bg-[#e5e7eb]" />
					</div>

					{/* Social login buttons */}
					<div className="flex items-center gap-6">
						<form action={signInWithGoogle} className="flex-1">
							<button
								type="submit"
								className="flex h-[53px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[15px] border-[1.6px] border-[#e5e7eb] bg-white px-5 text-[16px] transition-colors hover:bg-grey-25"
							>
								<Image src="/images/icon-google.svg" alt="" width={24} height={24} />
								<span className="text-black">Login with <span className="font-medium">Google</span></span>
							</button>
						</form>
						<form action={signInWithApple} className="flex-1">
							<button
								type="submit"
								className="flex h-[53px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[15px] border-[1.6px] border-[#e5e7eb] bg-white px-5 text-[16px] transition-colors hover:bg-grey-25"
							>
								<Image src="/images/icon-apple.svg" alt="" width={24} height={24} />
								<span className="text-black">Login with <span className="font-medium">Apple</span></span>
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}

function StatBadge({ value, label }: { value: string; label: string }) {
	return (
		<div className="flex items-center gap-3.5 rounded-full bg-white px-3.5 py-3.5">
			<span className="text-[16px] font-medium text-black">{label}</span>
			<span className="text-[16px] text-[#e5e7eb]">|</span>
			<span className="text-[16px] font-medium text-primary">{value}</span>
		</div>
	)
}

export default LoginPage
