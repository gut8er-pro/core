'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupIntegrationsSchema, type SignupIntegrationsInput } from '@/lib/validations/auth'
import { useSignupStore } from '@/stores/signup-store'
import { completeSignup } from '@/lib/auth/actions'
import { cn } from '@/lib/utils'

type Provider = 'dat' | 'audatex' | 'gt_motive'

const INPUT_CLS =
	'h-[58px] w-full rounded-[15px] border-[1.6px] border-[#e5e7eb] bg-white px-3.5 text-[18px] text-black placeholder:text-black/45 focus:border-primary focus:outline-none'
const LABEL_CLS = 'text-[16px] font-medium text-black'
const FIELD_CLS = 'flex flex-col gap-3'

function IntegrationsStep() {
	const router = useRouter()
	const { account, personal, business, integrations, setIntegrations, setCurrentStep, reset } =
		useSignupStore()
	const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
		(integrations.provider as Provider) || null,
	)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignupIntegrationsInput>({
		resolver: zodResolver(signupIntegrationsSchema),
		defaultValues: {
			provider: integrations.provider,
			username: integrations.username || '',
			password: integrations.password || '',
		},
	})

	async function createAccount(integrationsData: Partial<SignupIntegrationsInput>) {
		setIsSubmitting(true)
		setError(null)
		try {
			const result = await completeSignup({
				account: {
					email: account.email || '',
					password: account.password || '',
				},
				personal: {
					title: personal.title,
					firstName: personal.firstName,
					lastName: personal.lastName,
					phone: personal.phone,
					professionalQualification: personal.professionalQualification,
				},
				business: {
					companyName: business.companyName,
					street: business.street,
					postcode: business.postcode,
					city: business.city,
					taxId: business.taxId,
					vatId: business.vatId,
				},
				plan: { plan: 'pro' },
				integrations: {
					provider: integrationsData.provider || selectedProvider || undefined,
					username: integrationsData.username,
					password: integrationsData.password,
				},
			})

			if (result.error) {
				setError(result.error)
				return
			}

			const email = account.email || ''
			reset()
			const params = new URLSearchParams()
			params.set('plan', 'pro')
			if (email) params.set('email', email)
			router.push(`/signup/complete?${params.toString()}`)
		} catch {
			setError('Something went wrong. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	async function onSubmit(data: SignupIntegrationsInput) {
		setIntegrations({
			...data,
			provider: selectedProvider ?? undefined,
		})
		await createAccount({
			...data,
			provider: selectedProvider ?? undefined,
		})
	}

	async function handleSkip() {
		setIntegrations({})
		await createAccount({})
	}

	function handleBack() {
		setCurrentStep(4)
		router.push('/signup/plan')
	}

	return (
		<div className="flex flex-col gap-10">
			{/* Header */}
			<div className="flex flex-col gap-3.5">
				<h2 className="text-[44px] font-medium leading-none text-black">Connect your tools</h2>
				<p className="text-[18px] leading-snug tracking-[0.18px] text-black/70">
					Link your calculation provider. You can add more later in settings.
				</p>
			</div>

			{error && (
				<div className="rounded-[15px] bg-error-light px-4 py-2.5 text-[16px] text-error">
					{error}
				</div>
			)}

			<div className="flex flex-col gap-6">
				{/* Provider cards */}
				<div className="flex flex-col gap-3">
					<label className="text-[18px] font-medium text-black">Calculation provider</label>
					<div className="flex gap-3.5">
						{/* DAT */}
						<button
							type="button"
							onClick={() => setSelectedProvider((prev) => (prev === 'dat' ? null : 'dat'))}
							className={cn(
								'flex flex-1 flex-col items-center justify-center gap-2.5 rounded-[15px] border py-[18px] px-3.5 transition-colors',
								selectedProvider === 'dat'
									? 'border-primary bg-primary/5'
									: 'border-[#e5e7eb] bg-white hover:bg-grey-25',
							)}
						>
							<div className="relative h-[60px] w-[60px] overflow-hidden rounded-[14px]">
								<Image src="/images/dat-logo.png" alt="DAT" fill className="object-contain" />
							</div>
							<span className="text-[18px] font-medium text-black">DAT</span>
						</button>

						{/* Audatex - Coming Soon */}
						<div className="flex flex-1 cursor-not-allowed flex-col items-center justify-center gap-2.5 rounded-[15px] border border-[#e5e7eb] bg-white py-[18px] px-3.5">
							<div className="flex h-[60px] w-[60px] items-center justify-center rounded-[14px] bg-[#f3f4f6] opacity-20">
								<span className="text-[20px] font-bold italic text-[#6b7280]">A</span>
							</div>
							<span className="text-[18px] font-medium text-black">Coming Soon</span>
						</div>

						{/* GT Motive - Coming Soon */}
						<div className="flex flex-1 cursor-not-allowed flex-col items-center justify-center gap-2.5 rounded-[15px] border border-[#e5e7eb] bg-white py-[18px] px-3.5">
							<div className="flex h-[60px] w-[60px] items-center justify-center rounded-[14px] bg-[#f3f4f6] opacity-20">
								<span className="text-[16px] font-bold text-[#6b7280]">gt</span>
							</div>
							<span className="text-[18px] font-medium text-black">Coming Soon</span>
						</div>
					</div>
				</div>

				{/* Credentials / placeholder section */}
				{selectedProvider === 'dat' ? (
					<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
						<div className="flex flex-col gap-6 rounded-[15px] bg-[#f3f4f6] p-6">
							<h3 className="text-[23px] font-medium text-black">DAT SilverDAT3 Credentials</h3>
							<div className="grid grid-cols-2 gap-6">
								<div className={FIELD_CLS}>
									<label className={LABEL_CLS}>Username</label>
									<input
										type="text"
										placeholder="Your username"
										autoComplete="username"
										className={INPUT_CLS}
										{...register('username')}
									/>
									{errors.username && (
										<p className="text-[14px] text-error">{errors.username.message}</p>
									)}
								</div>
								<div className={FIELD_CLS}>
									<label className={LABEL_CLS}>Password</label>
									<input
										type="password"
										placeholder="••••••••"
										autoComplete="current-password"
										className={INPUT_CLS}
										{...register('password')}
									/>
									{errors.password && (
										<p className="text-[14px] text-error">{errors.password.message}</p>
									)}
								</div>
							</div>
							<p className="text-[16px] text-black">
								Don&apos;t have an account?{" "}
								<a
									href="https://www.dat.de"
									target="_blank"
									rel="noopener noreferrer"
									className="font-medium text-primary underline hover:text-primary-hover"
								>
									Register with DAT
								</a>
							</p>
						</div>
						<p className="text-center text-[16px] text-black/45">
							💡 You can skip this step and configure integrations later in Settings.
						</p>
						<div className="flex gap-3.5">
							<button
								type="button"
								onClick={handleBack}
								className="flex h-[58px] flex-1 items-center justify-center rounded-[15px] border border-[#e5e7eb] bg-white px-[30px] text-[18px] font-medium text-black transition-colors hover:bg-grey-25"
							>
								Back
							</button>
							<button
								type="submit"
								disabled={isSubmitting}
								className="flex h-[58px] flex-1 items-center justify-center rounded-[15px] bg-primary px-[30px] text-[18px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
							>
								{isSubmitting ? 'Creating...' : 'Create an Account'}
							</button>
						</div>
					</form>
				) : (
					<div className="flex flex-col gap-6">
						<div className="rounded-[15px] bg-[#f3f4f6] px-3.5 py-[14px] text-center">
							<p className="text-[18px] text-black/70">
								Select a provider above to enter your credentials
							</p>
						</div>
						<p className="text-center text-[16px] text-black/45">
							💡 You can skip this step and configure integrations later in Settings.
						</p>
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
								onClick={handleSkip}
								disabled={isSubmitting}
								className="flex h-[58px] flex-1 items-center justify-center rounded-[15px] bg-primary px-[30px] text-[18px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
							>
								{isSubmitting ? 'Creating...' : 'Create an Account'}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export { IntegrationsStep }
