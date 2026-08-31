import Link from 'next/link'
import type { ReactNode } from 'react'

const LINKS = [
	{ href: '/legal/impressum', label: 'Impressum' },
	{ href: '/legal/datenschutz', label: 'Datenschutz' },
	{ href: '/legal/agb', label: 'AGB' },
	{ href: '/legal/widerruf', label: 'Widerruf' },
]

function LegalLayout({ children }: { children: ReactNode }) {
	return (
		<div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
			<nav className="flex flex-wrap gap-4 border-b border-border pb-4">
				{LINKS.map((l) => (
					<Link
						key={l.href}
						href={l.href}
						className="text-body-sm text-grey-100 hover:text-primary"
					>
						{l.label}
					</Link>
				))}
			</nav>
			<article className="prose prose-sm flex max-w-none flex-col gap-4 text-body text-black">
				{children}
			</article>
			<footer className="border-t border-border pt-4 text-caption text-grey-100">
				<Link href="/" className="hover:text-primary">
					← Zurück zur Startseite
				</Link>
			</footer>
		</div>
	)
}

export default LegalLayout
