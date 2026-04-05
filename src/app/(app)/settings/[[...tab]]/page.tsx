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
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton'
import { TextField } from '@/components/ui/text-field'
import { useSaveSettings, useUserSettings } from '@/hooks/use-settings'
import { useBilling, useCreateCheckout, useCreatePortal } from '@/hooks/use-subscription'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
	type BusinessSettingsInput,
	businessSettingsSchema,
	type ProfileSettingsInput,
	profileSettingsSchema,
} from '@/lib/validations/settings'

type SettingsTab = 'profile' | 'business' | 'integrations' | 'billing' | 'templates'

const SETTINGS_TABS: Array<{ key: SettingsTab; labelKey: string; icon: typeof User }> = [
	{ key: 'profile', labelKey: 'tabs.profile', icon: User },
	{ key: 'business', labelKey: 'tabs.business', icon: Building2 },
	{ key: 'integrations', labelKey: 'tabs.integrations', icon: LinkIcon },
	{ key: 'billing', labelKey: 'tabs.billing', icon: DollarSign },
	{ key: 'templates', labelKey: 'tabs.templates', icon: Bookmark },
]

function SettingsSidebar({
	activeTab,
	onTabChange,
}: {
	activeTab: SettingsTab
	onTabChange: (tab: SettingsTab) => void
}) {
	const t = useTranslations('settings')
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
							{t(tab.labelKey)}
						</span>
					</button>
				)
			})}
		</div>
	)
}

