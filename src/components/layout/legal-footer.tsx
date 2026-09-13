'use client'

import { useTranslations } from 'next-intl'
import { marketingUrl } from '@/lib/urls'
import { cn } from '@/lib/utils'

/**
 * The four legal pages live on the marketing site, not in this app (ADR 0001),
 * so every entry is an absolute cross-origin link built from
 * `NEXT_PUBLIC_MARKETING_URL` — never a same-origin path.
 *
 * German law wants the Impressum (§ 5 TMG) and the privacy notice (DSGVO
 * Art. 13) reachable from every page, which is why this sits in the layouts
 * rather than on a single screen.
 */
const LEGAL_LINKS = [
	{ key: 'impressum', path: '/legal/impressum' },
	{ key: 'datenschutz', path: '/legal/datenschutz' },
	{ key: 'agb', path: '/legal/agb' },
	{ key: 'widerruf', path: '/legal/widerruf' },
] as const

function LegalFooter({ className }: { className?: string }) {
	const t = useTranslations('legal')

	return (
		<footer
			className={cn(
				'flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-6',
				className,
			)}
		>
			{LEGAL_LINKS.map(({ key, path }) => (
				<a
					key={key}
					href={marketingUrl(path)}
					className="text-caption text-grey-100 underline-offset-4 transition-colors hover:text-black hover:underline"
				>
					{t(key)}
				</a>
			))}
		</footer>
	)
}

export { LegalFooter }
