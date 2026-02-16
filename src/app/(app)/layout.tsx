'use client'

import { type ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { TopNavBar } from '@/components/layout/top-nav-bar'
import { useAuth } from '@/hooks/use-auth'
import { useUserSettings } from '@/hooks/use-settings'
import { useProStore } from '@/stores/pro-store'
import { logout } from '@/lib/auth/actions'

function AppLayout({ children }: { children: ReactNode }) {
	const router = useRouter()
	const pathname = usePathname()
	const { user, loading } = useAuth()
	const { data: settings } = useUserSettings()
	const setIsPro = useProStore((s) => s.setIsPro)

	// Hydrate Pro store from user's plan in the database
	useEffect(() => {
		if (settings?.plan) {
			setIsPro(settings.plan === 'PRO')
		}
	}, [settings?.plan, setIsPro])

	function handleNavigate(path: string) {
		router.push(path)
	}

	function handleLogout() {
		logout()
	}

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-grey-25 border-t-primary" />
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-surface-secondary">
			<TopNavBar
				userName={
					(user?.user_metadata?.['first_name'] as string | undefined) ??
					(user?.email?.split('@')[0] ?? undefined)
				}
				userRole={
					(user?.user_metadata?.['professional_qualification'] as string | undefined) ??
					'Sachverständiger'
				}
				activePath={
					pathname.startsWith('/dashboard') ? '/dashboard'
					: pathname.startsWith('/statistics') ? '/statistics'
					: pathname.startsWith('/settings') ? '/settings'
					: undefined
				}
				onNavigate={handleNavigate}
				onLogout={handleLogout}
			/>
			<main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
		</div>
	)
}

export default AppLayout
