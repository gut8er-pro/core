'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const _FEATURES = [
	{
		title: 'DAT Integration',
		description: 'Real-time vehicle data and valuations directly within your workflow.',
		icon: (
			<svg
				className="h-6 w-6 text-primary"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 0 0-1.242-7.244l4.5-4.5a4.5 4.5 0 0 1 6.364 6.364l-1.757 1.757"
				/>
			</svg>
		),
	},
	{
		title: 'Real-Time Analytics',
		description:
			'Track revenue, payments, and performance as they happen. Now the chart actually makes sense.',
		icon: (
			<svg
				className="h-6 w-6 text-primary"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
				/>
			</svg>
		),
	},
	{
		title: 'AI Evaluation Tool',
		description:
			'Automatically analyzes reports and key metrics using AI. Directly tied to the cards and numbers shown.',
		icon: (
			<svg
				className="h-6 w-6 text-primary"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
				/>
			</svg>
		),
	},
	{
		title: 'Editing Photos',
		description: 'Crop, adjust, and prepare images directly within the platform.',
		icon: (
			<svg
				className="h-6 w-6 text-primary"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
				/>
			</svg>
		),
	},
] as const

const FAQ_KEYS = [
	'whatIsGut8erPro',
	'howDoesAutoFillWork',
	'whatIntegrations',
	'isThereFreeTrial',
	'whatSupport',
] as const

const STAT_KEYS = [
	{ valueKey: 'stats.reportTimeValue', labelKey: 'stats.reportTime' },
	{ valueKey: 'stats.manualWorkValue', labelKey: 'stats.manualWork' },
	{ valueKey: 'stats.professionalsValue', labelKey: 'stats.professionals' },
] as const

function SparkleIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={1.5}
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
			/>
		</svg>
	)
}

