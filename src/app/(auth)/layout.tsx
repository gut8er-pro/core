import type { ReactNode } from 'react'
import { LegalFooter } from '@/components/layout/legal-footer'

/**
 * The auth screens are viewport-height shells (the signup wizard scrolls its
 * form column internally), so the legal footer cannot simply be appended after
 * them — that would push every page past 100vh. Instead the layout owns the
 * viewport: children fill the space above the footer and scroll inside it.
 */
function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex h-screen flex-col bg-white">
			<div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
			<LegalFooter className="shrink-0 border-t border-border-subtle" />
		</div>
	)
}

export default AuthLayout
