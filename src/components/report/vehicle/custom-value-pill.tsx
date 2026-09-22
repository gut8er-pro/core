'use client'

import { Check, Plus } from 'lucide-react'
import { type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type CustomValuePillProps = {
	mode: 'numeric' | 'label'
	addLabel: string
	confirmLabel: string
	placeholder: string
	value: string
	selected: boolean
	onCommit: (value: string) => void
	disabled?: boolean
}

function CustomValuePill({
	mode,
	addLabel,
	confirmLabel,
	placeholder,
	value,
	selected,
	onCommit,
	disabled,
}: CustomValuePillProps) {
	const [editing, setEditing] = useState(false)
	const [draft, setDraft] = useState('')
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (editing) inputRef.current?.focus()
	}, [editing])

	const commit = () => {
		const trimmed = draft.trim()
		setEditing(false)
		setDraft('')
		if (!trimmed) return
		if (mode === 'numeric' && !Number.isFinite(Number(trimmed))) return
		onCommit(trimmed)
	}

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
			event.preventDefault()
			commit()
		}
		if (event.key === 'Escape') {
			event.preventDefault()
			setEditing(false)
			setDraft('')
		}
	}

	if (selected && !editing) {
		return (
			<span
				className={cn(
					'flex h-10 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-body-sm font-medium text-white',
					mode === 'numeric' && 'w-10 px-0',
				)}
			>
				{value}
			</span>
		)
	}

	if (!editing) {
		return (
			<button
				type="button"
				disabled={disabled}
				onClick={() => setEditing(true)}
				className={cn(
					'flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border border-border bg-white text-grey-100 transition-colors hover:bg-grey-25 disabled:cursor-not-allowed disabled:opacity-50',
					mode === 'numeric' ? 'rounded-full' : 'rounded-lg',
				)}
				aria-label={addLabel}
			>
				<Plus className="h-4 w-4" />
			</button>
		)
	}

	return (
		<div className="flex items-center gap-1">
			<input
				ref={inputRef}
				type={mode === 'numeric' ? 'number' : 'text'}
				inputMode={mode === 'numeric' ? 'numeric' : 'text'}
				value={draft}
				placeholder={placeholder}
				aria-label={addLabel}
				disabled={disabled}
				onChange={(event) => setDraft(event.target.value)}
				onKeyDown={handleKeyDown}
				onBlur={commit}
				className="h-10 w-24 rounded-md border border-border bg-white px-3 text-body-sm text-black placeholder:text-placeholder focus:border-border-focus focus:outline-none"
			/>
			<button
				type="button"
				tabIndex={-1}
				disabled={disabled}
				onMouseDown={(event) => {
					event.preventDefault()
					commit()
				}}
				className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-grey-100 transition-colors hover:bg-grey-25 disabled:cursor-not-allowed"
				aria-label={confirmLabel}
			>
				<Check className="h-4 w-4" />
			</button>
		</div>
	)
}

export { CustomValuePill }
