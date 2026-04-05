import { Edit, PenLine, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type CorrectionMode = 'dat' | 'manual' | 'ai'

type CorrectionSectionProps = {
	mode?: CorrectionMode
	onModeChange?: (mode: CorrectionMode) => void
	onOpenDat?: () => void
	resultWithoutLabel?: string
	resultWithLabel?: string
	resultWithoutValue?: string
	resultWithValue?: string
	onEditWithout?: () => void
	onEditWith?: () => void
	className?: string
}

function CorrectionSection({
	mode = 'dat',
	onModeChange,
	onOpenDat,
	resultWithoutLabel = 'Results without repair',
	resultWithLabel = 'Results with repair',
	resultWithoutValue = '—',
	resultWithValue = '—',
	onEditWithout,
	onEditWith,
	className,
}: CorrectionSectionProps) {
	const t = useTranslations('report.calculation')

	function handleTabClick(selected: CorrectionMode) {
		onModeChange?.(selected)
		if (selected === 'dat') onOpenDat?.()
	}

	return (
		<div className={cn('flex flex-col gap-3', className)}>
			{/* Label */}
			<div className="flex items-center gap-1.5">
				<Sparkles className="h-5 w-5 text-grey-100" />
				<span className="text-body-sm font-medium text-black">{t('correction.title')}</span>
			</div>

			{/* Tab row */}
			<div className="grid grid-cols-3 gap-3.5">
				{/* DAT tab */}
				<button
					type="button"
					onClick={() => handleTabClick('dat')}
					className={cn(
						'flex flex-col items-center justify-center gap-3.5 rounded-xl border p-6 transition-colors',
						mode === 'dat' ? 'border-black' : 'border-border hover:bg-grey-25',
					)}
				>
					{/* DAT logo placeholder */}
					<div className="flex h-[50px] w-[31px] items-center justify-center rounded bg-[#f5c800] text-[10px] font-bold leading-tight text-[#003087]">
						DAT
					</div>
					<span className="text-body-sm font-medium text-black">{t('correction.dat')}</span>
				</button>

				{/* Manual tab */}
				<button
					type="button"
					onClick={() => handleTabClick('manual')}
					className={cn(
						'flex flex-col items-center justify-center gap-3.5 rounded-xl border p-6 transition-colors',
						mode === 'manual' ? 'border-black' : 'border-border hover:bg-grey-25',
					)}
				>
					<PenLine className="h-8 w-8 text-black" />
					<span className="text-body-sm font-medium text-black">{t('correction.manual')}</span>
				</button>

				{/* AI Calculation tab */}
				<button
					type="button"
					onClick={() => handleTabClick('ai')}
					className={cn(
						'flex flex-col items-center justify-center gap-3.5 rounded-xl border p-6 transition-colors',
						mode === 'ai' ? 'border-black' : 'border-border hover:bg-grey-25',
					)}
				>
					<Sparkles className="h-8 w-8 text-black" />
					<span className="text-body-sm font-medium text-black">
						{t('correction.aiCalculation')}
					</span>
				</button>
			</div>

			{/* Result cards */}
			<div className="grid grid-cols-2 gap-5">
				<ResultCard label={resultWithoutLabel} value={resultWithoutValue} onEdit={onEditWithout} />
				<ResultCard label={resultWithLabel} value={resultWithValue} onEdit={onEditWith} />
			</div>
		</div>
	)
}

function ResultCard({
	label,
	value,
	onEdit,
}: {
	label: string
	value: string
	onEdit?: () => void
}) {
	const tc = useTranslations('common')

	return (
		<div className="relative overflow-hidden rounded-card bg-primary p-6">
			{/* Dark overlay tint for depth */}
			<div className="absolute inset-0 bg-black/10" />
			<div className="relative flex items-end justify-between">
				<div className="flex flex-col gap-3.5">
					<span className="text-body text-white/80">{label}</span>
					<span className="text-h2 font-semibold text-white">{value}</span>
				</div>
				{onEdit && (
					<button
						type="button"
						onClick={onEdit}
						className="flex items-center gap-1.5 rounded-btn bg-white/15 px-3.5 py-3 text-body-sm font-medium text-white transition-colors hover:bg-white/25"
					>
						<Edit className="h-4 w-4" />
						{tc('edit')}
					</button>
				)}
			</div>
		</div>
	)
}

export type { CorrectionMode, CorrectionSectionProps }
export { CorrectionSection }
