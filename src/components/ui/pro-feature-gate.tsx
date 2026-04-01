'use client'

import { Crown } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'

type ProFeatureGateProps = {
	children: ReactNode
	fallback?: ReactNode
	className?: string
}

function _DefaultFallback() {
	return (
		<div className="flex items-center gap-2 rounded-md border border-warning bg-warning-light p-4">
			<Crown className="h-5 w-5 text-warning" />
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-1">
					<Badge variant="warning">Pro Feature</Badge>
				</div>
				<p className="text-caption text-grey-100">
					Upgrade to Pro to unlock this feature.{' '}
					<a href="/settings/billing" className="text-primary underline hover:no-underline">
						Upgrade now
					</a>
				</p>
			</div>
		</div>
	)
}

function ProFeatureGate({ children }: ProFeatureGateProps) {
	// All users are Pro — gate always passes through
	return <>{children}</>
}

export type { ProFeatureGateProps }
export { ProFeatureGate }
