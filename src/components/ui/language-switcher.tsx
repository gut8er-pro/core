'use client'

import { Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useTransition } from 'react'
import { LOCALE_COOKIE, type Locale } from '@/i18n/config'
import { cn } from '@/lib/utils'

type LanguageSwitcherProps = {
	/** Compact: just a small button with flag/code. Full: wider with label text. */
	variant?: 'compact' | 'full'
	className?: string
}

function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
	const locale = useLocale()
	const router = useRouter()
	const [isPending, startTransition] = useTransition()

	const nextLocale: Locale = locale === 'en' ? 'de' : 'en'
	const currentFlag = locale === 'de' ? '🇩🇪' : '🇬🇧'
	const label = locale === 'en' ? 'Deutsch' : 'English'

	function switchLocale() {
		document.cookie = `${LOCALE_COOKIE}=${nextLocale};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`
		startTransition(() => {
			router.refresh()
		})
	}

	if (variant === 'full') {
		return (
			<button
				type="button"
				onClick={switchLocale}
				disabled={isPending}
				className={cn(
					'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-body-sm text-grey-100 transition-colors hover:bg-grey-25 hover:text-black disabled:opacity-50',
					className,
				)}
			>
				<Globe className="h-5 w-5 shrink-0" />
				<span>{isPending ? '...' : label}</span>
			</button>
		)
	}

	return (
		<button
			type="button"
			onClick={switchLocale}
			disabled={isPending}
			className={cn(
				'flex h-10 w-10 cursor-pointer items-center justify-center rounded-btn text-grey-100 transition-colors hover:bg-grey-25 hover:text-black disabled:opacity-50 sm:h-12.5 sm:w-12.5',
				className,
			)}
			aria-label={`Switch to ${label}`}
			title={label}
		>
			<span className="text-body-sm sm:text-body">{isPending ? '...' : currentFlag}</span>
		</button>
	)
}

export { LanguageSwitcher }
