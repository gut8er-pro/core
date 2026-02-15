'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { login, signInWithGoogle, signInWithApple } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/text-field'

function LoginPage() {
	const [error, formAction, isPending] = useActionState(
		async (_prev: string | null, formData: FormData) => {
			const result = await login(formData)
			return result.error ?? null
		},
		null,
	)

	return (
		<div className="flex min-h-screen">
			{/* Left branding panel */}
			<div className="hidden w-1/2 flex-col justify-between bg-surface-secondary p-8 lg:flex">
				<div>
					<span className="text-h3 font-bold">
						Gut8er<span className="text-primary">PRO</span>
					</span>
				</div>

				<div className="flex flex-col gap-6">
					<h1 className="text-h1 font-bold text-black">
						Professional vehicle
						<br />
						damage assessment
					</h1>
					<p className="text-body text-grey-100">
						Streamline your appraisal workflow with AI-powered analysis, automated
						calculations, and digital report generation.
					</p>
					<div className="flex gap-4">
						<StatBadge value="-35%" label="report time" />
						<StatBadge value="-60%" label="less manual work" />
						<StatBadge value="2000+" label="reports" />
					</div>
				</div>

				<div />
			</div>

			{/* Right login form */}
			<div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
				<div className="w-full max-w-md">
					<div className="mb-8 lg:hidden">
						<span className="text-h3 font-bold">
							Gut8er<span className="text-primary">PRO</span>
						</span>
					</div>

					<h2 className="mb-1 text-h2 font-bold text-black">Welcome back</h2>
					<p className="mb-8 text-body text-grey-100">
						Sign in to your account to continue
					</p>

					{error && (
						<div className="mb-4 rounded-lg bg-error-light px-4 py-2 text-body-sm text-error">
							{error}
						</div>
					)}

					<form action={formAction} className="flex flex-col gap-4">
						<TextField
							name="email"
							label="Email address"
							type="email"
							placeholder="your@email.com"
							required
							autoComplete="email"
						/>
						<TextField
							name="password"
							label="Password"
							type="password"
							placeholder="Enter your password"
							required
							autoComplete="current-password"
						/>

						<div className="flex items-center justify-between">
							<label className="flex cursor-pointer items-center gap-1 text-body-sm text-grey-100">
								<input type="checkbox" name="remember" className="cursor-pointer rounded" />
								Remember me
							</label>
							<Link
								href="/forgot-password"
								className="text-body-sm font-medium text-primary hover:text-primary-hover"
							>
								Forgot password?
							</Link>
						</div>

						<Button type="submit" fullWidth loading={isPending}>
							Sign In
						</Button>
					</form>

					<div className="my-6 flex items-center gap-4">
						<div className="h-px flex-1 bg-border" />
						<span className="text-body-sm text-grey-100">Or</span>
						<div className="h-px flex-1 bg-border" />
					</div>

					<div className="flex flex-col gap-2">
						<form action={signInWithGoogle}>
							<Button type="submit" variant="outline" fullWidth>
								Continue with Google
							</Button>
						</form>
						<form action={signInWithApple}>
							<Button type="submit" variant="outline" fullWidth>
								Continue with Apple
							</Button>
						</form>
					</div>

					<p className="mt-6 text-center text-body-sm text-grey-100">
						Don&apos;t have an account?{' '}
						<Link
							href="/signup/account"
							className="font-medium text-primary hover:text-primary-hover"
						>
							Create account
						</Link>
					</p>
				</div>
			</div>
		</div>
	)
}

function StatBadge({ value, label }: { value: string; label: string }) {
	return (
		<div className="rounded-lg bg-white px-4 py-2 shadow-card">
			<span className="text-h4 font-bold text-primary">{value}</span>
			<span className="ml-1 text-caption text-grey-100">{label}</span>
		</div>
	)
}

export default LoginPage
