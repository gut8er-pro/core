import type { ReactNode } from 'react'
import { LegalFooter } from '@/components/layout/legal-footer'

function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-white">
			{children}
			<LegalFooter />
		</div>
	)
}

export default AuthLayout
