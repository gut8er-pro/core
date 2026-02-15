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
			'Seamless connection to SilverDAT3 for vehicle data, valuation, and repair cost calculation. Import vehicle details with a single click.',
		icon: (
			<svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 0 0-1.242-7.244l4.5-4.5a4.5 4.5 0 0 1 6.364 6.364l-1.757 1.757" />
			</svg>
		),
	},
	{
		title: 'Smart Analytics',
		description:
			'AI-powered damage detection and auto-fill from photos. Automatically identify vehicle damage, read VINs, and pre-populate report fields.',
		icon: (
			<svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
			</svg>
		),
	},
	{
		title: 'Photo Editing',
		description:
			'Upload, annotate, and document vehicle damage with built-in drawing tools. Mark damage areas directly on photos with arrows, circles, and text.',
		icon: (
			<svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
			</svg>
		),
	},
	{
		title: 'Digital Invoicing',
		description:
			'Generate BVSK-compliant invoices automatically. Customizable line items, electronic invoice support (ZUGFeRD), and one-click PDF export.',
		icon: (
			<svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
			</svg>
		),
	},
] as const

const FAQ_ITEMS = [
	{
		question: 'What is Gut8erPRO?',
		answer:
			'Gut8erPRO is a professional vehicle damage assessment web application designed for German automotive experts (Kfz-Sachverstaendige). It streamlines the creation of insurance damage reports by combining photo upload, AI-powered analysis, vehicle data integration, interactive damage diagrams, calculation, invoicing, and digital signatures into one unified workflow.',
	},
	{
		question: 'How does the 14-day free trial work?',
		answer:
			'When you sign up for the Pro plan, you get full access to all premium features for 14 days at no charge. Your payment details are collected upfront but you will not be charged until the trial period ends. You can cancel anytime during the trial without being charged.',
	},
	{
		question: 'What integrations are available?',
		answer:
			'Gut8erPRO integrates with DAT SilverDAT3 for vehicle data, valuation, and repair cost calculation. Support for Audatex and GT Motive is coming soon. The platform also supports Google and Apple social login, Stripe for payments, and email delivery for sending reports.',
	},
	{
		question: 'Can I export reports as PDF?',
		answer:
			'Yes. Every report can be exported as a professional PDF document. You can toggle which sections to include, add digital signatures, and send the finished report directly via email from within the application.',
	},
	{
		question: 'How secure is my data?',
		answer:
			'Your data is stored securely with industry-standard encryption. Sensitive credentials (such as DAT integration keys) are encrypted at rest. We use Supabase for authentication with row-level security policies, and all communication is encrypted via HTTPS.',
	},
] as const

const STATS = [
	{ value: '1000+', label: 'Reports' },
	{ value: '50+', label: 'Experts' },
	{ value: '4.9', label: 'Rating' },
] as const

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
								<Button asChild size="md">
									<Link href="/signup/account">Get Started Free</Link>
								</Button>
							</>
						)}
					</nav>
				</div>
			</header>

			{/* Hero Section */}
			<section className="px-6 py-12">
				<div className="mx-auto max-w-4xl text-center">
					<h2 className="text-h1 font-bold leading-tight text-black">
						Professional Vehicle
						<br />
						Damage Assessment
					</h2>
					<p className="mx-auto mt-6 max-w-2xl text-body text-grey-100">
						The all-in-one platform for German automotive experts.
						Create comprehensive damage reports with AI-powered analysis,
						DAT integration, and BVSK-compliant invoicing.
					</p>
					<div className="mt-8 flex items-center justify-center gap-4">
						<Button asChild size="lg">
							<Link href="/signup/account">Get Started Free</Link>
						</Button>
						<Button asChild variant="outline" size="lg">
							<Link href="/login">Log In</Link>
						</Button>
					</div>

					{/* Stats */}
					<div className="mt-12 flex items-center justify-center gap-8">
						{STATS.map((stat) => (
							<div key={stat.label} className="text-center">
								<p className="text-h2 font-bold text-primary">{stat.value}</p>
								<p className="text-body-sm text-grey-100">{stat.label}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="bg-surface-secondary px-6 py-12">
				<div className="mx-auto max-w-6xl">
					<div className="mb-8 text-center">
						<h3 className="text-h2 font-bold text-black">
							Everything you need
						</h3>
						<p className="mt-2 text-body text-grey-100">
							Powerful tools designed for professional vehicle assessors.
						</p>
					</div>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						{FEATURES.map((feature) => (
							<Card key={feature.title} padding="lg">
								<CardContent className="flex flex-col gap-4">
									<div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary-light">
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
			<section className="px-6 py-12">
				<div className="mx-auto max-w-3xl">
					<div className="mb-8 text-center">
						<h3 className="text-h2 font-bold text-black">
							Frequently Asked Questions
						</h3>
						<p className="mt-2 text-body text-grey-100">
							Find answers to common questions about Gut8erPRO.
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
			<footer className="border-t border-border bg-surface-secondary px-6 py-8">
				<div className="mx-auto flex max-w-7xl flex-col items-center gap-4 md:flex-row md:justify-between">
					<h2 className="text-h4 font-bold text-black">
						Gut8er<span className="text-primary">PRO</span>
					</h2>
					<nav className="flex items-center gap-6">
						<Link
							href="/privacy"
							className="text-body-sm text-grey-100 transition-colors hover:text-black"
						>
							Privacy
						</Link>
						<Link
							href="/terms"
							className="text-body-sm text-grey-100 transition-colors hover:text-black"
						>
							Terms
						</Link>
						<Link
							href="/contact"
							className="text-body-sm text-grey-100 transition-colors hover:text-black"
						>
							Contact
						</Link>
					</nav>
					<p className="text-caption text-grey-100">
						&copy; {new Date().getFullYear()} Gut8erPRO. All rights reserved.
					</p>
				</div>
			</footer>
		</div>
	)
}

export default LandingPage
