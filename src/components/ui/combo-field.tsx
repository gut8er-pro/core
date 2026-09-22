'use client'

import { ChevronDown } from 'lucide-react'
import { type FocusEvent, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Label } from './label'
import { MISSING_FIELD_CLASS } from './missing'

type ComboOption = {
	value: string
	label: string
}

type ComboFieldProps = {
	label?: string
	options: ComboOption[]
	placeholder?: string
	error?: string
	value: string
	onValueChange: (value: string) => void
	onBlur?: () => void
	disabled?: boolean
	className?: string
	id?: string
	name?: string
	isMissing?: boolean
	missingLabel?: string
}

function ComboField({
	label,
	options,
	placeholder,
	error,
	value,
	onValueChange,
	onBlur,
	disabled,
	className,
	id,
	name,
	isMissing,
	missingLabel,
}: ComboFieldProps) {
	const fieldId = id || name || label?.toLowerCase().replace(/\s+/g, '-')
	const [open, setOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const showMissing = !!isMissing && !error

	const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
		if (containerRef.current?.contains(event.relatedTarget as Node)) return
		setOpen(false)
		onBlur?.()
	}

	return (
		<div className={cn('flex flex-col gap-1', className)}>
			{label && <Label htmlFor={fieldId}>{label}</Label>}
			<div ref={containerRef} className="relative" onBlur={handleBlur}>
				<input
					id={fieldId}
					name={name}
					type="text"
					role="combobox"
					aria-expanded={open}
					aria-autocomplete="list"
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					autoComplete="off"
					onChange={(event) => {
						onValueChange(event.target.value)
						setOpen(true)
					}}
					onFocus={() => setOpen(true)}
					className={cn(
						'flex h-11 w-full rounded-md border border-border bg-white px-4 py-3 pr-10 text-body-sm text-black placeholder:text-placeholder focus:border-border-focus focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
						error && 'border-error focus:border-error',
						showMissing && MISSING_FIELD_CLASS,
					)}
					data-missing={showMissing ? 'true' : undefined}
					aria-describedby={showMissing && missingLabel ? `${fieldId}-missing` : undefined}
				/>
				<button
					type="button"
					tabIndex={-1}
					aria-label="Toggle suggestions"
					disabled={disabled}
					onMouseDown={(event) => {
						event.preventDefault()
						setOpen((prev) => !prev)
					}}
					className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center text-grey-100 disabled:cursor-not-allowed"
				>
					<ChevronDown className="h-4 w-4" />
				</button>
				{open && options.length > 0 && (
					<ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-white p-1 shadow-dropdown">
						{options.map((option) => (
							<li key={option.value}>
								<button
									type="button"
									role="option"
									aria-selected={option.value === value}
									onMouseDown={(event) => {
										event.preventDefault()
										onValueChange(option.value)
										setOpen(false)
										onBlur?.()
									}}
									className={cn(
										'flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-body-sm text-black hover:bg-grey-25',
										option.value === value && 'bg-grey-25 font-medium',
									)}
								>
									{option.label}
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
			{error && (
				<p className="text-caption text-error" role="alert">
					{error}
				</p>
			)}
			{showMissing && missingLabel && (
				<span id={`${fieldId}-missing`} className="sr-only">
					{missingLabel}
				</span>
			)}
		</div>
	)
}

export type { ComboFieldProps, ComboOption }
export { ComboField }
