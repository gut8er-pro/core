'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
	User,
	Building2,
	Link as LinkIcon,
	DollarSign,
	Bookmark,
	Instagram,
	Facebook,
	Linkedin,
	Download,
	CreditCard,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { TextField } from '@/components/ui/text-field'
import { Button } from '@/components/ui/button'
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
import { cn } from '@/lib/utils'

type SettingsTab = 'profile' | 'business' | 'integrations' | 'billing' | 'templates'

const SETTINGS_TABS: Array<{ key: SettingsTab; label: string; icon: typeof User }> = [
	{ key: 'profile', label: 'Profile', icon: User },
	{ key: 'business', label: 'Business', icon: Building2 },
	{ key: 'integrations', label: 'Integrations', icon: LinkIcon },
	{ key: 'billing', label: 'Billing', icon: DollarSign },
	{ key: 'templates', label: 'Templates', icon: Bookmark },
]

function SettingsSidebar({
	activeTab,
	onTabChange,
}: {
	activeTab: SettingsTab
	onTabChange: (tab: SettingsTab) => void
}) {
	return (
		<nav className="flex w-55 shrink-0 flex-col gap-1">
			{SETTINGS_TABS.map((tab) => {
				const Icon = tab.icon
				const isActive = activeTab === tab.key
				return (
					<button
						key={tab.key}
						type="button"
						onClick={() => onTabChange(tab.key)}
						className={cn(
							'flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-body-sm font-medium transition-colors',
							isActive
								? 'bg-primary-light text-primary'
								: 'text-black hover:bg-grey-25',
						)}
					>
						<Icon className="h-5 w-5" />
						{tab.label}
					</button>
				)
			})}
		</nav>
	)
}

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
		return <SkeletonGroup count={6} />
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
			<h2 className="text-h3 font-semibold text-black">Personal Information</h2>

			{/* Avatar */}
			<div className="flex items-center gap-4">
				<div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-grey-25">
					{settings?.avatarUrl ? (
						<img
							src={settings.avatarUrl}
							alt="Profile"
							className="h-full w-full object-cover"
						/>
					) : (
						<User className="h-8 w-8 text-grey-100" />
					)}
				</div>
				<Button type="button" variant="outline" size="sm">
					Remove
				</Button>
			</div>

			{/* First Name / Last Name */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<TextField
					label="First Name"
					placeholder="Ketn"
					{...register('firstName')}
					error={errors.firstName?.message}
				/>
				<TextField
					label="Last Name"
					placeholder="Torres"
					{...register('lastName')}
					error={errors.lastName?.message}
				/>
			</div>

			{/* Title */}
			<TextField
				label="Title"
				placeholder="Kfz-Sachverständiger"
				{...register('title')}
				error={errors.title?.message}
			/>

			{/* Email / Phone */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<TextField
					label="Email"
					value={settings?.email ?? ''}
					disabled
					placeholder="ketn.torres@example.com"
				/>
				<TextField
					label="Phone"
					placeholder="+49 151 23456789"
					{...register('phone')}
					error={errors.phone?.message}
				/>
			</div>

			{/* Social links */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				<TextField
					label="Instagram"
					placeholder="@username"
					icon={<Instagram className="h-5 w-5" />}
					disabled
				/>
				<TextField
					label="Facebook"
					placeholder="facebook.com/username"
					icon={<Facebook className="h-5 w-5" />}
					disabled
				/>
				<TextField
					label="LinkedIn"
					placeholder="linkedin.com/username"
					icon={<Linkedin className="h-5 w-5" />}
					disabled
				/>
			</div>

			{/* Action buttons */}
			<div className="flex justify-end gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={() => reset()}
					disabled={!isDirty}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					disabled={!isDirty || saveMutation.isPending}
					loading={saveMutation.isPending}
				>
					Update
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
		return <SkeletonGroup count={8} />
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
			<h2 className="text-h3 font-semibold text-black">Business Information</h2>

			{/* Logo upload */}
			<div className="flex items-center gap-4">
				<div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-grey-50">
					<span className="text-caption text-grey-50">Empty</span>
				</div>
				<Button type="button" variant="outline" size="sm">
					Upload Logo
				</Button>
			</div>

			{/* Company Name / Website */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<TextField
					label="Company Name"
					placeholder="Kfz-Sachverständiger"
					{...register('companyName')}
					error={errors.companyName?.message}
				/>
				<TextField
					label="Website"
					placeholder="www.kfz.de"
					disabled
				/>
			</div>

			{/* Email / Phone number */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<TextField
					label="Email"
					placeholder="sales.contact@kfz.com"
					disabled
				/>
				<TextField
					label="Phone number"
					placeholder="+3513331253"
					disabled
				/>
			</div>

			{/* Street & Number */}
			<TextField
				label="Street & Number"
				placeholder="Musterstraße 123"
				{...register('street')}
				error={errors.street?.message}
			/>

			{/* Postcode / City */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<TextField
					label="Postcode"
					placeholder="10115"
					{...register('postcode')}
					error={errors.postcode?.message}
				/>
				<TextField
					label="City"
					placeholder="Berlin"
					{...register('city')}
					error={errors.city?.message}
				/>
			</div>

			{/* Tax ID / VAT ID */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<TextField
					label="Tax ID (Steuernummer)"
					placeholder="123/456/78901"
					{...register('taxId')}
					error={errors.taxId?.message}
				/>
				<TextField
					label="VAT ID (USt-IdNr.)"
					placeholder="DE123456789"
					{...register('vatId')}
					error={errors.vatId?.message}
				/>
			</div>

			{/* Action buttons */}
			<div className="flex justify-end gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={() => reset()}
					disabled={!isDirty}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					disabled={!isDirty || saveMutation.isPending}
					loading={saveMutation.isPending}
				>
					Update
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
		<div className="flex flex-col gap-6">
			<div>
				<h2 className="text-h3 font-semibold text-black">Connected Services</h2>
				<p className="mt-1 text-body-sm text-grey-100">
					Connect third-party services to streamline your workflow
				</p>
			</div>

			{/* DAT Integration Card */}
			<div className="rounded-xl border border-border bg-white p-5">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-white">
							<span className="text-caption font-bold text-warning">DAT</span>
						</div>
						<div>
							<p className="text-body-sm font-semibold text-black">DAT</p>
							<p className="text-caption text-grey-100">
								Automatically backup reports from DAT
							</p>
							{datIntegration?.isActive && (
								<p className="text-caption font-medium text-primary">
									Last sync: 2 hours ago
								</p>
							)}
						</div>
					</div>
					<div className="flex items-center gap-3">
						{datIntegration?.isActive ? (
							<>
								<Button variant="outline" size="sm">
									Configure
								</Button>
								<Button
									variant="danger"
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
			</div>

			{/* Action buttons */}
			<div className="flex justify-end gap-3">
				<Button type="button" variant="outline">
					Cancel
				</Button>
				<Button type="button">
					Update
				</Button>
			</div>
		</div>
	)
}

function BillingSection() {
	const { data: settings, isLoading } = useUserSettings()
	const checkoutMutation = useCreateCheckout()
	const portalMutation = useCreatePortal()

	if (isLoading) {
		return (
			<div className="flex flex-col gap-6">
				<Skeleton variant="rect" className="h-40" />
				<Skeleton variant="rect" className="h-20" />
				<Skeleton variant="rect" className="h-64" />
			</div>
		)
	}

	const trialEndsAt = settings?.trialEndsAt
		? new Date(settings.trialEndsAt)
		: null
	const isTrialing =
		trialEndsAt !== null && trialEndsAt.getTime() > Date.now()

	// Mock billing history data for display
	const billingHistory = [
		{ date: '14.12.2025', description: 'Pro Plan - December', amount: '49.00', status: 'Paid' as const },
		{ date: '14.11.2025', description: 'Pro Plan - November', amount: '49.00', status: 'Paid' as const },
		{ date: '14.10.2025', description: 'Pro Plan - October', amount: '49.00', status: 'Paid' as const },
		{ date: '14.09.2025', description: 'Pro Plan - September', amount: '49.00', status: 'Paid' as const },
		{ date: '14.08.2025', description: 'Pro Plan - August', amount: '49.00', status: 'Paid' as const },
		{ date: '14.07.2025', description: 'Pro Plan - July', amount: '49.00', status: 'Paid' as const },
		{ date: '14.06.2025', description: 'Pro Plan - June', amount: '49.00', status: 'Paid' as const },
		{ date: '14.05.2025', description: 'Pro Plan - May', amount: '49.00', status: 'Paid' as const },
		{ date: '14.04.2025', description: 'Pro Plan - April', amount: '49.00', status: 'Paid' as const },
	]

	return (
		<div className="flex flex-col gap-6">
			{/* Current Plan Card - Dark gradient */}
			<div className="overflow-hidden rounded-xl bg-linear-to-b from-dark-green to-black p-6 text-white">
				<div className="flex items-start justify-between">
					<div>
						<p className="text-caption font-medium text-primary">Current Plan</p>
						<h2 className="mt-1 text-h2 font-bold">Pro Plan</h2>
						<p className="mt-1 text-body-sm text-white/70">
							{isTrialing
								? 'Trial period active'
								: 'EUR 49.00 / month - Renews on Feb 14, 2026'}
						</p>
					</div>
					<div>
						{settings?.stripeCustomerId ? (
							<Button
								variant="outline"
								size="sm"
								className="border-white/30 bg-transparent text-white hover:bg-white/10"
								onClick={() => portalMutation.mutate()}
								loading={portalMutation.isPending}
							>
								Cancel Plan
							</Button>
						) : (
							<Button
								variant="outline"
								size="sm"
								className="border-white/30 bg-transparent text-white hover:bg-white/10"
								onClick={() => checkoutMutation.mutate()}
								loading={checkoutMutation.isPending}
							>
								Set up payment
							</Button>
						)}
					</div>
				</div>
				{/* Usage stats */}
				<div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/20 pt-4">
					<div>
						<p className="text-caption text-white/60">Reports this month</p>
						<p className="mt-1 text-h4 font-bold">5 / 100</p>
					</div>
					<div>
						<p className="text-caption text-white/60">AI Auto-fills</p>
						<p className="mt-1 text-h4 font-bold">Unlimited</p>
					</div>
					<div>
						<p className="text-caption text-white/60">Cloud Storage</p>
						<p className="mt-1 text-h4 font-bold">50 GB</p>
					</div>
				</div>
			</div>

			{/* Payment Method */}
			<div className="rounded-xl border border-border bg-white p-6">
				<h3 className="text-h4 font-semibold text-black">Payment Method</h3>
				<div className="mt-4 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="flex h-10 w-14 items-center justify-center rounded-md border border-border bg-white">
							<CreditCard className="h-5 w-5 text-info-blue" />
						</div>
						<div>
							<p className="text-body-sm font-medium text-black">Visa ending in 4242</p>
							<p className="text-caption text-grey-100">Expires 12/2027</p>
						</div>
					</div>
					<Button variant="danger" size="sm">
						Remove
					</Button>
				</div>
			</div>

			{/* Billing History */}
			<div className="rounded-xl border border-border bg-white p-6">
				<h3 className="text-h4 font-semibold text-black">Billing History</h3>
				<div className="mt-4">
					<table className="w-full">
						<tbody className="divide-y divide-border">
							{billingHistory.map((item) => (
								<tr key={item.date} className="text-body-sm">
									<td className="py-3 pr-4 text-grey-100">{item.date}</td>
									<td className="py-3 pr-4 text-black">{item.description}</td>
									<td className="py-3 pr-4 font-medium text-black">EUR {item.amount}</td>
									<td className="py-3 pr-4">
										<Badge variant="success">
											{item.status}
										</Badge>
									</td>
									<td className="py-3 text-right">
										<button type="button" className="cursor-pointer text-grey-100 hover:text-black">
											<Download className="h-4 w-4" />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}

function TemplatesSection() {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h2 className="text-h3 font-semibold text-black">Report Templates</h2>
				<p className="mt-1 text-body-sm text-grey-100">
					Manage your report templates and default settings
				</p>
			</div>
			<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
				<Bookmark className="h-12 w-12 text-grey-50" />
				<p className="mt-4 text-body-sm font-medium text-grey-100">
					Coming soon
				</p>
				<p className="mt-1 text-caption text-grey-100">
					Template management will be available in a future update.
				</p>
			</div>
		</div>
	)
}

function SettingsPage() {
	const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

	return (
		<ErrorBoundary>
			<div className="mx-auto max-w-5xl">
				<div className="mb-8">
					<h1 className="text-h1 font-bold text-black">Account Settings</h1>
				</div>

				<div className="flex gap-8">
					{/* Sidebar Navigation */}
					<div className="rounded-xl border border-border bg-white p-4">
						<SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
					</div>

					{/* Content Area */}
					<div className="min-w-0 flex-1">
						{activeTab === 'profile' && <ProfileSection />}
						{activeTab === 'business' && <BusinessSection />}
						{activeTab === 'integrations' && <IntegrationsSection />}
						{activeTab === 'billing' && <BillingSection />}
						{activeTab === 'templates' && <TemplatesSection />}
					</div>
				</div>
			</div>
		</ErrorBoundary>
	)
}

export default SettingsPage
