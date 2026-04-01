'use client'

import { Scale, Users, Ban, Plus } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SignatureSectionProps } from './types'

const SIGNATURE_TYPES = [
	{ type: 'LAWYER' as const, label: 'Lawyer', icon: Scale },
	{ type: 'DATA_PERMISSION' as const, label: 'Data Permission', icon: Users },
	{ type: 'CANCELLATION' as const, label: 'Cancellation', icon: Ban },
]

function SignatureSection({ signatures, onSignatureClick, className }: SignatureSectionProps) {
	function getSignatureForType(type: string) {
		return signatures.find((sig) => sig.type === type)
	}

	// Find which signature type is currently active (most recently signed)
	const activeType = signatures.length > 0
		? signatures.sort((a, b) => {
			if (!a.signedAt || !b.signedAt) return 0
			return new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()
		})[0]?.type
		: null

	return (
		<CollapsibleSection title="Signatures" info defaultOpen className={className}>
			<div className="flex flex-col gap-4">
				{/* Permission Use label */}
				<p className="text-body-sm font-medium text-black">Permission Use</p>

				{/* 3-card selector */}
				<div className="grid grid-cols-3 gap-4">
					{SIGNATURE_TYPES.map(({ type, label, icon: Icon }) => {
						const signature = getSignatureForType(type)
						const isSigned = signature?.imageUrl !== null && signature?.imageUrl !== undefined
						const isActive = activeType === type

						return (
							<button
								key={type}
								type="button"
								onClick={() => onSignatureClick(type)}
								className={cn(
									'flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 bg-white px-6 py-5 text-center transition-colors',
									isActive
										? 'border-primary bg-primary-light'
										: 'border-border hover:border-primary/50',
								)}
							>
								<Icon className={cn(
									'h-8 w-8',
									isActive ? 'text-primary' : 'text-primary/60',
								)} />
								<span className="text-body-sm font-medium text-black">{label}</span>
							</button>
						)
					})}
				</div>

				{/* Show existing signature image if available */}
				{signatures.filter(s => s.imageUrl).map((sig) => (
					<div key={sig.id} className="flex flex-col items-center gap-3">
						<div className="flex w-full items-center justify-center rounded-xl border border-border bg-grey-25 p-6">
							<img
								src={sig.imageUrl!}
								alt="Signature"
								className="max-h-32 object-contain"
							/>
						</div>
						<div className="flex items-center gap-3">
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									// TODO: implement remove signature
								}}
							>
								Remove
							</Button>
							<Button
								variant="primary"
								size="sm"
								onClick={() => onSignatureClick(sig.type as 'LAWYER' | 'DATA_PERMISSION' | 'CANCELLATION')}
							>
								Update Signature
							</Button>
						</div>
					</div>
				))}
			</div>
		</CollapsibleSection>
	)
}

export { SignatureSection }
