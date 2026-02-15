'use client'

import { FileSignature, Plus } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SignatureSectionProps } from './types'

const SIGNATURE_TYPES = [
	{ type: 'LAWYER' as const, label: 'Lawyer' },
	{ type: 'DATA_PERMISSION' as const, label: 'Data Permission' },
	{ type: 'CANCELLATION' as const, label: 'Cancellation' },
]

function SignatureSection({ signatures, onSignatureClick, className }: SignatureSectionProps) {
	function getSignatureForType(type: string) {
		return signatures.find((sig) => sig.type === type)
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		})
	}

	return (
		<CollapsibleSection title="Signatures" defaultOpen className={className}>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				{SIGNATURE_TYPES.map(({ type, label }) => {
					const signature = getSignatureForType(type)
					const isSigned = signature?.imageUrl !== null && signature?.imageUrl !== undefined

					return (
						<button
							key={type}
							type="button"
							onClick={() => onSignatureClick(type)}
							className={cn(
								'flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-border bg-white p-6 text-center transition-colors hover:border-border-focus hover:bg-grey-25',
								isSigned && 'border-primary bg-success-light',
							)}
						>
							<div className="flex h-24 w-full items-center justify-center rounded-md bg-grey-25">
								{isSigned && signature?.imageUrl ? (
									<img
										src={signature.imageUrl}
										alt={`${label} signature`}
										className="max-h-20 max-w-full object-contain"
									/>
								) : (
									<FileSignature className="h-8 w-8 text-grey-100" />
								)}
							</div>

							<span className="text-body-sm font-semibold text-black">{label}</span>

							{isSigned && signature?.signedAt ? (
								<span className="text-caption text-grey-100">
									Signed {formatDate(signature.signedAt)}
								</span>
							) : (
								<span className="inline-flex items-center gap-1 text-caption text-primary">
									<Plus className="h-3 w-3" />
									Add Signature
								</span>
							)}
						</button>
					)
				})}
			</div>
		</CollapsibleSection>
	)
}

export { SignatureSection }
