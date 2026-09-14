import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, type InputHTMLAttributes, type ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { Label } from './label'
import { MISSING_FIELD_CLASS } from './missing'

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & {
	label?: string
	error?: string
	hint?: string
	icon?: ReactNode
	prefix?: string
	/** Required but not filled in yet. Distinct from `error`, which wins. */
	isMissing?: boolean
	/** Screen-reader text for the missing state, e.g. "Not filled in yet". */
	missingLabel?: string
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
	(
		{ label, error, hint, icon, prefix, type, className, id, isMissing, missingLabel, ...props },
		ref,
	) => {
		const [showPassword, setShowPassword] = useState(false)
		const isPassword = type === 'password'
		const inputType = isPassword && showPassword ? 'text' : type

		const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
		// A wrong value is more urgent than an absent one.
		const showMissing = !!isMissing && !error

		return (
			<div className={cn('flex flex-col gap-3', className)}>
				{label && <Label htmlFor={inputId}>{label}</Label>}
				<div className="relative">
					{prefix && (
						<span className="absolute left-4 top-1/2 -translate-y-1/2 text-body-sm text-grey-100">
							{prefix}
						</span>
					)}
					{icon && (
						<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-100">{icon}</span>
					)}
					<Input
						ref={ref}
						id={inputId}
						type={inputType}
						className={cn(
							prefix && 'pl-12',
							icon && 'pl-11',
							isPassword && 'pr-11',
							error && 'border-error focus:border-error',
							showMissing && MISSING_FIELD_CLASS,
						)}
						// Deliberately not aria-invalid: an empty required field holds no
						// wrong value, and flagging a hundred of them as invalid would
						// make a screen reader announce the whole form as broken.
						aria-invalid={!!error}
						data-missing={showMissing ? 'true' : undefined}
						aria-describedby={
							error
								? `${inputId}-error`
								: showMissing && missingLabel
									? `${inputId}-missing`
									: hint
										? `${inputId}-hint`
										: undefined
						}
						{...props}
					/>
					{isPassword && (
						<button
							type="button"
							tabIndex={-1}
							className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-grey-100 hover:text-black"
							onClick={() => setShowPassword((prev) => !prev)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
						</button>
					)}
				</div>
				{error && (
					<p id={`${inputId}-error`} className="text-caption text-error" role="alert">
						{error}
					</p>
				)}
				{showMissing && missingLabel && (
					<span id={`${inputId}-missing`} className="sr-only">
						{missingLabel}
					</span>
				)}
				{hint && !error && (
					<p id={`${inputId}-hint`} className="text-caption text-grey-100">
						{hint}
					</p>
				)}
			</div>
		)
	},
)
TextField.displayName = 'TextField'

export type { TextFieldProps }
export { TextField }
