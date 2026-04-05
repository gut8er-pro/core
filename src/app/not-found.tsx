'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

function NotFoundPage() {
	const t = useTranslations('notFound')

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4">
			<p className="text-display font-bold text-primary">{t('code')}</p>
			<h1 className="mt-4 text-h2 font-bold text-black">{t('title')}</h1>
			<p className="mt-2 text-center text-body-sm text-grey-100">{t('description')}</p>
			<div className="mt-8 flex items-center gap-4">
				<Button asChild>
					<Link href="/dashboard">{t('goToDashboard')}</Link>
				</Button>
				<Button variant="ghost" asChild>
					<Link href="/">{t('goHome')}</Link>
				</Button>
			</div>
		</div>
	)
}

export default NotFoundPage
