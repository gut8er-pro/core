'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

const FEATURES = [
	{
		title: 'DAT Integration',
		description:
			'Real-time vehicle data and valuations directly within your workflow.',
		icon: (
			<svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 0 0-1.242-7.244l4.5-4.5a4.5 4.5 0 0 1 6.364 6.364l-1.757 1.757" />
			</svg>
		),
	},
	{
		title: 'Real-Time Analytics',
		description:
			'Track revenue, payments, and performance as they happen. Now the chart actually makes sense.',
		icon: (
			<svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
			</svg>
		),
	},
	{
		title: 'AI Evaluation Tool',
		description:
			'Automatically analyzes reports and key metrics using AI. Directly tied to the cards and numbers shown.',
		icon: (
			<svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
			</svg>
		),
	},
	{
		title: 'Editing Photos',
		description:
			'Crop, adjust, and prepare images directly within the platform.',
		icon: (
			<svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
			</svg>
		),
	},
] as const

const FAQ_ITEMS = [
	{
		question: 'What is Gut8erPRO?',
		answer:
			'Gut8erPRO is a professional vehicle damage assessment web app designed for Kfz-Sachverst\u00e4ndige. Create detailed reports, auto-fill data from images, and streamline your entire workflow.',
	},
	{
		question: 'How does image auto-fill work?',
		answer:
			'Our AI analyzes uploaded vehicle photos to automatically detect damage, read VIN numbers, and pre-populate report fields. Simply upload your images and let the system extract the relevant data for you.',
	},
	{
		question: 'What integrations are available?',
		answer:
			'Gut8erPRO integrates with DAT SilverDAT3 for vehicle data, valuation, and repair cost calculation. Support for Audatex and GT Motive is coming soon. The platform also supports Google and Apple social login, Stripe for payments, and email delivery for sending reports.',
	},
	{
		question: 'Is there a free trial?',
		answer:
			'Yes! When you sign up for the Pro plan, you get full access to all premium features for 14 days at no charge. Your payment details are collected upfront but you will not be charged until the trial period ends. You can cancel anytime during the trial.',
	},
	{
		question: 'What support is available?',
		answer:
			'Free tier users have access to our knowledge base and community forum. Pro subscribers receive priority email support with guaranteed response times, along with onboarding assistance and dedicated account management.',
	},
] as const

const STATS = [
	{ value: '-35%', label: 'Report time' },
	{ value: '-60%', label: 'Manual work' },
	{ value: '2,000+', label: 'Professionals' },
] as const

function SparkleIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
			<path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
		</svg>
	)
}

function LandingPage() {
	const { isAuthenticated, loading } = useAuth()
	const router = useRouter()

	return (
		<div className="min-h-screen bg-white">
			{/* Navigation */}
			<header className="border-b border-border">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
					<h1
						className="cursor-pointer text-h3 font-bold text-black"
						onClick={() => router.push(isAuthenticated ? '/dashboard' : '/')}
					>
						Gut8er<span className="text-primary">PRO</span>
					</h1>
					<nav className="flex items-center gap-4">
						{!loading && isAuthenticated ? (
							<Button size="md" onClick={() => router.push('/dashboard')}>
								Dashboard
							</Button>
						) : (
							<>
								<Link
									href="/login"
									className="text-body-sm font-medium text-grey-100 transition-colors hover:text-black"
								>
									Log In
								</Link>
								<Button asChild variant="outline" size="md">
									<Link href="/signup/account">Sign Up for Free</Link>
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
							Now with AI-powered auto-fill
						</span>
					</div>

					<h2 className="text-display font-bold leading-tight text-black">
						Professional Vehicle Assessment
						<br />
						Made Simple
					</h2>
					<p className="mx-auto mt-6 max-w-2xl text-body text-grey-100">
						Create damage reports in minutes, not hours. Upload images, let AI do
						the work, and focus on what matters — your expertise.
					</p>
					<div className="mt-8 flex justify-center">
						<Button asChild size="lg">
							<Link href="/signup/account">Start Free Trial</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Hero Image + Stats Section */}
			<section className="px-6 pb-20">
				<div className="mx-auto max-w-6xl">
					<div className="relative">
						{/* Placeholder for hero image — replace with actual image of person using tablet on car */}
						<div className="flex h-105 items-center justify-center rounded-xl bg-grey-25">
							<p className="text-body text-grey-100">
								{/* Hero image: person using tablet to assess vehicle damage */}
							</p>
						</div>

						{/* Stats overlay — positioned on the right side of the image */}
						<div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-3 md:right-8">
							{STATS.map((stat) => (
								<div
									key={stat.label}
									className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-card"
								>
									<SparkleIcon className="h-5 w-5 shrink-0 text-primary" />
									<div>
										<p className="text-h4 font-bold text-black">{stat.value}</p>
										<p className="text-caption text-grey-100">{stat.label}</p>
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
						<h3 className="text-h2 font-bold text-black">
							Gut8erPRO Features
						</h3>
						<p className="mx-auto mt-3 max-w-2xl text-body text-grey-100">
							From smart analytics to seamless workflow tools, Gut8erPro gives
							you the clarity and control you need to make faster, better
							decisions.
						</p>
					</div>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						{FEATURES.map((feature) => (
							<Card key={feature.title} padding="lg">
								<CardContent className="flex flex-col gap-4">
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-light">
										{feature.icon}
									</div>
									<div>
										<h4 className="text-h4 font-semibold text-black">
											{feature.title}
										</h4>
										<p className="mt-1 text-body-sm text-grey-100">
											{feature.description}
										</p>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="px-6 py-20">
				<div className="mx-auto max-w-3xl">
					<div className="mb-10 text-center">
						<h3 className="text-h2 font-bold text-black">
							Frequently Asked Questions
						</h3>
						<p className="mt-3 text-body text-grey-100">
							Everything you need to know about Gut8erPro.
						</p>
					</div>
					<div className="flex flex-col">
						{FAQ_ITEMS.map((item) => (
							<CollapsibleSection key={item.question} title={item.question}>
								<p className="text-body-sm text-grey-100">{item.answer}</p>
							</CollapsibleSection>
						))}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border px-6 py-8">
				<div className="mx-auto max-w-7xl text-center">
					<p className="text-body-sm text-grey-100">
						&copy; 2026 Gut8erPRO. All rights reserved.
					</p>
				</div>
			</footer>
		</div>
	)
}

export default LandingPage
