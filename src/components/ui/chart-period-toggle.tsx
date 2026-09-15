import type { ChartPeriod } from '@/hooks/use-revenue-stats'
import { cn } from '@/lib/utils'

type ChartPeriodOption = {
	value: ChartPeriod
	label: string
}

type ChartPeriodToggleProps = {
	value: ChartPeriod
	options: ChartPeriodOption[]
	onChange: (period: ChartPeriod) => void
	variant?: 'onLight' | 'onDark'
}

const VARIANT_STYLES = {
	onLight: {
		container: 'gap-2',
		base: 'text-body',
		active: 'border border-primary bg-white font-medium text-black',
		inactive: 'text-black/30 hover:text-black/60',
	},
	onDark: {
		container: 'gap-1',
		base: 'text-body-sm font-medium',
		active: 'bg-white text-black shadow-sm',
		inactive: 'text-white/30 hover:text-white',
	},
} as const

function ChartPeriodToggle({
	value,
	options,
	onChange,
	variant = 'onLight',
}: ChartPeriodToggleProps) {
	const styles = VARIANT_STYLES[variant]

	return (
		<div className={cn('flex items-center', styles.container)}>
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					onClick={() => onChange(option.value)}
					aria-pressed={value === option.value}
					className={cn(
						'cursor-pointer rounded-lg px-3 py-2 capitalize transition-colors',
						styles.base,
						value === option.value ? styles.active : styles.inactive,
					)}
				>
					{option.label}
				</button>
			))}
		</div>
	)
}

export type { ChartPeriodOption, ChartPeriodToggleProps }
export { ChartPeriodToggle }