function ProfileSection() {
	const t = useTranslations('settings')
	const tt = useTranslations('toast')
	const tc = useTranslations('common')
	const { data: settings, isLoading } = useUserSettings()
	const saveMutation = useSaveSettings()
	const toast = useToast()

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
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
					toast.success(tt('profileSaved'))
				},
				onError: () => {
					toast.error(tt('profileSaveError'))
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
					{t('profile.heading')}
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
						{t('profile.remove')}
					</button>
				</div>

				{/* First Name / Last Name */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
					<TextField
						label={t('profile.firstName')}
						placeholder="Ketn"
						{...register('firstName')}
						error={errors.firstName?.message}
					/>
					<TextField
						label={t('profile.lastName')}
						placeholder="Torres"
						{...register('lastName')}
						error={errors.lastName?.message}
					/>
				</div>

				{/* Title */}
				<TextField
					label={t('profile.title')}
					placeholder="Kfz-Sachverst\u00e4ndiger"
					{...register('title')}
					error={errors.title?.message}
				/>

				{/* Email / Phone */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
					<TextField
						label={t('profile.email')}
						value={settings?.email ?? ''}
						disabled
						placeholder="ketn.torres@example.com"
					/>
					<TextField
						label={t('profile.phoneNumber')}
						placeholder="+49 151 23456789"
						{...register('phone')}
						error={errors.phone?.message}
					/>
				</div>

				{/* Social links */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
					<TextField
						label={t('profile.instagram')}
						placeholder={t('profile.instagramPlaceholder')}
						icon={<Instagram className="h-6 w-6" />}
						{...register('instagram')}
					/>
					<TextField
						label={t('profile.facebook')}
						placeholder={t('profile.facebookPlaceholder')}
						icon={<Facebook className="h-6 w-6" />}
						{...register('facebook')}
					/>
					<TextField
						label={t('profile.linkedin')}
						placeholder={t('profile.linkedinPlaceholder')}
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
					{tc('cancel')}
				</button>
				<button
					type="submit"
					disabled={saveMutation.isPending}
					className="flex h-[50px] w-[142px] cursor-pointer items-center justify-center rounded-btn bg-primary text-input font-medium tracking-[0.18px] text-white disabled:opacity-60"
				>
					{saveMutation.isPending ? tc('saving') : tc('update')}
				</button>
			</div>
		</form>
	)
}

function BusinessSection() {
	const t = useTranslations('settings')
	const tt = useTranslations('toast')
	const tc = useTranslations('common')
	const { data: settings, isLoading } = useUserSettings()
	const saveMutation = useSaveSettings()
	const toast = useToast()
	const logoInputRef = useRef<HTMLInputElement>(null)
	const [logoUploading, setLogoUploading] = useState(false)

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
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
			toast.error(tt('logoUploadError'))
			return
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.error(t('business.logoTooLarge'))
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
					onSuccess: () => toast.success(tt('logoUploaded')),
					onError: (err) => toast.error(err instanceof Error ? err.message : tt('logoSaveError')),
				},
			)
		} catch {
			toast.error(tt('logoUploadError'))
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
					toast.success(tt('businessSaved'))
				},
				onError: () => {
					toast.error(tt('businessSaveError'))
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
					{t('business.heading')}
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
							<span className="text-body-sm font-medium tracking-[0.14px] text-grey-50">
								{t('business.empty')}
							</span>
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
						{logoUploading ? t('business.uploading') : t('business.uploadLogo')}
					</button>
				</div>

				{/* Company Name / Website */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
					<TextField
						label={t('business.companyName')}
						placeholder="Kfz-Sachverst\u00e4ndiger"
						{...register('companyName')}
						error={errors.companyName?.message}
					/>
					<TextField label={t('business.website')} placeholder="www.kfz.de" disabled />
				</div>

				{/* Email / Phone number */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
					<TextField label={t('profile.email')} placeholder="sales.contact@kfz.com" disabled />
					<TextField label={t('profile.phoneNumber')} placeholder="+3513331253" disabled />
				</div>

				{/* Street & Number */}
				<TextField
					label={t('business.street')}
					placeholder="Musterstra\u00dfe 123"
					{...register('street')}
					error={errors.street?.message}
				/>

				{/* Postcode / City */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
					<TextField
						label={t('business.postcode')}
						placeholder="10115"
						{...register('postcode')}
						error={errors.postcode?.message}
					/>
					<TextField
						label={t('business.city')}
						placeholder="Berlin"
						{...register('city')}
						error={errors.city?.message}
					/>
				</div>

				{/* Tax ID / VAT ID */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
					<TextField
						label={t('business.taxId')}
						placeholder="123/456/78901"
						{...register('taxId')}
						error={errors.taxId?.message}
					/>
					<TextField
						label={t('business.vatId')}
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
					{tc('cancel')}
				</button>
				<button
					type="submit"
					disabled={saveMutation.isPending}
					className="flex h-[50px] w-[142px] cursor-pointer items-center justify-center rounded-btn bg-primary text-input font-medium tracking-[0.18px] text-white disabled:opacity-60"
				>
					{saveMutation.isPending ? tc('saving') : tc('update')}
				</button>
			</div>
		</form>
	)
}

function IntegrationsSection() {
	const t = useTranslations('settings')
	const tt = useTranslations('toast')
	const tc = useTranslations('common')
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
					toast.success(tt('datConnected'))
				},
				onError: () => {
					toast.error(tt('datConnectError'))
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
					toast.success(tt('datDisconnected'))
				},
				onError: () => {
					toast.error(tt('datDisconnectError'))
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
						{t('integrations.heading')}
					</h2>
					<p className="text-body tracking-[0.16px] text-black opacity-70">
						{t('integrations.subtitle')}
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
						<p className="text-body-sm font-medium leading-[18px] text-text-secondary">
							{t('integrations.dat')}
						</p>
						<p className="text-body-sm leading-5 text-black opacity-70">
							{t('integrations.datDescription')}
						</p>
						{datIntegration?.isActive && (
							<p className="text-caption font-medium leading-none text-primary">
								{t('integrations.lastSync')}
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
									{t('integrations.configure')}
								</button>
								<button
									type="button"
									onClick={handleDisconnect}
									disabled={saveMutation.isPending}
									className="flex h-[50px] flex-1 cursor-pointer items-center justify-center rounded-btn border-2 border-danger px-[13px] text-input font-medium tracking-[0.18px] text-danger disabled:opacity-60"
								>
									{saveMutation.isPending ? '\u2026' : t('integrations.disconnect')}
								</button>
							</>
						) : (
							<button
								type="button"
								onClick={() => setShowDatForm(!showDatForm)}
								className="flex h-[50px] cursor-pointer items-center justify-center rounded-btn bg-primary px-6 text-input font-medium tracking-[0.18px] text-white"
							>
								{t('integrations.connect')}
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
								label={t('integrations.username')}
								placeholder={t('integrations.usernamePlaceholder')}
								{...datForm.register('username', { required: 'Required' })}
							/>
							<TextField
								label={t('integrations.password')}
								type="password"
								placeholder={t('integrations.passwordPlaceholder')}
								{...datForm.register('password', { required: 'Required' })}
							/>
						</div>
						<div className="mt-6 flex justify-end gap-[7px]">
							<button
								type="button"
								onClick={() => setShowDatForm(false)}
								className="flex h-[50px] w-[142px] cursor-pointer items-center justify-center rounded-btn bg-white text-input font-medium tracking-[0.18px] text-black"
							>
								{tc('cancel')}
							</button>
							<button
								type="submit"
								disabled={saveMutation.isPending}
								className="flex h-[50px] w-[142px] cursor-pointer items-center justify-center rounded-btn bg-primary text-input font-medium tracking-[0.18px] text-white disabled:opacity-60"
							>
								{saveMutation.isPending ? tc('saving') : tc('save')}
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
					{tc('cancel')}
				</button>
				<button
					type="button"
					className="flex h-[50px] w-[142px] cursor-pointer items-center justify-center rounded-btn bg-primary text-input font-medium tracking-[0.18px] text-white"
				>
					{tc('update')}
				</button>
			</div>
		</div>
	)
}

function formatDate(dateStr: string | null): string {
	if (!dateStr) return '\u2014'
	const d = new Date(dateStr)
	return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function BillingSection() {
	const t = useTranslations('settings')
	const tc = useTranslations('common')
	const { data: billing, isLoading } = useBilling()
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

	const trialEndsAt = billing?.trialEndsAt ? new Date(billing.trialEndsAt) : null
	const isTrialing =
		billing?.subscription?.status === 'trialing' ||
		(trialEndsAt !== null && trialEndsAt.getTime() > Date.now())
	const hasSubscription = !!billing?.subscription
	const nextBillingDate = billing?.subscription?.currentPeriodEnd
	const isCancelling = billing?.subscription?.cancelAtPeriodEnd

	function getPlanStatusText(): string {
		if (isCancelling && billing?.subscription?.cancelAt) {
			return t('billing.cancelsOn', { date: formatDate(billing.subscription.cancelAt) })
		}
		if (isTrialing && trialEndsAt) {
			const daysLeft = Math.max(
				0,
				Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
			)
			return t('billing.trialActive', { days: daysLeft })
		}
		if (nextBillingDate) {
			return t('billing.renewsOn', { date: formatDate(nextBillingDate) })
		}
		return t('billing.noActiveSubscription')
	}

	function getStatusLabel(status: string | null): {
		label: string
		color: 'green' | 'yellow' | 'red'
	} {
		switch (status) {
			case 'paid':
				return { label: t('billing.paid'), color: 'green' }
			case 'open':
				return { label: t('billing.open'), color: 'yellow' }
			case 'void':
			case 'uncollectible':
				return { label: t('billing.failed'), color: 'red' }
			default:
				return { label: status ?? t('billing.unknown'), color: 'yellow' }
		}
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Current Plan Card - dark green gradient */}
			<div className="overflow-hidden rounded-2xl bg-linear-to-b from-dark-green to-black p-6 text-white">
				<div className="flex items-start justify-between">
					<div className="flex flex-col gap-6">
						<div>
							<p className="text-plan-label font-medium text-white/50">
								{t('billing.currentPlan')}
							</p>
							<p className="mt-6 text-hero font-medium capitalize leading-none tracking-[-0.44px]">
								{t('billing.proPlan')}
							</p>
						</div>
						<p className="text-body tracking-[0.16px] text-white">{getPlanStatusText()}</p>
					</div>
					<div className="flex gap-4">
						{hasSubscription ? (
							<button
								type="button"
								onClick={() => portalMutation.mutate()}
								disabled={portalMutation.isPending}
								className="flex h-[50px] w-[130px] cursor-pointer items-center justify-center rounded-btn border-2 border-white/25 text-input font-medium tracking-[0.18px] text-white disabled:opacity-60"
							>
								{portalMutation.isPending ? '\u2026' : t('billing.managePlan')}
							</button>
						) : (
							<button
								type="button"
								onClick={() => checkoutMutation.mutate()}
								disabled={checkoutMutation.isPending}
								className="flex h-[50px] w-[130px] cursor-pointer items-center justify-center rounded-btn border-2 border-white/25 text-input font-medium tracking-[0.18px] text-white disabled:opacity-60"
							>
								{checkoutMutation.isPending ? '\u2026' : t('billing.setupPayment')}
							</button>
						)}
					</div>
				</div>
				{/* Divider */}
				<div className="my-6 border-t border-white/20" />
				{/* Usage stats */}
				<div className="flex gap-3">
					<div className="flex flex-1 flex-col gap-[6px]">
						<p className="text-body-sm tracking-[0.14px] text-white">
							{t('billing.reportsThisMonth')}
						</p>
						<p className="text-h2 font-medium tracking-[0.24px] text-white">
							{t('billing.unlimited')}
						</p>
					</div>
					<div className="flex flex-1 flex-col gap-[6px]">
						<p className="text-body-sm tracking-[0.14px] text-white">{t('billing.aiAutoFills')}</p>
						<p className="text-h2 font-medium tracking-[0.24px] text-white">
							{t('billing.unlimited')}
						</p>
					</div>
					<div className="flex flex-1 flex-col gap-[6px]">
						<p className="text-body-sm tracking-[0.14px] text-white">{t('billing.cloudStorage')}</p>
						<p className="text-h2 font-medium tracking-[0.24px] text-white">
							{t('billing.cloudStorageAmount')}
						</p>
					</div>
				</div>
			</div>

			{/* Payment Method */}
			<div className="flex flex-col gap-4 rounded-section bg-white p-8">
				<h3 className="text-section-title font-medium leading-none text-black">
					{t('billing.paymentMethod')}
				</h3>
				{billing?.paymentMethod ? (
					<div className="flex items-center justify-between rounded-card border-2 border-border-card px-[14px] py-3">
						<div className="flex items-center gap-6">
							<div className="flex h-8 w-[51px] shrink-0 items-center justify-center">
								<CreditCard className="h-7 w-7 text-info-blue" />
							</div>
							<div className="flex flex-col gap-1">
								<p className="text-body-sm font-medium leading-[18px] text-text-secondary">
									{t('billing.cardInfo', {
										brand:
											billing.paymentMethod.brand.charAt(0).toUpperCase() +
											billing.paymentMethod.brand.slice(1),
										last4: billing.paymentMethod.last4,
									})}
								</p>
								<p className="text-caption leading-5 text-black opacity-70">
									{t('billing.cardExpiry', {
										month: String(billing.paymentMethod.expMonth).padStart(2, '0'),
										year: billing.paymentMethod.expYear,
									})}
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={() => portalMutation.mutate()}
							className="flex h-[50px] cursor-pointer items-center justify-center rounded-btn border-2 border-border-card px-6 text-input font-medium tracking-[0.18px] text-grey-100 hover:text-black"
						>
							{tc('update')}
						</button>
					</div>
				) : (
					<div className="flex items-center justify-between rounded-card border-2 border-dashed border-border-card px-[14px] py-6">
						<p className="text-body-sm text-grey-100">{t('billing.noPaymentMethod')}</p>
						<button
							type="button"
							onClick={() => checkoutMutation.mutate()}
							disabled={checkoutMutation.isPending}
							className="flex h-[42px] cursor-pointer items-center justify-center rounded-btn bg-primary px-6 text-body-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
						>
							{checkoutMutation.isPending ? t('billing.loading') : t('billing.addPaymentMethod')}
						</button>
					</div>
				)}
			</div>

			{/* Billing History */}
			<div className="flex flex-col gap-6 rounded-section bg-white p-8">
				<h3 className="text-section-title font-medium leading-none text-black">
					{t('billing.billingHistory')}
				</h3>
				{billing?.invoices && billing.invoices.length > 0 ? (
					<div className="overflow-hidden rounded-xl border-2 border-border-card">
						<table className="w-full">
							<tbody>
								{billing.invoices.map((invoice) => {
									const status = getStatusLabel(invoice.status)
									return (
										<tr key={invoice.id} className="border-b border-border-card last:border-0">
											<td className="h-[54px] px-6 text-body-sm leading-5 text-grey-100">
												{formatDate(invoice.date)}
											</td>
											<td className="h-[54px] px-6 text-body-sm leading-5 text-grey-100">
												{invoice.description}
											</td>
											<td className="h-[54px] px-6 text-body-sm font-medium leading-5 text-black">
												&euro;{invoice.amount}
											</td>
											<td className="h-[54px] px-6">
												<span
													className={cn(
														'inline-flex items-center justify-center rounded-md border border-[0.5px] p-[6px] text-caption leading-none',
														status.color === 'green' &&
															'border-primary bg-primary/10 text-success-dark',
														status.color === 'yellow' &&
															'border-warning-border bg-warning-border/10 text-warning-dark',
														status.color === 'red' && 'border-danger bg-danger/10 text-danger',
													)}
												>
													{status.label}
												</span>
											</td>
											<td className="h-[54px] w-[54px] p-3 text-center">
												{invoice.invoicePdf && (
													<a
														href={invoice.invoicePdf}
														target="_blank"
														rel="noopener noreferrer"
														className="cursor-pointer text-black opacity-60 hover:opacity-100"
													>
														<Download className="h-4 w-4" />
													</a>
												)}
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				) : (
					<div className="rounded-xl border-2 border-dashed border-border-card px-6 py-8 text-center">
						<p className="text-body-sm text-grey-100">{t('billing.noBillingHistory')}</p>
					</div>
				)}
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
	const t = useTranslations('settings')
	const tc = useTranslations('common')
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
			title: t('templates.newTemplate'),
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
							{tc('remove')}
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
				{t('templates.addTemplate')}
			</button>

			{/* Edit Template Panel */}
			{editingTemplate && (
				<div className="fixed inset-0 z-50 flex justify-end bg-overlay/50">
					<div className="flex h-full w-[550px] flex-col gap-6 bg-white p-5">
						{/* Header */}
						<div className="flex items-center gap-2">
							<h3 className="text-input font-medium text-black">
								{isNewTemplate ? t('templates.newTemplate') : t('templates.editTemplate')}
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
								<label className="text-body font-medium text-black">{t('templates.subject')}</label>
								<input
									type="text"
									className="flex h-[53px] w-full rounded-xl border-[1.5px] border-border-card bg-white px-[14px] text-input text-black placeholder:text-grey-100 focus:border-primary focus:outline-none"
									placeholder={t('templates.title')}
									value={editSubject}
									onChange={(e) => setEditSubject(e.target.value)}
								/>
							</div>
							<div className="flex flex-1 flex-col gap-3">
								<label className="text-body font-medium text-black">{t('templates.body')}</label>
								<textarea
									className="flex-1 rounded-xl border-[1.5px] border-border-card bg-white px-[14px] py-[14px] text-input text-black placeholder:text-grey-100 focus:border-primary focus:outline-none"
									placeholder={t('templates.placeholder')}
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
								{tc('cancel')}
							</button>
							<button
								type="button"
								className="flex h-[50px] w-[142px] cursor-pointer items-center justify-center rounded-btn bg-primary text-body font-medium text-white hover:bg-primary-hover"
								onClick={handleSave}
							>
								{isNewTemplate ? t('templates.create') : tc('save')}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

const VALID_TABS: SettingsTab[] = ['profile', 'business', 'integrations', 'billing', 'templates']

function SettingsPage() {
	const t = useTranslations('settings')
	const router = useRouter()
	const params = useParams<{ tab?: string[] }>()
	const tabParam = params.tab?.[0] as SettingsTab | undefined
	const activeTab: SettingsTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'profile'

	function handleTabChange(tab: SettingsTab) {
		router.push(`/settings/${tab}`)
	}

	return (
		<ErrorBoundary>
			<div className="flex flex-col gap-6">
				<h1 className="text-page-title font-medium leading-none text-black">{t('title')}</h1>

				<div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
					{/* Sidebar Navigation */}
					<SettingsSidebar activeTab={activeTab} onTabChange={handleTabChange} />

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
