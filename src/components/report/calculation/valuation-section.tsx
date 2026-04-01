import { Info, Calendar, ChevronDown } from 'lucide-react'
import { Controller } from 'react-hook-form'
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

function ValuationSection({ register, control, errors, onFieldBlur, className }: CalculationSectionProps) {
	return (
		<div className={cn('grid grid-cols-1 gap-5 lg:grid-cols-2', className)}>
			{/* Left — DAT Valuation */}
			<div className="flex flex-col justify-between gap-4 rounded-3xl border-2 border-border-subtle p-5">
				<div className="flex flex-col gap-4">
					{/* Header */}
					<div className="flex items-center gap-2">
						<span className="text-h4 font-semibold text-black">DAT Valuation</span>
						<Info className="h-4 w-4 text-grey-100" />
					</div>

					{/* DAT logo */}
					<div className="flex justify-center">
						<div className="flex h-[91px] w-[57px] flex-col items-center justify-center rounded bg-[#f5c800] text-[11px] font-bold leading-tight text-[#003087]">
							<span className="text-input">DAT</span>
						</div>
					</div>

					{/* General condition */}
					<div className="flex flex-col gap-3">
						<label className="text-body-sm font-medium text-black">General condition</label>
						<div className="relative">
							<Controller
								name="generalCondition"
								control={control}
								render={({ field }) => (
									<select
										{...field}
										onBlur={() => onFieldBlur?.('generalCondition')}
										className="h-[53px] w-full appearance-none rounded-2xl border-[1.5px] border-border-card bg-white px-3.5 pr-10 text-body text-black focus:border-primary focus:outline-none"
									>
										<option value="">Select condition</option>
										{CONDITION_OPTIONS.map((o) => (
											<option key={o.value} value={o.value}>{o.label}</option>
										))}
									</select>
								)}
							/>
							<ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-100" />
						</div>
					</div>

					{/* Taxation chips */}
					<div className="flex flex-col gap-3">
						<label className="text-body-sm font-medium text-black">Taxation</label>
						<Controller
							name="taxation"
							control={control}
							render={({ field }) => (
								<div className="grid grid-cols-3 gap-3">
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
						Quick Valuation
					</button>
					<button
						type="button"
						className="flex items-center justify-center rounded-btn bg-primary p-3.5 text-body-sm font-medium text-white transition-colors hover:bg-primary-hover"
					>
						Detail Valuation
					</button>
				</div>
			</div>

			{/* Right — Manual Valuation */}
			<div className="flex flex-col gap-4 rounded-3xl border-2 border-border-subtle p-5">
				{/* Header */}
				<div className="flex items-center gap-2">
					<span className="text-h4 font-semibold text-black">Manual Valuation</span>
					<Info className="h-4 w-4 text-grey-100" />
				</div>

				{/* Data source */}
				<div className="flex flex-col gap-3">
					<label className="text-body-sm font-medium text-black">Data source</label>
					<div className="relative">
						<Controller
							name="dataSource"
							control={control}
							render={({ field }) => (
								<select
									{...field}
									onBlur={() => onFieldBlur?.('dataSource')}
									className="h-[53px] w-full appearance-none rounded-2xl border-[1.5px] border-border-card bg-white px-3.5 pr-10 text-body text-black focus:border-primary focus:outline-none"
								>
									<option value="">Select source</option>
									{DATA_SOURCE_OPTIONS.map((o) => (
										<option key={o.value} value={o.value}>{o.label}</option>
									))}
								</select>
							)}
						/>
						<ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-100" />
					</div>
				</div>

				{/* Results header */}
				<div className="flex items-center gap-2">
					<span className="text-body-sm font-medium text-black">Results</span>
					<Info className="h-4 w-4 text-grey-100" />
				</div>

				{/* Max / Avg / Min */}
				<div className="grid grid-cols-3 gap-4">
					{(
						[
							{ name: 'valuationMax', label: 'Maximum' },
							{ name: 'valuationAvg', label: 'Average' },
							{ name: 'valuationMin', label: 'Minimum' },
						] as const
					).map(({ name, label }) => (
						<div key={name} className="flex flex-col gap-3">
							<label className="text-body-sm font-medium text-black">{label}</label>
							<input
								{...register(name)}
								onBlur={() => onFieldBlur?.(name)}
								placeholder="—"
								className="h-[53px] w-full rounded-2xl border-[1.5px] border-border-card px-3.5 text-body text-black placeholder:text-placeholder focus:border-primary focus:outline-none"
							/>
						</div>
					))}
				</div>

				{/* Date */}
				<div className="flex flex-col gap-3">
					<label className="text-body-sm font-medium text-black">Date</label>
					<div className="relative">
						<input
							{...register('valuationDate')}
							onBlur={() => onFieldBlur?.('valuationDate')}
							placeholder="MM/YYYY"
							className="h-[53px] w-full rounded-2xl border-[1.5px] border-border-card px-3.5 pr-10 text-body text-black placeholder:text-placeholder focus:border-primary focus:outline-none"
						/>
						<Calendar className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-100" />
					</div>
				</div>

				{/* Remove Calculation */}
				<button
					type="button"
					className="mt-auto flex items-center justify-center rounded-btn border border-black p-3.5 text-body-sm font-medium text-black transition-colors hover:bg-grey-25"
				>
					Remove Calculation
				</button>
			</div>
		</div>
	)
}

export { ValuationSection }
