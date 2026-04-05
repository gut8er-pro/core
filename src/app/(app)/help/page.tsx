'use client'

import { ArrowLeft, BookOpen, FileText, HelpCircle, Mail, PlayCircle, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type Article = {
	slug: string
	titleKey: string
	descriptionKey: string
	contentKeys: string[]
}

type HelpCategory = {
	icon: typeof PlayCircle
	categoryKey: string
	articles: Article[]
}

const HELP_CATEGORIES: HelpCategory[] = [
	{
		icon: PlayCircle,
		categoryKey: 'gettingStarted',
		articles: [
			{
				slug: 'first-report',
				titleKey: 'categories.gettingStarted.articles.firstReport.title',
				descriptionKey: 'categories.gettingStarted.articles.firstReport.description',
				contentKeys: [
					'categories.gettingStarted.articles.firstReport.content.0',
					'categories.gettingStarted.articles.firstReport.content.1',
					'categories.gettingStarted.articles.firstReport.content.2',
					'categories.gettingStarted.articles.firstReport.content.3',
					'categories.gettingStarted.articles.firstReport.content.4',
					'categories.gettingStarted.articles.firstReport.content.5',
				],
			},
			{
				slug: 'uploading-photos',
				titleKey: 'categories.gettingStarted.articles.uploadingPhotos.title',
				descriptionKey: 'categories.gettingStarted.articles.uploadingPhotos.description',
				contentKeys: [
					'categories.gettingStarted.articles.uploadingPhotos.content.0',
					'categories.gettingStarted.articles.uploadingPhotos.content.1',
					'categories.gettingStarted.articles.uploadingPhotos.content.2',
					'categories.gettingStarted.articles.uploadingPhotos.content.3',
					'categories.gettingStarted.articles.uploadingPhotos.content.4',
					'categories.gettingStarted.articles.uploadingPhotos.content.5',
				],
			},
			{
				slug: 'ai-autofill',
				titleKey: 'categories.gettingStarted.articles.aiAutoFill.title',
				descriptionKey: 'categories.gettingStarted.articles.aiAutoFill.description',
				contentKeys: [
					'categories.gettingStarted.articles.aiAutoFill.content.0',
					'categories.gettingStarted.articles.aiAutoFill.content.1',
					'categories.gettingStarted.articles.aiAutoFill.content.2',
					'categories.gettingStarted.articles.aiAutoFill.content.3',
					'categories.gettingStarted.articles.aiAutoFill.content.4',
				],
			},
			{
				slug: 'report-types',
				titleKey: 'categories.gettingStarted.articles.reportTypes.title',
				descriptionKey: 'categories.gettingStarted.articles.reportTypes.description',
				contentKeys: [
					'categories.gettingStarted.articles.reportTypes.content.0',
					'categories.gettingStarted.articles.reportTypes.content.1',
					'categories.gettingStarted.articles.reportTypes.content.2',
					'categories.gettingStarted.articles.reportTypes.content.3',
					'categories.gettingStarted.articles.reportTypes.content.4',
				],
			},
		],
	},
	{
		icon: FileText,
		categoryKey: 'reportsAndDocuments',
		articles: [
			{
				slug: 'report-sections',
				titleKey: 'categories.reportsAndDocuments.articles.reportSections.title',
				descriptionKey: 'categories.reportsAndDocuments.articles.reportSections.description',
				contentKeys: [
					'categories.reportsAndDocuments.articles.reportSections.content.0',
					'categories.reportsAndDocuments.articles.reportSections.content.1',
					'categories.reportsAndDocuments.articles.reportSections.content.2',
					'categories.reportsAndDocuments.articles.reportSections.content.3',
					'categories.reportsAndDocuments.articles.reportSections.content.4',
				],
			},
			{
				slug: 'damage-diagram',
				titleKey: 'categories.reportsAndDocuments.articles.damageDiagram.title',
				descriptionKey: 'categories.reportsAndDocuments.articles.damageDiagram.description',
				contentKeys: [
					'categories.reportsAndDocuments.articles.damageDiagram.content.0',
					'categories.reportsAndDocuments.articles.damageDiagram.content.1',
					'categories.reportsAndDocuments.articles.damageDiagram.content.2',
					'categories.reportsAndDocuments.articles.damageDiagram.content.3',
					'categories.reportsAndDocuments.articles.damageDiagram.content.4',
				],
			},
			{
				slug: 'export-send',
				titleKey: 'categories.reportsAndDocuments.articles.exportSend.title',
				descriptionKey: 'categories.reportsAndDocuments.articles.exportSend.description',
				contentKeys: [
					'categories.reportsAndDocuments.articles.exportSend.content.0',
					'categories.reportsAndDocuments.articles.exportSend.content.1',
					'categories.reportsAndDocuments.articles.exportSend.content.2',
					'categories.reportsAndDocuments.articles.exportSend.content.3',
					'categories.reportsAndDocuments.articles.exportSend.content.4',
					'categories.reportsAndDocuments.articles.exportSend.content.5',
				],
			},
			{
				slug: 'invoice-bvsk',
				titleKey: 'categories.reportsAndDocuments.articles.invoiceBvsk.title',
				descriptionKey: 'categories.reportsAndDocuments.articles.invoiceBvsk.description',
				contentKeys: [
					'categories.reportsAndDocuments.articles.invoiceBvsk.content.0',
					'categories.reportsAndDocuments.articles.invoiceBvsk.content.1',
					'categories.reportsAndDocuments.articles.invoiceBvsk.content.2',
					'categories.reportsAndDocuments.articles.invoiceBvsk.content.3',
					'categories.reportsAndDocuments.articles.invoiceBvsk.content.4',
					'categories.reportsAndDocuments.articles.invoiceBvsk.content.5',
				],
			},
		],
	},
	{
		icon: BookOpen,
		categoryKey: 'integrations',
		articles: [
			{
				slug: 'dat-setup',
				titleKey: 'categories.integrations.articles.datSetup.title',
				descriptionKey: 'categories.integrations.articles.datSetup.description',
				contentKeys: [
					'categories.integrations.articles.datSetup.content.0',
					'categories.integrations.articles.datSetup.content.1',
					'categories.integrations.articles.datSetup.content.2',
					'categories.integrations.articles.datSetup.content.3',
					'categories.integrations.articles.datSetup.content.4',
					'categories.integrations.articles.datSetup.content.5',
				],
			},
			{
				slug: 'vin-lookup',
				titleKey: 'categories.integrations.articles.vinLookup.title',
				descriptionKey: 'categories.integrations.articles.vinLookup.description',
				contentKeys: [
					'categories.integrations.articles.vinLookup.content.0',
					'categories.integrations.articles.vinLookup.content.1',
					'categories.integrations.articles.vinLookup.content.2',
					'categories.integrations.articles.vinLookup.content.3',
					'categories.integrations.articles.vinLookup.content.4',
				],
			},
			{
				slug: 'repair-calculation',
				titleKey: 'categories.integrations.articles.repairCalculation.title',
				descriptionKey: 'categories.integrations.articles.repairCalculation.description',
				contentKeys: [
					'categories.integrations.articles.repairCalculation.content.0',
					'categories.integrations.articles.repairCalculation.content.1',
					'categories.integrations.articles.repairCalculation.content.2',
					'categories.integrations.articles.repairCalculation.content.3',
					'categories.integrations.articles.repairCalculation.content.4',
				],
			},
		],
	},
	{
		icon: HelpCircle,
		categoryKey: 'accountAndBilling',
		articles: [
			{
				slug: 'subscription',
				titleKey: 'categories.accountAndBilling.articles.subscription.title',
				descriptionKey: 'categories.accountAndBilling.articles.subscription.description',
				contentKeys: [
					'categories.accountAndBilling.articles.subscription.content.0',
					'categories.accountAndBilling.articles.subscription.content.1',
					'categories.accountAndBilling.articles.subscription.content.2',
					'categories.accountAndBilling.articles.subscription.content.3',
					'categories.accountAndBilling.articles.subscription.content.4',
				],
			},
			{
				slug: 'free-trial',
				titleKey: 'categories.accountAndBilling.articles.freeTrial.title',
				descriptionKey: 'categories.accountAndBilling.articles.freeTrial.description',
				contentKeys: [
					'categories.accountAndBilling.articles.freeTrial.content.0',
					'categories.accountAndBilling.articles.freeTrial.content.1',
					'categories.accountAndBilling.articles.freeTrial.content.2',
					'categories.accountAndBilling.articles.freeTrial.content.3',
					'categories.accountAndBilling.articles.freeTrial.content.4',
					'categories.accountAndBilling.articles.freeTrial.content.5',
				],
			},
			{
				slug: 'profile-settings',
				titleKey: 'categories.accountAndBilling.articles.profileSettings.title',
				descriptionKey: 'categories.accountAndBilling.articles.profileSettings.description',
				contentKeys: [
					'categories.accountAndBilling.articles.profileSettings.content.0',
					'categories.accountAndBilling.articles.profileSettings.content.1',
					'categories.accountAndBilling.articles.profileSettings.content.2',
					'categories.accountAndBilling.articles.profileSettings.content.3',
					'categories.accountAndBilling.articles.profileSettings.content.4',
				],
			},
		],
	},
]

const FAQ_KEYS = [
	'resetPassword',
	'exportPdf',
	'trialWork',
	'imageFormats',
	'unlockReport',
	'connectDat',
] as const

function HelpPage() {
	const t = useTranslations('help')
	const [searchQuery, setSearchQuery] = useState('')
	const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
	const [activeArticle, setActiveArticle] = useState<Article | null>(null)

	// Flatten all articles for search
	const allArticles = HELP_CATEGORIES.flatMap((cat) =>
		cat.articles.map((a) => ({
			...a,
			categoryKey: cat.categoryKey,
			title: t(a.titleKey),
			description: t(a.descriptionKey),
			content: a.contentKeys.map((key) => t(key)),
			categoryTitle: t(`categories.${cat.categoryKey}.title`),
		})),
	)

	const filteredArticles = searchQuery
		? allArticles.filter(
				(a) =>
					a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
					a.content.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase())),
			)
		: []

	const faqItems = FAQ_KEYS.map((key) => ({
		key,
		question: t(`faq.${key}.question`),
		answer: t(`faq.${key}.answer`),
	}))

	const filteredFaq = searchQuery
		? faqItems.filter(
				(item) =>
					item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: faqItems

	// Article detail view
	if (activeArticle) {
		const articleContent = activeArticle.contentKeys.map((key) => t(key))
		return (
			<div className="flex flex-col gap-6">
				<button
					type="button"
					onClick={() => setActiveArticle(null)}
					className="flex items-center gap-2 text-body-sm font-medium text-grey-100 transition-colors hover:text-black"
				>
					<ArrowLeft className="h-4 w-4" />
					{t('backToHelp')}
				</button>

				<div className="rounded-card border-2 border-border-card bg-white p-8">
					<h1 className="text-h2 font-medium text-black">{t(activeArticle.titleKey)}</h1>
					<p className="mt-2 text-body text-grey-100">{t(activeArticle.descriptionKey)}</p>

					<div className="mt-8 flex flex-col gap-6">
						{articleContent.map((paragraph, idx) => (
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
					<h3 className="text-input font-medium text-black">{t('relatedArticles')}</h3>
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
				<h1 className="text-page-title font-medium leading-none text-black">{t('title')}</h1>
				<p className="text-body text-grey-100">{t('subtitle')}</p>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-100" />
				<input
					type="text"
					placeholder={t('searchPlaceholder')}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="h-14 w-full rounded-xl border-2 border-border bg-white pl-12 pr-4 text-body text-black placeholder:text-grey-100 focus:border-primary focus:outline-none"
				/>
			</div>

			{/* Search Results */}
			{searchQuery && filteredArticles.length > 0 && (
				<div className="flex flex-col gap-3">
					<h2 className="text-input font-medium text-black">
						{t('searchResults', { count: filteredArticles.length, query: searchQuery })}
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
										{article.categoryTitle}
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
					{t('noResults', { query: searchQuery })}
				</p>
			)}

			{/* Help Categories */}
			{!searchQuery && (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{HELP_CATEGORIES.map((category) => {
						const Icon = category.icon
						const catTitle = t(`categories.${category.categoryKey}.title`)
						const catDescription = t(`categories.${category.categoryKey}.description`)
						return (
							<div
								key={category.categoryKey}
								className="flex flex-col gap-4 rounded-card border-2 border-border-card bg-white p-6"
							>
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
										<Icon className="h-5 w-5 text-primary" />
									</div>
									<div>
										<h3 className="text-input font-medium text-black">{catTitle}</h3>
										<p className="text-caption text-grey-100">{catDescription}</p>
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
												<span className="text-body-sm font-medium text-black">
													{t(article.titleKey)}
												</span>
												<span className="text-caption text-grey-100">
													{t(article.descriptionKey)}
												</span>
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
				<h2 className="text-h3 font-medium text-black">{t('faqTitle')}</h2>
				<div className="flex flex-col gap-2">
					{filteredFaq.map((item, idx) => (
						<div
							key={item.key}
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
				<h2 className="text-h3 font-medium text-black">{t('stillNeedHelp')}</h2>
				<p className="text-body-sm text-grey-100">{t('stillNeedHelpSubtitle')}</p>
				<a
					href="mailto:support@gut8erpro.de"
					className="flex w-fit items-center justify-center gap-2 rounded-btn bg-primary px-6 py-3 text-body-sm font-medium text-white transition-colors hover:bg-primary-hover"
				>
					<Mail className="h-4 w-4" />
					{t('emailSupport')}
				</a>
			</div>
		</div>
	)
}

export default HelpPage
