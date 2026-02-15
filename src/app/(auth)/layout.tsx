import type { ReactNode } from 'react'

function AuthLayout({ children }: { children: ReactNode }) {
	return <div className="min-h-screen bg-white">{children}</div>
}

export default AuthLayout
