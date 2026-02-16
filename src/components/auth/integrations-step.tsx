'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupIntegrationsSchema, type SignupIntegrationsInput } from '@/lib/validations/auth'
import { useSignupStore } from '@/stores/signup-store'
import { completeSignup } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TextField } from '@/components/ui/text-field'
import { cn } from '@/lib/utils'

type Provider = 'dat' | 'audatex' | 'gt_motive'

const PROVIDERS: Array<{
	id: Provider
	name: string
	logo: string
	available: boolean
}> = [
	{ id: 'dat', name: 'DAT', logo: 'DAT', available: true },
	{ id: 'audatex', name: 'Coming Soon', logo: 'A', available: false },
	{ id: 'gt_motive', name: 'Coming Soon', logo: 'gt', available: false },
]

function IntegrationsStep() {
	const router = useRouter()
	const { account, personal, business, plan, integrations, setIntegrations, completeStep, setCurrentStep, reset } = useSignupStore()
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

			// Capture display data before clearing the store
			const email = account.email || ''

			// Clear signup store immediately — account creation is done
			reset()

			// Navigate to complete step with display data in URL params
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

	function selectProvider(provider: Provider) {
		if (!PROVIDERS.find((p) => p.id === provider)?.available) return
		setSelectedProvider((prev) => (prev === provider ? null : provider))
	}

	return (
		<div>
			<h2 className="mb-1 text-h2 font-bold text-black">Connect your tools</h2>
			<p className="mb-8 text-body text-grey-100">
				Link your calculation provider. You can add more later in settings.
			</p>

			{error && (
				<div className="mb-4 rounded-lg bg-error-light px-4 py-2 text-body-sm text-error">
					{error}
				</div>
			)}

			<div className="mb-6">
				<p className="mb-2 text-body-sm font-semibold text-black">Calculation provider</p>
				<div className="grid grid-cols-3 gap-4">
					{PROVIDERS.map((provider) => (
						<Card
							key={provider.id}
							variant={selectedProvider === provider.id ? 'selected' : 'selectable'}
							padding="md"
							onClick={() => selectProvider(provider.id)}
							className={cn(
								'flex flex-col items-center justify-center gap-1 text-center',
								!provider.available && 'cursor-not-allowed opacity-60',
							)}
							aria-pressed={selectedProvider === provider.id}
							aria-disabled={!provider.available}
						>
							<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-secondary text-h4 font-bold text-grey-100">
								{provider.logo}
							</div>
							<p className="text-body-sm font-medium text-black">{provider.name}</p>
						</Card>
					))}
				</div>
			</div>

			{selectedProvider === 'dat' ? (
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="rounded-lg border border-border p-6">
						<h3 className="mb-4 text-h4 font-semibold text-black">
							DAT SilverDAT3 Credentials
						</h3>
						<div className="grid grid-cols-2 gap-4">
							<TextField
								label="Username"
								placeholder="Your username"
								error={errors.username?.message}
								{...register('username')}
							/>
							<TextField
								label="Password"
								type="password"
								placeholder="••••••••"
								error={errors.password?.message}
								{...register('password')}
							/>
						</div>
						<p className="mt-2 text-caption text-grey-100">
							Don't have an account?{' '}
							<a
								href="https://www.dat.de"
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary hover:underline"
							>
								Register with DAT
							</a>
						</p>
					</div>

					<p className="mt-4 text-caption text-grey-100">
						You can skip this step and configure integrations later in Settings.

					</p>

					<div className="mt-6 flex items-center gap-4">
						<Button type="button" variant="outline" onClick={handleBack} className="flex-1">
							Back
						</Button>
						<Button type="submit" loading={isSubmitting} className="flex-1">
							Create an Account
						</Button>
					</div>
				</form>
			) : (
				<div>
					<div className="rounded-lg border border-border bg-surface-secondary p-4 text-center">
						<p className="text-body-sm text-grey-100">
							Select a provider above to enter your credentials
						</p>
					</div>

					<p className="mt-4 text-caption text-grey-100">
						You can skip this step and configure integrations later in Settings.

					</p>

					<div className="mt-6 flex items-center gap-4">
						<Button type="button" variant="outline" onClick={handleBack} className="flex-1">
							Back
						</Button>
						<Button type="button" onClick={handleSkip} loading={isSubmitting} className="flex-1">
							Create an Account
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}

export { IntegrationsStep }
