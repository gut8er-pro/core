'use client'

import { type ChangeEvent, forwardRef } from 'react'
import { TextField, type TextFieldProps } from '@/components/ui/text-field'

/** German plates are uppercase, so the stored value is too — not just the rendering. */
const LicensePlateField = forwardRef<HTMLInputElement, TextFieldProps>(
	({ onChange, className, ...props }, ref) => {
		const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
			event.target.value = event.target.value.toUpperCase()
			onChange?.(event)
		}

		return (
			<TextField
				ref={ref}
				autoCapitalize="characters"
				autoComplete="off"
				spellCheck={false}
				className={className}
				onChange={handleChange}
				{...props}
			/>
		)
	},
)
LicensePlateField.displayName = 'LicensePlateField'

export { LicensePlateField }
