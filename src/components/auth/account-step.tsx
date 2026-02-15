'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupAccountSchema, type SignupAccountInput } from '@/lib/validations/auth'
import { useSignupStore } from '@/stores/signup-store'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/text-field'
import Link from 'next/link'

function AccountStep() {
	const router = useRouter()
	const { account, setAccount, completeStep, setCurrentStep } = useSignupStore()

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
		<div>
			<h2 className="mb-1 text-h2 font-bold text-black">Create your account</h2>
			<p className="mb-8 text-body text-grey-100">
				Start with your email and a secure password
			</p>

			<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
				<TextField
					label="Email address"
					type="email"
					placeholder="your@email.com"
					error={errors.email?.message}
					{...register('email')}
				/>
				<TextField
					label="Password"
					type="password"
					placeholder="Min. 8 characters"
					error={errors.password?.message}
					{...register('password')}
				/>
				<TextField
					label="Confirm password"
					type="password"
					placeholder="Repeat your password"
					error={errors.confirmPassword?.message}
					{...register('confirmPassword')}
				/>

				<div className="mt-4 flex items-center gap-4">
					<Link href="/login">
						<Button type="button" variant="ghost">
							Cancel
						</Button>
					</Link>
					<Button type="submit" loading={isSubmitting} className="flex-1">
						Continue
					</Button>
				</div>
			</form>
		</div>
	)
}

export { AccountStep }
