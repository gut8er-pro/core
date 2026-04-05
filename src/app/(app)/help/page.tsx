'use client'

import { ArrowLeft, BookOpen, FileText, HelpCircle, Mail, PlayCircle, Search } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type Article = {
	slug: string
	title: string
	description: string
	content: string[]
}

type HelpCategory = {
	icon: typeof PlayCircle
	title: string
	description: string
	articles: Article[]
}

const HELP_CATEGORIES: HelpCategory[] = [
	{
		icon: PlayCircle,
		title: 'Getting Started',
		description: 'Learn the basics of Gut8erPRO',
		articles: [
			{
				slug: 'first-report',
				title: 'Creating your first report',
				description: 'Step-by-step guide to your first vehicle assessment',
				content: [
					'From the Dashboard, click the "+ New Report" button in the top right corner.',
					'Select the report type that matches your assessment: HS (Liability), BE (Evaluation), KG (Short Report), or OT (Oldtimer Valuation).',
					'You will be taken to the Gallery tab where you can upload vehicle photos. Drag and drop or click to upload up to 20 images.',
					'Once photos are uploaded, click "Generate Report" to let AI analyze the images and pre-fill report fields.',
					'Navigate through the tabs — Accident Info, Vehicle, Condition, Calculation, and Invoice — to review and complete all sections.',
					'When finished, go to the Export & Send tab to generate a PDF and email it to the recipient.',
				],
			},
			{
				slug: 'uploading-photos',
				title: 'Uploading photos',
				description: 'Best practices for vehicle damage photography',
				content: [
					'Gut8erPRO supports JPG and PNG image formats. Each report can contain up to 20 photos.',
					'For best results, photograph the vehicle in good natural lighting. Avoid using flash as it can create reflections that obscure damage.',
					'Take photos from multiple angles: front, rear, both sides, and close-ups of each damaged area.',
					'Include at least one photo of the VIN plate or registration document for automatic vehicle identification.',
					'Photos can be reordered by dragging them in the gallery grid view.',
					'To annotate a photo, click on it to open the single view, then click the draw/annotate button to mark up damage areas.',
				],
			},
			{
				slug: 'ai-autofill',
				title: 'Using AI auto-fill',
				description: 'Let AI analyze your photos and pre-fill report data',
				content: [
					'After uploading your vehicle photos, click the "Generate Report" button in the gallery.',
					'The AI will analyze each photo to detect damage, read VIN numbers, and identify vehicle details.',
					'Once processing is complete, report fields across all tabs will be pre-filled with detected data.',
					'Always review the AI-generated data carefully. While accurate in most cases, some fields may need manual correction.',
					'AI auto-fill is available for all Pro plan users. It works best with clear, well-lit photos taken from standard angles.',
				],
			},
			{
				slug: 'report-types',
				title: 'Understanding report types',
				description: 'HS, BE, KG, OT — which report type to use',
				content: [
					'HS (Haftpflichtschaden / Liability): The standard report for third-party liability claims. Includes full accident details, opponent information, vehicle data, damage assessment, repair calculation, and loss of use.',
					'BE (Bewertung / Evaluation): Used for vehicle valuation without an accident context. Includes DAT valuation, manual valuation, and correction calculation. No accident or opponent sections.',
					'KG (Kurzgutachten / Short Report): A simplified version of the HS report. Includes the same sections but without the correction calculation and result cards. Ideal for minor damage claims.',
					'OT (Oldtimer / Classic Car Valuation): Specialized report for classic and vintage vehicles. Includes market value, replacement value, restoration value, and vehicle grading. Uses "Client" instead of "Claimant" terminology.',
					'Choose the report type when creating a new report from the Dashboard. The type determines which sections and fields are available.',
				],
			},
		],
	},
	{
		icon: FileText,
		title: 'Reports & Documents',
		description: 'Creating, editing, and exporting reports',
		articles: [
			{
				slug: 'report-sections',
				title: 'Report sections explained',
				description: 'Accident Info, Vehicle, Condition, Calculation, Invoice',
				content: [
					'Accident Info: Contains accident details (date, location), claimant information, opponent data, site visits, expert opinion, and digital signatures. For OT reports, this tab is called "Customer" and has a simplified layout.',
					'Vehicle: Enter vehicle identification (VIN, manufacturer, model), technical specifications (power, engine, transmission), and details (type, motor, axles, doors, seats).',
					'Condition: Document the vehicle condition including paint type, body/interior condition, mileage, and MOT date. Use the interactive damage diagram to mark impact points and the paint tab to record thickness measurements.',
					'Calculation: Enter vehicle value, repair costs, and loss of use data. For BE reports, this tab shows DAT and manual valuation sections. For OT reports, it shows market value and restoration costs.',
					'Invoice: Generate an invoice with BVSK standard rates. Add custom line items, set tax rates, and configure e-invoice settings.',
				],
			},
			{
				slug: 'damage-diagram',
				title: 'Damage diagram & paint thickness',
				description: 'How to mark damage and measure paint',
				content: [
					'In the Condition tab, switch to the "Damage" sub-tab to access the interactive damage diagram.',
					'Click on any area of the car silhouette to place a damage marker. Each marker can have a description added.',
					'Switch to the "Paint" sub-tab to record paint thickness measurements. Enter values in micrometers (µm) for each body panel.',
					'Paint thickness is color-coded automatically: Blue (<70µm), Green (70-160µm), Yellow (160-300µm), Orange (300-700µm), Red (>700µm).',
					'All damage markers and paint readings are saved automatically and included in the PDF export.',
				],
			},
			{
				slug: 'export-send',
				title: 'Exporting & sending reports',
				description: 'PDF export, email delivery, and report locking',
				content: [
					'Go to the Export & Send tab to finalize your report.',
					'Configure document toggles: include/exclude vehicle valuation, commission, and invoice sections in the PDF.',
					'Enter the recipient email address and customize the email subject and body using the rich text editor.',
					'Click "Send Report" to generate the PDF and email it directly to the recipient.',
					'Toggle "Lock Report" to make the report read-only after sending. This prevents accidental edits.',
					'Locked reports can be unlocked at any time by returning to the Export & Send tab and toggling the lock off.',
				],
			},
			{
				slug: 'invoice-bvsk',
				title: 'Invoice & BVSK rates',
				description: 'Setting up invoices with standard fee schedules',
				content: [
					'The Invoice tab auto-generates an invoice number for each report.',
					'Click "Apply Rate" to load BVSK (Bundesverband der freiberuflichen und unabhängigen Sachverständigen) standard fee rates.',
					'BVSK rates are calculated based on the repair cost amount and standard fee schedules.',
					'Add custom line items using the "Add Item" button. Each item has a description, quantity, unit price, and tax rate.',
					'The invoice total, including VAT, is calculated automatically and displayed at the bottom.',
					'Toggle "E-Invoice" to generate an electronic invoice in ZUGFeRD format for German market compliance.',
				],
			},
		],
	},
	{
		icon: BookOpen,
		title: 'Integrations',
		description: 'DAT, Audatex, and other tools',
		articles: [
			{
				slug: 'dat-setup',
				title: 'Setting up DAT SilverDAT3',
				description: 'Connect your DAT account for vehicle data & valuation',
				content: [
					'Go to Settings → Integrations to configure your DAT SilverDAT3 connection.',
					'Enter your DAT username and password. These credentials are encrypted and stored securely.',
					'Once connected, DAT vehicle data and valuation services will be available in your reports.',
					'If you do not have a DAT account, visit dat.de to register for SilverDAT3 access.',
					'You can also configure DAT credentials during the signup process in the Integrations step.',
					'Support for Audatex and GT Motive integrations is coming soon.',
				],
			},
			{
				slug: 'vin-lookup',
				title: 'VIN lookup & vehicle identification',
				description: 'Automatic vehicle data retrieval via VIN',
				content: [
					'Enter the 17-character Vehicle Identification Number (VIN) in the Vehicle tab under Identification.',
					'With DAT integration active, the system can automatically retrieve vehicle data including manufacturer, model, engine specs, and more.',
					'AI photo analysis can also detect VIN numbers from photos of the VIN plate or registration document.',
					'The VIN field validates for exactly 17 characters and accepted alphanumeric format.',
					'Retrieved data populates the Vehicle tab fields automatically, saving manual data entry time.',
				],
			},
			{
				slug: 'repair-calculation',
				title: 'Repair cost calculation',
				description: 'Using DAT for repair cost estimates',
				content: [
					'In the Calculation tab, you can use DAT integration to get professional repair cost estimates.',
					'Enter the vehicle details and damage description to generate a calculation via DAT.',
					'The calculation includes parts costs, labor hours, paint materials, and supplementary costs.',
					'Results are automatically populated in the Calculation tab fields.',
					'You can manually adjust any calculated values if needed for your specific assessment.',
				],
			},
		],
	},
	{
		icon: HelpCircle,
		title: 'Account & Billing',
		description: 'Subscription, payments, and settings',
		articles: [
			{
				slug: 'subscription',
				title: 'Managing your subscription',
				description: 'View billing, update payment method, cancel plan',
				content: [
					'Go to Settings → Billing to view your current subscription status, payment method, and billing history.',
					'Your Pro Plan subscription is €69/month with a 7-day free trial period.',
					'Click "Manage Plan" to open the Stripe billing portal where you can update your payment method, view invoices, or cancel your subscription.',
					'If you cancel, your access continues until the end of the current billing period.',
					'Download past invoices directly from the Billing History section using the download button.',
				],
			},
			{
				slug: 'free-trial',
				title: 'Free trial information',
				description: '7-day trial — what happens when it ends',
				content: [
					'Every new account starts with a 7-day free trial with full access to all Pro features.',
					'Your payment card is validated during signup but you will not be charged until the trial ends.',
					'You can cancel anytime during the trial period without being charged.',
					'After the trial, your subscription automatically converts to the paid Pro plan at €69/month.',
					'If you cancel during or after the trial, your account remains accessible but features may be limited.',
					'You can reactivate your subscription at any time from Settings → Billing.',
				],
			},
			{
				slug: 'profile-settings',
				title: 'Profile & business settings',
				description: 'Update your personal and company information',
				content: [
					'Go to Settings → Profile to update your name, phone number, and social media links.',
					'Go to Settings → Business to update your company name, address, tax ID (Steuernummer), and VAT ID (USt-IdNr).',
					'Upload a company logo in the Business section. This logo appears on your generated PDF reports.',
					'Your professional qualification (e.g., Sachverständiger) is displayed in the app header and on reports.',
					'Changes to profile and business settings are saved automatically when you click the Save button.',
				],
			},
		],
	},
]