function LandingPage() {
	const t = useTranslations('landing')
	const tNav = useTranslations('nav')
	const { isAuthenticated, loading } = useAuth()
	const router = useRouter()

	return (
		<div className="min-h-screen bg-white">
			{/* Navigation */}
			<header className="border-b border-border">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
					<button
						type="button"
						className="cursor-pointer"
						onClick={() => router.push(isAuthenticated ? '/dashboard' : '/')}
						aria-label={tNav('gut8erproHome')}
					>
						<Image src="/images/logo.svg" alt="Gut8erPRO" width={131} height={31} priority />
					</button>
					<nav className="flex items-center gap-3">
						<LanguageSwitcher />
						{!loading && isAuthenticated ? (
							<Button size="md" onClick={() => router.push('/dashboard')}>
								{tNav('dashboard')}
							</Button>
						) : (
							<>
								<Link
									href="/login"
									className="text-body-sm font-medium text-grey-100 transition-colors hover:text-black"
								>
									{t('logIn')}
								</Link>
								<Button asChild variant="outline" size="md">
									<Link href="/signup/account">{t('startFreeTrial')}</Link>
								</Button>
							</>
						)}
					</nav>
				</div>
			</header>

			{/* Hero Section */}
			<section className="px-6 pt-16 pb-12">
				<div className="mx-auto max-w-4xl text-center">
					{/* AI Badge */}
					<div className="mb-6 flex justify-center">
						<span className="inline-flex items-center gap-1.5 rounded-full border border-primary-light-border bg-primary-light px-4 py-1.5 text-body-sm font-medium text-primary">
							<SparkleIcon className="h-4 w-4" />
							{t('aiPoweredBadge')}
						</span>
					</div>

					<h2 className="text-display font-bold leading-tight text-black">
						{t('heroTitle')}
						<br />
						{t('heroSubtitle')}
					</h2>
					<p className="mx-auto mt-6 max-w-2xl text-body text-grey-100">{t('heroDescription')}</p>
					<div className="mt-8 flex justify-center">
						<Button asChild size="lg">
							<Link href="/signup/account">{t('startFreeTrial')}</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Hero Image + Stats Section */}
			<section className="px-6 pb-20">
				<div className="mx-auto max-w-6xl">
					<div className="relative overflow-hidden rounded-xl">
						<Image
							src="/images/landing-hero.jpg"
							alt="Vehicle assessor using tablet to inspect car damage"
							width={1920}
							height={1097}
							className="h-105 w-full object-cover"
							priority
						/>

						{/* Stats overlay — positioned on the right side of the image */}
						<div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-3 md:right-8">
							{STAT_KEYS.map((stat) => (
								<div
									key={stat.labelKey}
									className="flex items-center gap-3 rounded-lg bg-white/95 px-4 py-3 shadow-card backdrop-blur-sm"
								>
									<SparkleIcon className="h-5 w-5 shrink-0 text-primary" />
									<div>
										<p className="text-h4 font-bold text-black">{t(stat.valueKey)}</p>
										<p className="text-caption text-grey-100">{t(stat.labelKey)}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="bg-surface-secondary px-6 py-20">
				<div className="mx-auto max-w-6xl">
					<div className="mb-12 text-center">
						<h3 className="text-h2 font-bold text-black">{t('featuresTitle')}</h3>
						<p className="mx-auto mt-3 max-w-2xl text-body text-grey-100">
							{t('featuresSubtitle')}
						</p>
					</div>

					{/* Row 1: Narrow (DAT) + Wide (Analytics) */}
					<div className="flex flex-col gap-6 md:flex-row">
						{/* DAT Integration — narrow card */}
						<div className="flex h-[332px] w-full shrink-0 flex-col justify-between rounded-3xl border-2 border-grey-50 bg-white p-6 md:w-[338px]">
							<div className="flex flex-1 items-center justify-center">
								<div className="flex h-[183px] w-[113px] flex-col items-center justify-center rounded-2xl bg-[#f5c800] shadow-card">
									<span className="text-[36px] font-bold leading-none text-[#003087]">DAT</span>
									<span className="mt-1 text-[11px] font-medium text-[#003087]">SilverDAT3</span>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<h4 className="text-h4 font-semibold text-black">
									{t('features.datIntegration.title')}
								</h4>
								<p className="text-body-sm text-grey-100">
									{t('features.datIntegration.description')}
								</p>
							</div>
						</div>

						{/* Real-Time Analytics — wide card */}
						<div className="flex h-[332px] flex-1 flex-col justify-between overflow-hidden rounded-3xl border-2 border-grey-50 bg-white p-6">
							{/* Mini chart preview */}
							<div className="flex-1 overflow-hidden rounded-2xl bg-black px-4 pt-4">
								<div className="mb-2 flex items-center justify-between">
									<div>
										<p className="text-caption text-white/50">Total Revenue</p>
										<p className="text-h4 font-bold text-white">€5,430</p>
									</div>
									<div className="flex gap-1">
										{['Yearly', 'Monthly', 'Weekly'].map((v, i) => (
											<span
												key={v}
												className={cn(
													'rounded-md px-2 py-0.5 text-caption font-medium',
													i === 0 ? 'bg-white text-black' : 'text-white/40',
												)}
											>
												{v}
											</span>
										))}
									</div>
								</div>
								{/* Bar chart */}
								<div className="flex items-end gap-1 pt-2" style={{ height: 80 }}>
									{[50, 40, 40, 72, 72, 40, 40, 72, 20, 20, 40, 20].map((h, i) => (
										<div
											key={i}
											className={cn('flex-1 rounded-sm', i === 10 ? 'bg-primary' : 'bg-white/10')}
											style={{ height: h }}
										/>
									))}
								</div>
								<div className="mt-1 flex justify-between">
									{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => (
										<span key={i} className="text-[9px] text-white/30">
											{m}
										</span>
									))}
								</div>
							</div>
							<div className="mt-4 flex flex-col gap-2">
								<h4 className="text-h4 font-semibold text-black">
									{t('features.realTimeAnalytics.title')}
								</h4>
								<p className="text-body-sm text-grey-100">
									{t('features.realTimeAnalytics.description')}
								</p>
							</div>
						</div>
					</div>

					{/* Row 2: Wide (AI Tool) + Narrow (Editing Photos) */}
					<div className="mt-6 flex flex-col gap-6 md:flex-row">
						{/* AI Evaluation Tool — wide card */}
						<div className="flex h-[332px] flex-1 flex-col justify-between rounded-3xl border-2 border-grey-50 bg-white p-6">
							{/* Floating stat cards */}
							<div className="relative flex-1">
								{[
									{
										label: 'Total Revenue',
										value: '€11,280',
										change: '+12.5%',
										positive: true,
										top: 8,
										left: 0,
									},
									{
										label: 'Avg. Report Value',
										value: '€268',
										change: '-3.1%',
										positive: false,
										top: 8,
										left: 170,
									},
									{
										label: 'Total Reports',
										value: '42',
										change: '+8.2%',
										positive: true,
										top: 90,
										left: 60,
									},
									{
										label: 'Completion Rate',
										value: '68%',
										change: '+5.4%',
										positive: true,
										top: 90,
										left: 230,
									},
								].map((card) => (
									<div
										key={card.label}
										className="absolute rounded-2xl bg-white px-4 py-3 shadow-card"
										style={{ top: card.top, left: card.left }}
									>
										<p className="text-caption text-grey-100">{card.label}</p>
										<p className="text-h4 font-bold text-black">{card.value}</p>
										<p
											className={cn(
												'text-caption font-medium',
												card.positive ? 'text-primary' : 'text-error',
											)}
										>
											{card.positive ? '↑' : '↓'} {card.change}
										</p>
									</div>
								))}
							</div>
							<div className="flex flex-col gap-2">
								<h4 className="text-h4 font-semibold text-black">
									{t('features.aiEvaluationTool.title')}
								</h4>
								<p className="text-body-sm text-grey-100">
									{t('features.aiEvaluationTool.description')}
								</p>
							</div>
						</div>

						{/* Editing Photos — narrow card */}
						<div className="flex h-[332px] w-full shrink-0 flex-col justify-between rounded-3xl border-2 border-grey-50 bg-white p-6 md:w-[338px]">
							{/* Icon grid */}
							<div className="grid grid-cols-3 gap-2">
								{[
									{ bg: 'bg-primary-light', color: 'text-primary' },
									{ bg: 'bg-grey-25', color: 'text-black' },
									{ bg: 'bg-grey-25', color: 'text-black' },
									{ bg: 'bg-grey-25', color: 'text-black' },
									{ bg: 'bg-grey-25', color: 'text-black' },
									{ bg: 'bg-grey-25', color: 'text-black' },
								].map((style, i) => (
									<div
										key={i}
										className={cn(
											'flex h-[88px] items-center justify-center rounded-[14px] shadow-sm',
											style.bg,
										)}
									>
										<svg
											className={cn('h-8 w-8', style.color)}
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth={1.5}
										>
											{i === 0 && (
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
												/>
											)}
											{i === 1 && (
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
												/>
											)}
											{i === 2 && (
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
												/>
											)}
											{i === 3 && (
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5M3.75 15.75V18A2.25 2.25 0 0 0 6 20.25h1.5"
												/>
											)}
											{i === 4 && (
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
												/>
											)}
											{i === 5 && (
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M16.862 4.487 18.549 2.8a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
												/>
											)}
										</svg>
									</div>
								))}
							</div>
							<div className="mt-4 flex flex-col gap-2">
								<h4 className="text-h4 font-semibold text-black">
									{t('features.editingPhotos.title')}
								</h4>
								<p className="text-body-sm text-grey-100">
									{t('features.editingPhotos.description')}
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="px-6 py-20">
				<div className="mx-auto max-w-3xl">
					<div className="mb-10 text-center">
						<h3 className="text-h2 font-bold text-black">{t('faqTitle')}</h3>
						<p className="mt-3 text-body text-grey-100">{t('faqSubtitle')}</p>
					</div>
					<div className="flex flex-col">
						{FAQ_KEYS.map((key) => (
							<CollapsibleSection key={key} title={t(`faq.${key}.question`)}>
								<p className="text-body-sm text-grey-100">{t(`faq.${key}.answer`)}</p>
							</CollapsibleSection>
						))}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border px-6 py-8">
				<div className="mx-auto max-w-7xl text-center">
					<p className="text-body-sm text-grey-100">
						{t('copyright', { year: new Date().getFullYear() })}
					</p>
				</div>
			</footer>
		</div>
	)
}

export default LandingPage
