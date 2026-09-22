'use client'

import { cn } from '@/lib/utils'
import type { EmissionGroup } from './types'

const STICKER_FILL: Record<EmissionGroup, string> = {
	'1': '#9CA3AF',
	'2': '#DF0808',
	'3': '#F4CA14',
	'4': '#019447',
}

type EmissionStickerProps = {
	group: EmissionGroup
	selected: boolean
	label: string
	disabled?: boolean
	onClick: () => void
}

function EmissionSticker({ group, selected, label, disabled, onClick }: EmissionStickerProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-pressed={selected}
			aria-label={label}
			title={label}
			className={cn(
				'flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
				selected ? 'border-black' : 'border-transparent hover:border-grey-50',
			)}
		>
			<svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden="true">
				<circle cx="20" cy="20" r="19" fill={STICKER_FILL[group]} />
				<circle cx="20" cy="20" r="19" fill="none" stroke="#00000022" strokeWidth="1" />
				<text
					x="20"
					y="16"
					textAnchor="middle"
					dominantBaseline="central"
					fontSize="17"
					fontWeight="bold"
					fill={group === '3' ? '#121312' : '#FFFFFF'}
				>
					{group}
				</text>
				<rect x="6" y="26" width="28" height="9" rx="1.5" fill="#FFFFFF" />
			</svg>
		</button>
	)
}

export { EmissionSticker }
