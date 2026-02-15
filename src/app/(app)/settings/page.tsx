'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Building2, Link as LinkIcon, CreditCard } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { TextField } from '@/components/ui/text-field'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { useUserSettings, useSaveSettings } from '@/hooks/use-settings'
import { useCreateCheckout, useCreatePortal } from '@/hooks/use-subscription'
import {
	profileSettingsSchema,
	businessSettingsSchema,
	type ProfileSettingsInput,
	type BusinessSettingsInput,
} from '@/lib/validations/settings'

function ProfileSection() {
	const { data: settings, isLoading } = useUserSettings()
	const saveMutation = useSaveSettings()
	const toast = useToast()

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<ProfileSettingsInput>({
		resolver: zodResolver(profileSettingsSchema),
	})

	useEffect(() => {
		if (settings) {
			reset({
				title: settings.title ?? '',
				firstName: settings.firstName ?? '',
				lastName: settings.lastName ?? '',
				phone: settings.phone ?? '',
			})
		}
	}, [settings, reset])

	function onSubmit(data: ProfileSettingsInput) {
		saveMutation.mutate(
			{ profile: data },
			{
				onSuccess: () => {
					toast.success('Profile saved successfully')
				},
				onError: () => {
					toast.error('Failed to save profile. Please try again.')
				},
			},
		)
	}

	if (isLoading) {
		return <SkeletonGroup count={4} />
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
			<div className="flex items-center gap-6">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-grey-25">
					<User className="h-8 w-8 text-grey-100" />
				</div>
				<div>
					<p className="text-body-sm font-medium text-black">
						{settings?.firstName ?? ''} {settings?.lastName ?? ''}
					</p>
					<p className="text-caption text-grey-100">{settings?.email ?? ''}</p>
				</div>
			</div>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<TextField
					label="First Name"
					{...register('firstName')}
					error={errors.firstName?.message}
				/>
				<TextField
					label="Last Name"
					{...register('lastName')}
					error={errors.lastName?.message}
				/>
				<TextField
					label="Email"
					value={settings?.email ?? ''}
					disabled
					hint="Email cannot be changed here"
				/>
				<TextField
					label="Phone"
					{...register('phone')}
					error={errors.phone?.message}
				/>
			</div>
			<div className="flex justify-end">
				<Button
					type="submit"
					disabled={!isDirty || saveMutation.isPending}
					loading={saveMutation.isPending}
				>
					Save Profile
				</Button>
			</div>
		</form>
	)
}

function BusinessSection() {
	const { data: settings, isLoading } = useUserSettings()
	const saveMutation = useSaveSettings()
	const toast = useToast()

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<BusinessSettingsInput>({
		resolver: zodResolver(businessSettingsSchema),
	})

	useEffect(() => {
		if (settings?.business) {
			reset({
				companyName: settings.business.companyName ?? '',
				street: settings.business.street ?? '',
				postcode: settings.business.postcode ?? '',
				city: settings.business.city ?? '',
				taxId: settings.business.taxId ?? '',
				vatId: settings.business.vatId ?? '',
			})
		}
	}, [settings, reset])

	function onSubmit(data: BusinessSettingsInput) {
		saveMutation.mutate(
			{ business: data },
			{
				onSuccess: () => {
					toast.success('Business details saved successfully')
				},
				onError: () => {
					toast.error('Failed to save business details. Please try again.')
				},
			},
		)
	}

	if (isLoading) {
		return <SkeletonGroup count={6} />
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<TextField
					label="Company Name"
					{...register('companyName')}
					error={errors.companyName?.message}
					className="md:col-span-2"
				/>
				<TextField
					label="Street"
					{...register('street')}
					error={errors.street?.message}
					className="md:col-span-2"
				/>
				<TextField
					label="Postcode"
					{...register('postcode')}
					error={errors.postcode?.message}
				/>
				<TextField
					label="City"
					{...register('city')}
					error={errors.city?.message}
				/>
				<TextField
					label="Tax ID (Steuernummer)"
					{...register('taxId')}
					error={errors.taxId?.message}
				/>
				<TextField
					label="VAT ID (USt-IdNr)"
					{...register('vatId')}
					error={errors.vatId?.message}
					hint="Format: DE123456789"
				/>
			</div>
			<div className="flex justify-end">
				<Button
					type="submit"
					disabled={!isDirty || saveMutation.isPending}
					loading={saveMutation.isPending}
				>
					Save Business
				</Button>
			</div>
		</form>
	)
}