const FAQ_ITEMS = [
	{
		question: 'How do I reset my password?',
		answer: 'Go to the login page and click "Forgot password?" to receive a reset link via email.',
	},
	{
		question: 'Can I export reports as PDF?',
		answer:
			'Yes. Go to the Export & Send tab in any report to generate and download a PDF. You can also email it directly to recipients.',
	},
	{
		question: 'How does the 7-day trial work?',
		answer:
			'When you sign up, you get full access to all features for 7 days. Your card is validated but not charged until the trial ends. Cancel anytime before that.',
	},
	{
		question: 'What image formats are supported?',
		answer:
			'JPG and PNG formats are supported. For best results, use good lighting and avoid flash. Maximum 20 photos per report.',
	},
	{
		question: 'Can I unlock a locked report?',
		answer:
			'Yes. Go to the Export & Send tab and toggle off the "Lock Report" switch to make it editable again.',
	},
	{
		question: 'How do I connect my DAT account?',
		answer:
			'Go to Settings → Integrations and enter your DAT SilverDAT3 credentials. You can also set this up during the signup process.',
	},
]

function HelpPage() {
	const [searchQuery, setSearchQuery] = useState('')
	const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
	const [activeArticle, setActiveArticle] = useState<Article | null>(null)

	// Flatten all articles for search
	const allArticles = HELP_CATEGORIES.flatMap((cat) =>
		cat.articles.map((a) => ({ ...a, category: cat.title })),
	)

	const filteredArticles = searchQuery
		? allArticles.filter(
				(a) =>
					a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
					a.content.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase())),
			)
		: []

	const filteredFaq = searchQuery
		? FAQ_ITEMS.filter(
				(item) =>
					item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: FAQ_ITEMS

	// Article detail view
	if (activeArticle) {
		return (
			<div className="flex flex-col gap-6">
				<button
					type="button"
					onClick={() => setActiveArticle(null)}
					className="flex items-center gap-2 text-body-sm font-medium text-grey-100 transition-colors hover:text-black"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Help
				</button>

				<div className="rounded-card border-2 border-border-card bg-white p-8">
					<h1 className="text-h2 font-medium text-black">{activeArticle.title}</h1>
					<p className="mt-2 text-body text-grey-100">{activeArticle.description}</p>

					<div className="mt-8 flex flex-col gap-6">
						{activeArticle.content.map((paragraph, idx) => (
							<div key={paragraph.slice(0, 30)} className="flex gap-4">
								<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-caption font-medium text-primary">
									{idx + 1}
								</div>
								<p className="text-body-sm leading-relaxed text-text-secondary">{paragraph}</p>
							</div>
						))}
					</div>
				</div>

				{/* Related articles */}
				<div className="flex flex-col gap-4">
					<h3 className="text-input font-medium text-black">Related articles</h3>
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						{allArticles
							.filter((a) => a.slug !== activeArticle.slug)
							.slice(0, 4)
							.map((article) => (
								<button
									key={article.slug}
									type="button"
									onClick={() => setActiveArticle(article)}
									className="flex flex-col gap-1 rounded-xl border-2 border-border-card bg-white px-5 py-4 text-left transition-colors hover:border-primary/30"
								>
									<span className="text-body-sm font-medium text-black">{article.title}</span>
									<span className="text-caption text-grey-100">{article.description}</span>
								</button>
							))}
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-8">
			{/* Header */}
			<div className="flex flex-col gap-4">
				<h1 className="text-page-title font-medium leading-none text-black">Help & Support</h1>
				<p className="text-body text-grey-100">
					Find answers to your questions or reach out to our support team.
				</p>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-100" />
				<input
					type="text"
					placeholder="Search help articles..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="h-14 w-full rounded-xl border-2 border-border bg-white pl-12 pr-4 text-body text-black placeholder:text-grey-100 focus:border-primary focus:outline-none"
				/>
			</div>

			{/* Search Results */}
			{searchQuery && filteredArticles.length > 0 && (
				<div className="flex flex-col gap-3">
					<h2 className="text-input font-medium text-black">
						{filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''} for &ldquo;
						{searchQuery}&rdquo;
					</h2>
					<div className="flex flex-col gap-2">
						{filteredArticles.map((article) => (
							<button
								key={article.slug}
								type="button"
								onClick={() => {
									setActiveArticle(article)
									setSearchQuery('')
								}}
								className="flex flex-col gap-1 rounded-xl border-2 border-border-card bg-white px-5 py-4 text-left transition-colors hover:border-primary/30"
							>
								<div className="flex items-center gap-2">
									<span className="text-body-sm font-medium text-black">{article.title}</span>
									<span className="rounded-md bg-surface-secondary px-2 py-0.5 text-caption text-grey-100">
										{article.category}
									</span>
								</div>
								<span className="text-caption text-grey-100">{article.description}</span>
							</button>
						))}
					</div>
				</div>
			)}

			{searchQuery && filteredArticles.length === 0 && filteredFaq.length === 0 && (
				<p className="py-8 text-center text-body-sm text-grey-100">
					No results found for &ldquo;{searchQuery}&rdquo;
				</p>
			)}

			{/* Help Categories */}
			{!searchQuery && (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{HELP_CATEGORIES.map((category) => {
						const Icon = category.icon
						return (
							<div
								key={category.title}
								className="flex flex-col gap-4 rounded-card border-2 border-border-card bg-white p-6"
							>
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
										<Icon className="h-5 w-5 text-primary" />
									</div>
									<div>
										<h3 className="text-input font-medium text-black">{category.title}</h3>
										<p className="text-caption text-grey-100">{category.description}</p>
									</div>
								</div>
								<ul className="flex flex-col gap-1">
									{category.articles.map((article) => (
										<li key={article.slug}>
											<button
												type="button"
												onClick={() => setActiveArticle(article)}
												className="flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-secondary"
											>
												<span className="text-body-sm font-medium text-black">{article.title}</span>
												<span className="text-caption text-grey-100">{article.description}</span>
											</button>
										</li>
									))}
								</ul>
							</div>
						)
					})}
				</div>
			)}

			{/* FAQ */}
			<div className="flex flex-col gap-4">
				<h2 className="text-h3 font-medium text-black">Frequently Asked Questions</h2>
				<div className="flex flex-col gap-2">
					{filteredFaq.map((item, idx) => (
						<div
							key={item.question}
							className="overflow-hidden rounded-xl border-2 border-border-card bg-white"
						>
							<button
								type="button"
								onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
								className="flex w-full items-center justify-between px-6 py-4 text-left"
							>
								<span className="text-body font-medium text-black">{item.question}</span>
								<span
									className={cn(
										'text-h3 text-grey-100 transition-transform',
										expandedFaq === idx && 'rotate-45',
									)}
								>
									+
								</span>
							</button>
							{expandedFaq === idx && (
								<div className="border-t border-border-card px-6 py-4">
									<p className="text-body-sm leading-relaxed text-grey-100">{item.answer}</p>
								</div>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Contact Support */}
			<div className="flex flex-col gap-4 rounded-card border-2 border-border-card bg-white p-8">
				<h2 className="text-h3 font-medium text-black">Still need help?</h2>
				<p className="text-body-sm text-grey-100">
					Our support team is here to help you get the most out of Gut8erPRO.
				</p>
				<a
					href="mailto:support@gut8erpro.de"
					className="flex w-fit items-center justify-center gap-2 rounded-btn bg-primary px-6 py-3 text-body-sm font-medium text-white transition-colors hover:bg-primary-hover"
				>
					<Mail className="h-4 w-4" />
					Email Support
				</a>
			</div>
		</div>
	)
}

export default HelpPage
