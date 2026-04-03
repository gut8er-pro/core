'use client'

import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useState } from 'react'
import { updatePassword } from '@/lib/auth/actions'

function ResetPasswordPage() {
	const router = useRouter()
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)
	const [success, setSuccess] = useState(false)

	const [error, formAction, isPending] = useActionState(
		async (_prev: string | null, formData: FormData) => {
			const password = formData.get('password') as string
			const confirmPassword = formData.get('confirmPassword') as string

			if (password !== confirmPassword) {
				return 'Passwords do not match'
			}
			if (password.length < 8) {
				return 'Password must be at least 8 characters'
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
						Professional Vehicle
						<br />
						Assessment Web App
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

					{success ? (
						<>
							<h2 className="text-[36px] font-medium leading-[46px] text-black">
								Password updated
							</h2>
							<p className="mt-3.5 text-[16px] leading-6 text-grey-100">
								Your password has been updated successfully. Redirecting to login...
							</p>
							<Link
								href="/login"
								className="mt-8 block text-center text-[16px] font-medium text-primary hover:text-primary-hover"
							>
								Go to login
							</Link>
						</>
					) : (
						<>
							<h2 className="text-[36px] font-medium leading-[46px] text-black">
								Set new password
							</h2>
							<p className="mt-3.5 text-[16px] leading-6 text-grey-100">
								Enter your new password below. Must be at least 8 characters.
							</p>

							{error && (
								<div className="mt-4 rounded-[15px] bg-error-light px-4 py-2.5 text-[16px] text-error">
									{error}
								</div>
							)}

							<form action={formAction} className="mt-10 flex flex-col gap-6">
								<div className="flex flex-col gap-3">
									<label className="text-[18px] font-medium text-black">New password</label>
									<div className="relative">
										<input
											name="password"
											type={showPassword ? 'text' : 'password'}
											placeholder="Enter new password"
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
											aria-label={showPassword ? 'Hide password' : 'Show password'}
										>
											{showPassword ? (
												<EyeOff className="h-6 w-6" />
											) : (
												<Eye className="h-6 w-6" />
											)}
										</button>
									</div>
								</div>

								<div className="flex flex-col gap-3">
									<label className="text-[18px] font-medium text-black">
										Confirm password
									</label>
									<div className="relative">
										<input
											name="confirmPassword"
											type={showConfirm ? 'text' : 'password'}
											placeholder="Confirm new password"
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
											aria-label={showConfirm ? 'Hide password' : 'Show password'}
										>
											{showConfirm ? (
												<EyeOff className="h-6 w-6" />
											) : (
												<Eye className="h-6 w-6" />
											)}
										</button>
									</div>
								</div>

								<button
									type="submit"
									disabled={isPending}
									className="flex h-[58px] w-full cursor-pointer items-center justify-center rounded-[15px] bg-primary text-[18px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
								>
									{isPending ? 'Updating...' : 'Update password'}
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