function IntegrationsSection() {
	const { data: settings, isLoading } = useUserSettings()
	const saveMutation = useSaveSettings()
	const toast = useToast()
	const [showDatForm, setShowDatForm] = useState(false)

	const datForm = useForm<{ username: string; password: string }>({
		defaultValues: { username: '', password: '' },
	})

	if (isLoading) {
		return <SkeletonGroup count={2} />
	}

	const datIntegration = settings?.integrations?.find(
		(i) => i.provider === 'DAT',
	)

	function handleConnect(data: { username: string; password: string }) {
		saveMutation.mutate(
			{
				integration: {
					provider: 'DAT',
					username: data.username,
					password: data.password,
					isActive: true,
				},
			},
			{
				onSuccess: () => {
					setShowDatForm(false)
					toast.success('DAT integration connected successfully')
				},
				onError: () => {
					toast.error('Failed to connect DAT integration. Please check your credentials.')
				},
			},
		)
	}

	function handleDisconnect() {
		saveMutation.mutate(
			{
				integration: {
					provider: 'DAT',
					username: '',
					password: '',
					isActive: false,
				},
			},
			{
				onSuccess: () => {
					toast.success('DAT integration disconnected')
				},
				onError: () => {
					toast.error('Failed to disconnect DAT integration. Please try again.')
				},
			},
		)
	}

	return (
		<div className="flex flex-col gap-4">
			<Card padding="md">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-secondary">
							<LinkIcon className="h-5 w-5 text-grey-100" />
						</div>
						<div>
							<p className="text-body-sm font-medium text-black">
								DAT SilverDAT3
							</p>
							<p className="text-caption text-grey-100">
								Vehicle data, valuation, and repair costs
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{datIntegration?.isActive ? (
							<>
								<Badge variant="success">Connected</Badge>
								<Button
									variant="outline"
									size="sm"
									onClick={handleDisconnect}
									loading={saveMutation.isPending}
								>
									Disconnect
								</Button>
							</>
						) : (
							<Button
								variant="primary"
								size="sm"
								onClick={() => setShowDatForm(!showDatForm)}
							>
								Connect
							</Button>
						)}
					</div>
				</div>
				{showDatForm && !datIntegration?.isActive && (
					<form
						onSubmit={datForm.handleSubmit(handleConnect)}
						className="mt-4 border-t border-border pt-4"
					>
						<div className="grid grid-cols-2 gap-4">
							<TextField
								label="Username"
								placeholder="DAT username"
								{...datForm.register('username', {
									required: 'Required',
								})}
							/>
							<TextField
								label="Password"
								type="password"
								placeholder="DAT password"
								{...datForm.register('password', {
									required: 'Required',
								})}
							/>
						</div>
						<div className="mt-4 flex justify-end gap-2">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setShowDatForm(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								size="sm"
								loading={saveMutation.isPending}
							>
								Save Credentials
							</Button>
						</div>
					</form>
				)}
			</Card>

			<Card padding="md">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-secondary">
							<LinkIcon className="h-5 w-5 text-grey-100" />
						</div>
						<div>
							<p className="text-body-sm font-medium text-black">Audatex</p>
							<p className="text-caption text-grey-100">
								Alternative calculation provider
							</p>
						</div>
					</div>
					<Badge variant="default">Coming Soon</Badge>
				</div>
			</Card>

			<Card padding="md">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-secondary">
							<LinkIcon className="h-5 w-5 text-grey-100" />
						</div>
						<div>
							<p className="text-body-sm font-medium text-black">GT Motive</p>
							<p className="text-caption text-grey-100">
								Alternative calculation provider
							</p>
						</div>
					</div>
					<Badge variant="default">Coming Soon</Badge>
				</div>
			</Card>
		</div>
	)
}

function BillingSection() {
	const { data: settings, isLoading } = useUserSettings()
	const checkoutMutation = useCreateCheckout()
	const portalMutation = useCreatePortal()

	if (isLoading) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton variant="rect" className="h-32" />
			</div>
		)
	}

	const trialEndsAt = settings?.trialEndsAt
		? new Date(settings.trialEndsAt)
		: null
	const isTrialing =
		trialEndsAt !== null && trialEndsAt.getTime() > Date.now()
	const trialDaysRemaining = trialEndsAt
		? Math.max(
				0,
				Math.ceil(
					(trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
				),
			)
		: 0

	return (
		<div className="flex flex-col gap-4">
			<Card padding="lg">
				<div className="flex items-center justify-between">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<p className="text-h4 font-semibold text-black">
								Pro Plan
							</p>
							<Badge variant="success">Active</Badge>
							{isTrialing && (
								<Badge variant="warning">Trial</Badge>
							)}
						</div>
						<p className="text-body-sm text-grey-100">
							{isTrialing
								? `${trialDaysRemaining} days remaining in trial`
								: 'EUR 49/month'}
						</p>
					</div>
					<div>
						{settings?.stripeCustomerId ? (
							<Button
								variant="outline"
								onClick={() => portalMutation.mutate()}
								loading={portalMutation.isPending}
							>
								Manage Subscription
							</Button>
						) : (
							<Button
								variant="primary"
								onClick={() => checkoutMutation.mutate()}
								loading={checkoutMutation.isPending}
							>
								Set up payment
							</Button>
						)}
					</div>
				</div>
			</Card>
		</div>
	)
}

function SettingsPage() {
	return (
		<ErrorBoundary>
			<div className="mx-auto max-w-4xl">
				<div className="mb-8">
					<h1 className="text-h2 font-bold text-black">Settings</h1>
					<p className="mt-1 text-body-sm text-grey-100">
						Manage your profile, business details, and subscription.
					</p>
				</div>

				<div className="flex flex-col gap-2">
					<CollapsibleSection
						title="Profile"
						info
						defaultOpen
					>
						<ProfileSection />
					</CollapsibleSection>

					<CollapsibleSection title="Business">
						<BusinessSection />
					</CollapsibleSection>

					<CollapsibleSection title="Integrations">
						<IntegrationsSection />
					</CollapsibleSection>

					<CollapsibleSection title="Billing">
						<BillingSection />
					</CollapsibleSection>
				</div>
			</div>
		</ErrorBoundary>
	)
}

export default SettingsPage
