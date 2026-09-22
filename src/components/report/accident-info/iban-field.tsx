'use client'

import { type ChangeEvent, forwardRef, useState } from 'react'
import { TextField, type TextFieldProps } from '@/components/ui/text-field'
import { formatIban, isValidIban, normalizeIban } from '@/lib/utils/iban'

type IbanFieldProps = Omit<TextFieldProps, 'type'> & {
	invalidMessage: string
}

/**
 * Regroups in fours as the assessor types, so the field always reads the way an
 * IBAN is printed. The value stays grouped in the form and the PATCH schema
 * normalises it before it reaches the column.
 */
const IbanField = forwardRef<HTMLInputElement, IbanFieldProps>(
	({ invalidMessage, error, onChange, onBlur, ...props }, ref) => {
		const [checksumError, setChecksumError] = useState<string | undefined>()

		const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
			event.target.value = formatIban(event.target.value)
			setChecksumError(undefined)
			onChange?.(event)
		}

		const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
			const value = normalizeIban(event.target.value)
			setChecksumError(value && !isValidIban(value) ? invalidMessage : undefined)
			onBlur?.(event)
		}

		return (
			<TextField
				ref={ref}
				placeholder="DE89 3704 0044 0532 0130 00"
				autoComplete="off"
				spellCheck={false}
				error={error ?? checksumError}
				onChange={handleChange}
				onBlur={handleBlur}
				{...props}
			/>
		)
	},
)
IbanField.displayName = 'IbanField'

export type { IbanFieldProps }
export { IbanField }
