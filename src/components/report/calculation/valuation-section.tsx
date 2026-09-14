import { Calendar, ChevronDown, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { useFieldProps, useMissingProps, useSectionBadge } from '@/components/report/missing-info'
import { MISSING_FIELD_CLASS, MISSING_GROUP_CLASS, MissingBadge } from '@/components/ui/missing'
import { SECTION } from '@/lib/completeness'
import { cn } from '@/lib/utils'
import type { CalculationSectionProps } from './types'

const CONDITION_OPTIONS = [
	{ value: 'well_maintained', label: 'Well maintained' },
	{ value: 'good', label: 'Good' },
	{ value: 'fair', label: 'Fair' },
	{ value: 'poor', label: 'Poor' },
]

const TAXATION_OPTIONS = [
	{ value: '0', label: '0%', sublabel: 'Natural' },
	{ value: '2.4', label: '2.4%', sublabel: 'Difference' },
	{ value: '19', label: '19%', sublabel: 'Standard rate' },
]

const DATA_SOURCE_OPTIONS = [
	{ value: 'mobile.de', label: 'mobile.de' },
	{ value: 'autoscout24', label: 'AutoScout24' },
	{ value: 'dat', label: 'DAT' },
]

function ValuationSection({
	register,
	control,
	errors,
	onFieldBlur,
	className,
}: CalculationSectionProps) {
	const t = useTranslations('report.calculation')
	const fieldProps = useFieldProps({ register, errors, onFieldBlur })
	const missing = useMissingProps()
	const datBadge = useSectionBadge(SECTION.datValuation)
	const manualBadge = useSectionBadge(SECTION.manualValuation)

	return (
		<div className={cn('grid grid-cols-1 gap-5 lg:grid-cols-2', className)}>
			{/* Left — DAT Valuation */}
			<div className="flex flex-col justify-between gap-4 rounded-3xl border-2 border-border-subtle p-5">
				<div className="flex flex-col gap-4">
					{/* Header */}
					<div className="flex items-center gap-2">
						<span className="text-h4 font-semibold text-black">{t('valuation.datValuation')}</span>
						<Info className="h-4 w-4 text-grey-100" />
						<MissingBadge count={datBadge.missingCount} label={datBadge.missingLabel} />
					</div>

					{/* DAT logo */}
					<div className="flex justify-center">
						<div className="flex h-[91px] w-[57px] flex-col items-center justify-center rounded bg-[#f5c800] text-[11px] font-bold leading-tight text-[#003087]">
							<span className="text-input">DAT</span>
						</div>
					</div>

					{/* General condition */}
					<div className="flex flex-col gap-3">
						<label className="text-body-sm font-medium text-black">
							{t('valuation.generalCondition')}
						</label>
						<div className="relative">
							<Controller
								name="generalCondition"
								control={control}
								render={({ field }) => (
									<select
										{...field}
										onChange={(e) => {
											field.onChange(e.target.value)
											setTimeout(() => onFieldBlur?.('generalCondition'), 100)
										}}
										data-missing={missing('generalCondition').isMissing ? 'true' : undefined}
										className={cn(
											'h-[53px] w-full appearance-none rounded-2xl border-[1.5px] border-border-card bg-white px-3.5 pr-10 text-body text-black focus:border-primary focus:outline-none',
											missing('generalCondition').isMissing && MISSING_FIELD_CLASS,
										)}
									>
										<option value="">{t('valuation.selectCondition')}</option>
										{CONDITION_OPTIONS.map((o) => (
											<option key={o.value} value={o.value}>
												{o.label}
											</option>
										))}
									</select>
								)}
							/>
							<ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-100" />
						</div>
					</div>

					{/* Taxation chips */}
					<div className="flex flex-col gap-3">
						<label className="text-body-sm font-medium text-black">{t('valuation.taxation')}</label>
						<Controller
							name="taxation"
							control={control}
							render={({ field }) => (
								<div
									className={cn(
										'grid grid-cols-3 gap-3',
										missing('taxation').isMissing && cn('rounded-2xl', MISSING_GROUP_CLASS),
									)}
									data-missing={missing('taxation').isMissing ? 'true' : undefined}
								>
									{TAXATION_OPTIONS.map((opt) => (
										<button
											key={opt.value}
											type="button"
											onClick={() => {
												field.onChange(opt.value)
												onFieldBlur?.('taxation')
											}}
											className={cn(
												'flex h-[53px] flex-col items-center justify-center rounded-2xl border-[1.5px] text-body-sm transition-colors',
												field.value === opt.value
													? 'border-primary bg-primary/5 text-primary'
													: 'border-border-card text-black',
											)}
										>
											<span className="font-medium">{opt.label}</span>
											<span className="text-caption">{opt.sublabel}</span>
										</button>
									))}
								</div>
							)}
						/>
					</div>
				</div>

				{/* Action buttons */}
				<div className="grid grid-cols-2 gap-6">
					<button
						type="button"
						className="flex items-center justify-center rounded-btn border border-black p-3.5 text-body-sm font-medium text-black transition-colors hover:bg-grey-25"
					>
						{t('valuation.quickValuation')}
					</button>
					<button
						type="button"
						className="flex items-center justify-center rounded-btn bg-primary p-3.5 text-body-sm font-medium text-white transition-colors hover:bg-primary-hover"
					>
						{t('valuation.detailValuation')}
					</button>
				</div>
			</div>

			{/* Right — Manual Valuation */}
			<div className="flex flex-col gap-4 rounded-3xl border-2 border-border-subtle p-5">
				{/* Header */}
				<div className="flex items-center gap-2">
					<span className="text-h4 font-semibold text-black">{t('valuation.manualValuation')}</span>
					<Info className="h-4 w-4 text-grey-100" />
					<MissingBadge count={manualBadge.missingCount} label={manualBadge.missingLabel} />
				</div>

				{/* Data source */}
				<div className="flex flex-col gap-3">
					<label className="text-body-sm font-medium text-black">{t('valuation.dataSource')}</label>
					<div className="relative">
						<Controller
							name="dataSource"
							control={control}
							render={({ field }) => (
								<select
									{...field}
									onChange={(e) => {
										field.onChange(e.target.value)
										setTimeout(() => onFieldBlur?.('dataSource'), 100)
									}}
									data-missing={missing('dataSource').isMissing ? 'true' : undefined}
									className={cn(
										'h-[53px] w-full appearance-none rounded-2xl border-[1.5px] border-border-card bg-white px-3.5 pr-10 text-body text-black focus:border-primary focus:outline-none',
										missing('dataSource').isMissing && MISSING_FIELD_CLASS,
									)}
								>
									<option value="">{t('valuation.selectSource')}</option>
									{DATA_SOURCE_OPTIONS.map((o) => (
										<option key={o.value} value={o.value}>
											{o.label}
										</option>
									))}
								</select>
							)}
						/>
						<ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-100" />
					</div>
				</div>

				{/* Results header */}
				<div className="flex items-center gap-2">
					<span className="text-body-sm font-medium text-black">{t('valuation.results')}</span>
					<Info className="h-4 w-4 text-grey-100" />
				</div>

				{/* Max / Avg / Min */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					{(
						[
							{ name: 'valuationMax', label: t('valuation.maximum') },
							{ name: 'valuationAvg', label: t('valuation.average') },
							{ name: 'valuationMin', label: t('valuation.minimum') },
						] as const
					).map(({ name, label }) => (
						<div key={name} className="flex flex-col gap-3">
							<label className="text-body-sm font-medium text-black" htmlFor={name}>
								{label}
							</label>
							<input
								id={name}
								{...fieldProps(name)}
								data-missing={missing(name).isMissing ? 'true' : undefined}
								placeholder="—"
								className={cn(
									'h-[53px] w-full rounded-2xl border-[1.5px] border-border-card px-3.5 text-body text-black placeholder:text-placeholder focus:border-primary focus:outline-none',
									missing(name).isMissing && MISSING_FIELD_CLASS,
								)}
							/>
						</div>
					))}
				</div>

				{/* Date */}
				<div className="flex flex-col gap-3">
					<label className="text-body-sm font-medium text-black">{t('valuation.date')}</label>
					<div className="relative">
						<input
							{...fieldProps('valuationDate')}
							data-missing={missing('valuationDate').isMissing ? 'true' : undefined}
							placeholder={t('valuation.datePlaceholder')}
							className={cn(
								'h-[53px] w-full rounded-2xl border-[1.5px] border-border-card px-3.5 pr-10 text-body text-black placeholder:text-placeholder focus:border-primary focus:outline-none',
								missing('valuationDate').isMissing && MISSING_FIELD_CLASS,
							)}
						/>
						<Calendar className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-100" />
					</div>
				</div>

				{/* Remove Calculation */}
				<button
					type="button"
					className="mt-auto flex items-center justify-center rounded-btn border border-black p-3.5 text-body-sm font-medium text-black transition-colors hover:bg-grey-25"
				>
					{t('valuation.removeCalculation')}
				</button>
			</div>
		</div>
	)
}

export { ValuationSection }
