'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
	Bookmark,
	Building2,
	CreditCard,
	DollarSign,
	Download,
	Facebook,
	FileText,
	Info,
	Instagram,
	Linkedin,
	Link as LinkIcon,
	User,
	X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton'
import { TextField } from '@/components/ui/text-field'
import { useSaveSettings, useUserSettings } from '@/hooks/use-settings'
import { useCreateCheckout, useCreatePortal } from '@/hooks/use-subscription'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
	type BusinessSettingsInput,
	businessSettingsSchema,
	type ProfileSettingsInput,
	profileSettingsSchema,
} from '@/lib/validations/settings'

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
		<div className="flex w-full shrink-0 gap-2 overflow-x-auto rounded-2xl bg-white p-3 md:w-[302px] md:flex-col md:gap-4 md:p-6">
			{SETTINGS_TABS.map((tab) => {
				const Icon = tab.icon
				const isActive = activeTab === tab.key
				return (
					<button
						key={tab.key}
						type="button"
						onClick={() => onTabChange(tab.key)}
						className={cn(
							'flex cursor-pointer items-center gap-[10px] px-[14px] py-3 transition-colors',
							isActive ? 'rounded-lg bg-grey-25/50' : 'rounded-xl hover:bg-grey-25',
						)}
					>
						<Icon className={cn('h-6 w-6 shrink-0', isActive ? 'text-primary' : 'text-black')} />
						<span
							className={cn(
								'text-body tracking-[0.16px]',
								isActive ? 'font-medium text-primary' : 'text-black',
							)}
						>
							{tab.label}
						</span>
					</button>
				)
			})}
		</div>
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
				instagram: settings.instagram ?? '',
				facebook: settings.facebook ?? '',
				linkedin: settings.linkedin ?? '',
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
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col items-end gap-6">
			{/* White card */}
			<div className="flex w-full flex-col gap-6 rounded-section bg-white p-8">
				<h2 className="text-section-title font-medium leading-none text-black">
					Personal Information
				</h2>

				{/* Avatar */}
				<div className="flex items-center gap-6">
					<div className="h-[100px] w-[100px] shrink-0 overflow-hidden rounded-xl bg-grey-25 flex items-center justify-center">
						{settings?.avatarUrl ? (
							<img src={settings.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
						) : (
							<User className="h-10 w-10 text-grey-100" />
						)}
					</div>
					<button
						type="button"
						className="flex h-[50px] w-[130px] cursor-pointer items-center justify-center rounded-btn border-2 border-danger text-body font-medium text-danger"
					>
						Remove
					</button>
				</div>

				{/* First Name / Last Name */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
					<TextField
						label="First name"
						placeholder="Ketn"
						{...register('firstName')}
						error={errors.firstName?.message}
					/>
					<TextField
						label="Last name"
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
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
					<TextField
						label="Email"
						value={settings?.email ?? ''}
						disabled
						placeholder="ketn.torres@example.com"
					/>
					<TextField
						label="Phone number"
						placeholder="+49 151 23456789"
						{...register('phone')}
						error={errors.phone?.message}
					/>
				</div>

				{/* Social links */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
					<TextField
						label="Instagram"
						placeholder="@username"
						icon={<Instagram className="h-6 w-6" />}
						{...register('instagram')}
					/>
					<TextField
						label="Facebook"
						placeholder="facebook.com/username"
						icon={<Facebook className="h-6 w-6" />}
						{...register('facebook')}
					/>
					<TextField
						label="Linkedin"
						placeholder="linkedin.com/username"
						icon={<Linkedin className="h-6 w-6" />}
						{...register('linkedin')}
					/>
				</div>
			</div>

			{/* Action buttons — outside card */}
			<div className="flex gap-[7px]">
				<button
					type="button"
					onClick={() => reset()}
					className="flex h-[50px] w-[142px] cursor-pointer items-center justify-center rounded-btn bg-white text-input font-medium tracking-[0.18px] text-black"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={saveMutation.isPending}
					className="flex h-[50px] w-[142px] cursor-pointer items-center justify-center rounded-btn bg-primary text-input font-medium tracking-[0.18px] text-white disabled:opacity-60"
				>
					{saveMutation.isPending ? 'Saving…' : 'Update'}
				</button>
			</div>
		</form>
	)
}

function BusinessSection() {
	const { data: settings, isLoading } = useUserSettings()
	const saveMutation = useSaveSettings()
	const toast = useToast()
	const logoInputRef = useRef<HTMLInputElement>(null)
	const [logoUploading, setLogoUploading] = useState(false)

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

	async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return

		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file')
			return
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.error('Logo must be under 5MB')
			return
		}

		setLogoUploading(true)
		try {
			const { createClient } = await import('@/lib/supabase/client')
			const supabase = createClient()
			const ext = file.name.split('.').pop() ?? 'png'
			const path = `logos/${crypto.randomUUID()}.${ext}`

			const { error: uploadError } = await supabase.storage
				.from('photos')
				.upload(path, file, { contentType: file.type, upsert: true })

			if (uploadError) throw uploadError

			const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)

			saveMutation.mutate(
				{ logoUrl: urlData.publicUrl },
				{
					onSuccess: () => toast.success('Logo uploaded successfully'),
					onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to save logo'),
				},
			)
		} catch {
			toast.error('Failed to upload logo')
		} finally {
			setLogoUploading(false)
			if (logoInputRef.current) logoInputRef.current.value = ''
		}
	}

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
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col items-end gap-6">
			{/* White card */}
			<div className="flex w-full flex-col gap-8 rounded-section bg-white p-8">
				<h2 className="text-section-title font-medium leading-none text-black">
					Business Information
				</h2>

				{/* Logo upload */}
				<div className="flex items-center gap-4">
					<div className="flex h-[100px] w-[186px] shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border-card">
						{settings?.business?.logoUrl ? (
							<img
								src={settings.business.logoUrl}
								alt="Company logo"
								className="h-full w-full rounded-xl object-contain"
							/>
						) : (
							<span className="text-body-sm font-medium tracking-[0.14px] text-grey-50">Empty</span>
						)}
					</div>
					<input
						ref={logoInputRef}
						type="file"
						accept="image/*"
						className="hidden"
						onChange={handleLogoUpload}
					/>
					<button
						type="button"
						onClick={() => logoInputRef.current?.click()}
						disabled={logoUploading}
						className="flex h-[50px] cursor-pointer items-center justify-center rounded-btn border-2 border-border-subtle bg-white px-[13px] text-body font-medium tracking-[0.16px] text-black opacity-45 hover:opacity-70 disabled:cursor-not-allowed"
					>
						{logoUploading ? 'Uploading…' : 'Upload Logo'}
					</button>
				</div>

				{/* Company Name / Website */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
					<TextField
						label="Company Name"
						placeholder="Kfz-Sachverständiger"
						{...register('companyName')}
						error={errors.companyName?.message}
					/>
					<TextField label="Website" placeholder="www.kfz.de" disabled />
				</div>

				{/* Email / Phone number */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
					<TextField label="Email" placeholder="sales.contact@kfz.com" disabled />
					<TextField label="Phone number" placeholder="+3513331253" disabled />
				</div>

				{/* Street & Number */}
				<TextField
					label="Street & Number"
					placeholder="Musterstraße 123"
					{...register('street')}
					error={errors.street?.message}
				/>

				{/* Postcode / City */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
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
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
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
			</div>

			{/* Action buttons — outside card */}
			<div className="flex gap-[7px]">
				<button
					type="button"
					onClick={() => reset()}
					className="flex h-[50px] w-[142px] cursor-pointer items-center justify-center rounded-btn bg-white text-input font-medium tracking-[0.18px] text-black"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={saveMutation.isPending}
					className="flex h-[50px] w-[142px] cursor-pointer items-center justify-center rounded-btn bg-primary text-input font-medium tracking-[0.18px] text-white disabled:opacity-60"
				>
					{saveMutation.isPending ? 'Saving…' : 'Update'}
				</button>
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

	const datIntegration = settings?.integrations?.find((i) => i.provider === 'DAT')

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
		<div className="flex flex-col items-end gap-6">
			{/* White card */}
			<div className="flex w-full flex-col gap-8 rounded-section bg-white p-8">
				<div className="flex flex-col gap-3">
					<h2 className="text-section-title font-medium leading-none text-black">
						Connected Services
					</h2>
					<p className="text-body tracking-[0.16px] text-black opacity-70">
						Connect third-party services to streamline your workflow
					</p>
				</div>

				{/* DAT Integration Card */}
				<div className="flex items-center gap-[14px] rounded-card border-2 border-border-card px-[14px] py-3">
					<img
						src="/images/dat-logo.png"
						alt="DAT"
						className="h-[88px] w-[55px] object-contain shrink-0"
					/>
					<div className="flex flex-col gap-[7px]">
						<p className="text-body-sm font-medium leading-[18px] text-text-secondary">DAT</p>
						<p className="text-body-sm leading-5 text-black opacity-70">
							Automatically backup reports from DAT
						</p>
						{datIntegration?.isActive && (
							<p className="text-caption font-medium leading-none text-primary">
								Last sync: 2 hours ago
							</p>
						)}
					</div>
					<div className="ml-auto flex gap-[14px]">
						{datIntegration?.isActive ? (
							<>
								<button
									type="button"
									className="flex h-[50px] flex-1 cursor-pointer items-center justify-center rounded-btn border-2 border-border-subtle bg-white px-[13px] text-input font-medium tracking-[0.18px] text-black opacity-45 hover:opacity-70"
								>
									Configure
								</button>
								<button
									type="button"
									onClick={handleDisconnect}
									disabled={saveMutation.isPending}
									className="flex h-[50px] flex-1 cursor-pointer items-center justify-center rounded-btn border-2 border-danger px-[13px] text-input font-medium tracking-[0.18px] text-danger disabled:opacity-60"
								>
									{saveMutation.isPending ? '…' : 'Disconnect'}
								</button>
							</>
						) : (
							<button
								type="button"
								onClick={() => setShowDatForm(!showDatForm)}
								className="flex h-[50px] cursor-pointer items-center justify-center rounded-btn bg-primary px-6 text-input font-medium tracking-[0.18px] text-white"
							>
								Connect
							</button>
						)}
					</div>
				</div>

				{showDatForm && !datIntegration?.isActive && (
					<form
						onSubmit={datForm.handleSubmit(handleConnect)}
						className="border-t border-border-card pt-6"
					>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
							<TextField
								label="Username"
								placeholder="DAT username"
								{...datForm.register('username', { required: 'Required' })}
							/>
							<TextField
								label="Password"
								type="password"
								placeholder="DAT password"
								{...datForm.register('password', { required: 'Required' })}
							/>
						</div>
						<div className="mt-6 flex justify-end gap-[7px]">
							<button
								type="button"
								onClick={() => setShowDatForm(false)}
								className="flex h-[50px] w-[142px] cursor-pointer items-center justify-center rounded-btn bg-white text-input font-medium tracking-[0.18px] text-black"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={saveMutation.isPending}
								className="flex h-[50px] w-[142px] cursor-pointer items-center justify-center rounded-btn bg-primary text-input font-medium tracking-[0.18px] text-white disabled:opacity-60"
							>
								{saveMutation.isPending ? 'Saving…' : 'Save'}
							</button>
						</div>
					</form>
				)}
			</div>

			{/* Action buttons — outside card */}
			<div className="flex gap-[7px]">
				<button
					type="button"
					className="flex h-[50px] w-[142px] cursor-pointer items-center justify-center rounded-btn bg-white text-input font-medium tracking-[0.18px] text-black"
				>
					Cancel
				</button>
				<button
					type="button"
					className="flex h-[50px] w-[142px] cursor-pointer items-center justify-center rounded-btn bg-primary text-input font-medium tracking-[0.18px] text-white"
				>
					Update
				</button>
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

	const trialEndsAt = settings?.trialEndsAt ? new Date(settings.trialEndsAt) : null
	const isTrialing = trialEndsAt !== null && trialEndsAt.getTime() > Date.now()

	// Mock billing history data for display
	const billingHistory = [
		{
			date: '14.12.2025',
			description: 'Pro Plan - December',
			amount: '49.00',
			status: 'Paid' as const,
		},
		{
			date: '14.11.2025',
			description: 'Pro Plan - November',
			amount: '49.00',
			status: 'Paid' as const,
		},
		{
			date: '14.10.2025',
			description: 'Pro Plan - October',
			amount: '49.00',
			status: 'Paid' as const,
		},
		{
			date: '14.09.2025',
			description: 'Pro Plan - September',
			amount: '49.00',
			status: 'Paid' as const,
		},
		{
			date: '14.08.2025',
			description: 'Pro Plan - August',
			amount: '49.00',
			status: 'Paid' as const,
		},
		{
			date: '14.07.2025',
			description: 'Pro Plan - July',
			amount: '49.00',
			status: 'Paid' as const,
		},
		{
			date: '14.06.2025',
			description: 'Pro Plan - June',
			amount: '49.00',
			status: 'Paid' as const,
		},
		{ date: '14.05.2025', description: 'Pro Plan - May', amount: '49.00', status: 'Paid' as const },
		{
			date: '14.04.2025',
			description: 'Pro Plan - April',
			amount: '49.00',
			status: 'Paid' as const,
		},
	]

	return (
		<div className="flex flex-col gap-6">
			{/* Current Plan Card - dark green gradient */}
			<div className="overflow-hidden rounded-2xl bg-linear-to-b from-dark-green to-black p-6 text-white">
				<div className="flex items-start justify-between">
					<div className="flex flex-col gap-6">
						<div>
							<p className="text-plan-label font-medium text-white/50">Current Plan</p>
							<p className="mt-6 text-hero font-medium capitalize leading-none tracking-[-0.44px]">
								Pro Plan
							</p>
						</div>
						<p className="text-body tracking-[0.16px] text-white">
							{isTrialing ? 'Trial period active' : '€49.00 / month • Renews on Feb 14, 2026'}
						</p>
					</div>
					<div className="flex gap-4">
						{settings?.stripeCustomerId ? (
							<>
								<button
									type="button"
									onClick={() => portalMutation.mutate()}
									disabled={portalMutation.isPending}
									className="flex h-[50px] w-[130px] cursor-pointer items-center justify-center rounded-btn text-input font-medium tracking-[0.18px] text-white disabled:opacity-60"
								>
									{portalMutation.isPending ? '…' : 'Cancel Plan'}
								</button>
								<button
									type="button"
									className="flex h-[50px] w-[130px] cursor-pointer items-center justify-center rounded-btn border-2 border-white/25 text-input font-medium tracking-[0.18px] text-white"
								>
									Upgrade
								</button>
							</>
						) : (
							<button
								type="button"
								onClick={() => checkoutMutation.mutate()}
								disabled={checkoutMutation.isPending}
								className="flex h-[50px] w-[130px] cursor-pointer items-center justify-center rounded-btn border-2 border-white/25 text-input font-medium tracking-[0.18px] text-white disabled:opacity-60"
							>
								{checkoutMutation.isPending ? '…' : 'Set up payment'}
							</button>
						)}
					</div>
				</div>
				{/* Divider */}
				<div className="my-6 border-t border-white/20" />
				{/* Usage stats */}
				<div className="flex gap-3">
					<div className="flex flex-1 flex-col gap-[6px]">
						<p className="text-body-sm tracking-[0.14px] text-white">Reports this month</p>
						<p className="text-h2 font-medium tracking-[0.24px] text-white">5 / 100</p>
					</div>
					<div className="flex flex-1 flex-col gap-[6px]">
						<p className="text-body-sm tracking-[0.14px] text-white">AI Auto-fills</p>
						<p className="text-h2 font-medium tracking-[0.24px] text-white">Unlimited</p>
					</div>
					<div className="flex flex-1 flex-col gap-[6px]">
						<p className="text-body-sm tracking-[0.14px] text-white">Cloud Storage</p>
						<p className="text-h2 font-medium tracking-[0.24px] text-white">50 GB</p>
					</div>
				</div>
			</div>

			{/* Payment Method */}
			<div className="flex flex-col gap-4 rounded-section bg-white p-8">
				<h3 className="text-section-title font-medium leading-none text-black">Payment Method</h3>
				<div className="flex items-center justify-between rounded-card border-2 border-border-card px-[14px] py-3">
					<div className="flex items-center gap-6">
						<div className="flex h-8 w-[51px] shrink-0 items-center justify-center">
							<CreditCard className="h-7 w-7 text-info-blue" />
						</div>
						<div className="flex flex-col gap-1">
							<p className="text-body-sm font-medium leading-[18px] text-text-secondary">
								Visa ending in 4242
							</p>
							<p className="text-caption leading-5 text-black opacity-70">Expires 12/2027</p>
						</div>
					</div>
					<button
						type="button"
						className="flex h-[50px] cursor-pointer items-center justify-center rounded-btn border-2 border-danger px-6 text-input font-medium tracking-[0.18px] text-danger"
					>
						Remove
					</button>
				</div>
			</div>

			{/* Billing History */}
			<div className="flex flex-col gap-6 rounded-section bg-white p-8">
				<h3 className="text-section-title font-medium leading-none text-black">Billing History</h3>
				<div className="overflow-hidden rounded-xl border-2 border-border-card">
					<table className="w-full">
						<tbody>
							{billingHistory.map((item) => (
								<tr key={item.date} className="border-b border-border-card last:border-0">
									<td className="h-[54px] px-6 text-body-sm leading-5 text-grey-100">
										{item.date}
									</td>
									<td className="h-[54px] px-6 text-body-sm leading-5 text-grey-100">
										{item.description}
									</td>
									<td className="h-[54px] px-6 text-body-sm font-medium leading-5 text-black">
										€{item.amount}
									</td>
									<td className="h-[54px] px-6">
										<span className="inline-flex items-center justify-center rounded-md border border-[0.5px] border-primary bg-primary/10 p-[6px] text-caption leading-none text-success-dark">
											{item.status}
										</span>
									</td>
									<td className="h-[54px] w-[54px] p-3 text-center">
										<button
											type="button"
											className="cursor-pointer text-black opacity-60 hover:opacity-100"
										>
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

type Template = {
	id: string
	title: string
	date: string
	subject: string
	body: string
}

const MOCK_TEMPLATES: Template[] = [
	{ id: '1', title: 'Random Title for This Template', date: '05/07/2026', subject: '', body: '' },
	{ id: '2', title: 'Random Title for This Template', date: '05/07/2026', subject: '', body: '' },
	{ id: '3', title: 'Random Title for This Template', date: '05/07/2026', subject: '', body: '' },
	{ id: '4', title: 'Random Title for This Template', date: '05/07/2026', subject: '', body: '' },
]

function TemplatesSection() {
	const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES)
	const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
	const [isNewTemplate, setIsNewTemplate] = useState(false)
	const [editSubject, setEditSubject] = useState('')
	const [editBody, setEditBody] = useState('')

	function handleEdit(template: Template) {
		setEditingTemplate(template)
		setIsNewTemplate(false)
		setEditSubject(template.subject)
		setEditBody(template.body)
	}

	function handleSave() {
		if (!editingTemplate) return
		setTemplates((prev) =>
			prev.map((t) =>
				t.id === editingTemplate.id ? { ...t, subject: editSubject, body: editBody } : t,
			),
		)
		setEditingTemplate(null)
	}

	function handleRemove(id: string) {
		setTemplates((prev) => prev.filter((t) => t.id !== id))
	}

	function handleAdd() {
		const newTemplate: Template = {
			id: String(Date.now()),
			title: 'New Template',
			date: new Date().toLocaleDateString('en-GB', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			}),
			subject: '',
			body: '',
		}
		setTemplates((prev) => [...prev, newTemplate])
		setEditingTemplate(newTemplate)
		setIsNewTemplate(true)
		setEditSubject('')
		setEditBody('')
	}

	return (
		<div className="relative flex flex-col items-end gap-6">
			{/* Template list card */}
			<div className="flex w-full flex-col gap-6 rounded-section bg-white p-8">
				{templates.map((template) => (
					<div
						key={template.id}
						className="flex cursor-pointer items-center justify-between rounded-card border-2 border-border-card px-[14px] py-3"
						onClick={() => handleEdit(template)}
					>
						<div className="flex items-center gap-4">
							<div className="flex items-center justify-center rounded-btn bg-primary/5 p-[14px]">
								<FileText className="h-6 w-6 text-primary" />
							</div>
							<div>
								<p className="text-body-sm font-medium leading-[18px] text-text-secondary">
									{template.title}
								</p>
								<p className="text-body-sm leading-5 text-black opacity-70">{template.date}</p>
							</div>
						</div>
						<button
							type="button"
							className="flex h-[50px] cursor-pointer items-center justify-center rounded-btn border-2 border-danger px-[13px] text-input font-medium text-danger hover:bg-danger/5"
							onClick={(e) => {
								e.stopPropagation()
								handleRemove(template.id)
							}}
						>
							Remove
						</button>
					</div>
				))}
			</div>

			{/* Add Template button */}
			<button
				type="button"
				className="flex h-[50px] w-[142px] cursor-pointer items-center justify-center rounded-btn bg-primary text-input font-medium text-white hover:bg-primary-hover"
				onClick={handleAdd}
			>
				Add Template
			</button>

			{/* Edit Template Panel */}
			{editingTemplate && (
				<div className="fixed inset-0 z-50 flex justify-end bg-overlay/50">
					<div className="flex h-full w-[550px] flex-col gap-6 bg-white p-5">
						{/* Header */}
						<div className="flex items-center gap-2">
							<h3 className="text-input font-medium text-black">
								{isNewTemplate ? 'New Template' : 'Edit Template'}
							</h3>
							<Info className="h-4 w-4 text-grey-100" />
							<button
								type="button"
								className="ml-auto cursor-pointer text-grey-100 hover:text-black"
								onClick={() => setEditingTemplate(null)}
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Body */}
						<div className="flex flex-1 flex-col gap-6 overflow-y-auto">
							<div className="flex flex-col gap-3">
								<label className="text-body font-medium text-black">Subject</label>
								<input
									type="text"
									className="flex h-[53px] w-full rounded-xl border-[1.5px] border-border-card bg-white px-[14px] text-input text-black placeholder:text-grey-100 focus:border-primary focus:outline-none"
									placeholder="Title"
									value={editSubject}
									onChange={(e) => setEditSubject(e.target.value)}
								/>
							</div>
							<div className="flex flex-1 flex-col gap-3">
								<label className="text-body font-medium text-black">Body</label>
								<textarea
									className="flex-1 rounded-xl border-[1.5px] border-border-card bg-white px-[14px] py-[14px] text-input text-black placeholder:text-grey-100 focus:border-primary focus:outline-none"
									placeholder="Write Something"
									value={editBody}
									onChange={(e) => setEditBody(e.target.value)}
								/>
							</div>
						</div>

						{/* Footer */}
						<div className="flex justify-end gap-[7px]">
							<button
								type="button"
								className="flex h-[50px] w-[142px] cursor-pointer items-center justify-center rounded-btn border-2 border-border text-body font-medium text-black hover:bg-grey-25"
								onClick={() => setEditingTemplate(null)}
							>
								Cancel
							</button>
							<button
								type="button"
								className="flex h-[50px] w-[142px] cursor-pointer items-center justify-center rounded-btn bg-primary text-body font-medium text-white hover:bg-primary-hover"
								onClick={handleSave}
							>
								{isNewTemplate ? 'Create' : 'Save'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

function SettingsPage() {
	const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

	return (
		<ErrorBoundary>
			<div className="flex flex-col gap-6">
				<h1 className="text-page-title font-medium leading-none text-black">Account Settings</h1>

				<div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
					{/* Sidebar Navigation */}
					<SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

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
