'use client'

import { Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { LOCALE_COOKIE, type Locale } from '@/i18n/config'

function LanguageSwitcher() {
	const locale = useLocale()
	const _t = useTranslations('language')
	const router = useRouter()
	const [isPending, startTransition] = useTransition()

	const nextLocale: Locale = locale === 'en' ? 'de' : 'en'
	const label = locale === 'en' ? 'Deutsch' : 'English'

	function switchLocale() {
		document.cookie = `${LOCALE_COOKIE}=${nextLocale};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`
		startTransition(() => {
			router.refresh()
		})
	}

	return (
		<button
			type="button"
			onClick={switchLocale}
			disabled={isPending}
			className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-body-sm text-grey-100 transition-colors hover:bg-grey-25 hover:text-black disabled:opacity-50"
		>
			<Globe className="h-5 w-5 shrink-0" />
			<span>{isPending ? '...' : label}</span>
		</button>
	)
}

export { LanguageSwitcher }
