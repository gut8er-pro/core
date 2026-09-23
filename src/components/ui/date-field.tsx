'use client'

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import {
	type ChangeEvent,
	type FocusEvent,
	forwardRef,
	type InputHTMLAttributes,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Label } from './label'
import { MISSING_FIELD_CLASS } from './missing'

const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/
const DISPLAY_PATTERN = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/

function pad(value: number): string {
	return String(value).padStart(2, '0')
}

function isRealDate(year: number, month: number, day: number): boolean {
	if (month < 1 || month > 12 || day < 1 || day > 31) return false
	const probe = new Date(Date.UTC(year, month - 1, day))
	return (
		probe.getUTCFullYear() === year &&
		probe.getUTCMonth() === month - 1 &&
		probe.getUTCDate() === day
	)
}

/** Anything the field may receive — ISO, a full ISO datetime, or dd.mm.yyyy — as ISO. */
function toIso(raw: string): string {
	const text = raw.trim()
	if (!text) return ''

	const iso = ISO_PATTERN.exec(text)
	if (iso) {
		const [, year, month, day] = iso
		return isRealDate(Number(year), Number(month), Number(day)) ? `${year}-${month}-${day}` : ''
	}

	const display = DISPLAY_PATTERN.exec(text)
	if (display) {
		const [, day, month, year] = display
		return isRealDate(Number(year), Number(month), Number(day))
			? `${year}-${pad(Number(month))}-${pad(Number(day))}`
			: ''
	}

	return ''
}

/** ISO as dd.mm.yyyy; anything else unchanged, so half-typed text survives. */
function toDisplay(raw: string): string {
	const iso = ISO_PATTERN.exec(raw.trim())
	if (!iso) return raw
	const [, year, month, day] = iso
	return `${day}.${month}.${year}`
}

/** Digits as the assessor types them, punctuated into dd.mm.yyyy. */
function applyMask(raw: string): string {
	const digits = raw.replace(/\D/g, '').slice(0, 8)
	if (digits.length <= 2) return digits
	if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`
	return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`
}

type CalendarDay = {
	iso: string
	day: number
	isCurrentMonth: boolean
	isToday: boolean
}

/** Six Monday-first weeks covering `month`, padded with its neighbours' days. */
function buildMonthGrid(year: number, month: number, today: string): CalendarDay[] {
	const first = new Date(Date.UTC(year, month, 1))
	const offset = (first.getUTCDay() + 6) % 7

	return Array.from({ length: 42 }, (_, index) => {
		const cursor = new Date(Date.UTC(year, month, 1 - offset + index))
		const iso = `${cursor.getUTCFullYear()}-${pad(cursor.getUTCMonth() + 1)}-${pad(cursor.getUTCDate())}`
		return {
			iso,
			day: cursor.getUTCDate(),
			isCurrentMonth: cursor.getUTCMonth() === first.getUTCMonth(),
			isToday: iso === today,
		}
	})
}

function currentIsoDate(): string {
	const now = new Date()
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** Writes `value` the way React's own onChange would see it. */
function setNativeValue(input: HTMLInputElement, value: string) {
	const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
	if (setter) setter.call(input, value)
	else input.value = value
}

type DateFieldProps = Omit<
	InputHTMLAttributes<HTMLInputElement>,
	'type' | 'value' | 'defaultValue'
> & {
	label?: string
	error?: string
	isMissing?: boolean
	missingLabel?: string
	/** Applied to the visible input, so a call site can keep its own field styling. */
	inputClassName?: string
}

/**
 * Date entry on the app's own tokens rather than the browser's native picker.
 *
 * Two inputs share the field: the one carrying `name` holds ISO `yyyy-mm-dd` and
 * belongs to whatever registered it, so auto-save payloads, form hydration and
 * the zod `dateString` schema are untouched; the one on top shows and accepts
 * dd.mm.yyyy. Filling the named input with ISO directly — as the E2E suite does —
 * flows through to the display, and typing stays possible either way.
 */
const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
	(
		{
			label,
			error,
			isMissing,
			missingLabel,
			className,
			inputClassName,
			id,
			name,
			disabled,
			placeholder,
			onChange,
			onBlur,
			...props
		},
		ref,
	) => {
		const locale = useLocale()
		const t = useTranslations('common.dateField')
		const fieldId = id || name || label?.toLowerCase().replace(/\s+/g, '-')
		const showMissing = !!isMissing && !error

		const isoRef = useRef<HTMLInputElement | null>(null)
		const containerRef = useRef<HTMLDivElement>(null)
		const calendarRef = useRef<HTMLDivElement>(null)
		const [text, setText] = useState('')
		const [open, setOpen] = useState(false)
		const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
		const [viewDate, setViewDate] = useState(() => new Date())

		const openCalendar = () => {
			setAnchorRect(containerRef.current?.getBoundingClientRect() ?? null)
			setOpen(true)
		}

		const selectedIso = toIso(text)
		const today = currentIsoDate()

		// The ISO input is owned elsewhere — hydration and programmatic fills land
		// there first, so the display follows whatever value it is holding.
		useEffect(() => {
			const input = isoRef.current
			if (!input) return
			const sync = () => {
				const iso = toIso(input.value)
				setText((current) => (toIso(current) === iso ? current : iso ? toDisplay(iso) : ''))
			}
			sync()
			input.addEventListener('input', sync)
			input.addEventListener('change', sync)
			const observer = new MutationObserver(sync)
			observer.observe(input, { attributes: true, attributeFilter: ['value'] })
			const frame = requestAnimationFrame(sync)
			return () => {
				input.removeEventListener('input', sync)
				input.removeEventListener('change', sync)
				observer.disconnect()
				cancelAnimationFrame(frame)
			}
		})

		useEffect(() => {
			if (!open) return
			const dismiss = (event: MouseEvent) => {
				const target = event.target as Node
				if (containerRef.current?.contains(target)) return
				if (calendarRef.current?.contains(target)) return
				setOpen(false)
			}
			const reposition = () => {
				setAnchorRect(containerRef.current?.getBoundingClientRect() ?? null)
			}
			document.addEventListener('mousedown', dismiss)
			window.addEventListener('scroll', reposition, true)
			window.addEventListener('resize', reposition)
			return () => {
				document.removeEventListener('mousedown', dismiss)
				window.removeEventListener('scroll', reposition, true)
				window.removeEventListener('resize', reposition)
			}
		}, [open])

		const anchor = open && selectedIso ? new Date(`${selectedIso}T12:00:00Z`) : null
		const viewYear = anchor ? anchor.getUTCFullYear() : viewDate.getFullYear()
		const viewMonth = anchor ? anchor.getUTCMonth() : viewDate.getMonth()

		const monthLabel = useMemo(
			() =>
				new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
					new Date(Date.UTC(viewYear, viewMonth, 1)),
				),
			[locale, viewYear, viewMonth],
		)

		const weekdays = useMemo(() => {
			const format = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })
			// 2024-01-01 was a Monday, which is where a German week starts.
			return Array.from({ length: 7 }, (_, index) =>
				format.format(new Date(Date.UTC(2024, 0, 1 + index))),
			)
		}, [locale])

		const days = useMemo(
			() => buildMonthGrid(viewYear, viewMonth, today),
			[viewYear, viewMonth, today],
		)

		const emit = (iso: string) => {
			const input = isoRef.current
			if (!input || input.value === iso) return
			setNativeValue(input, iso)
			input.dispatchEvent(new Event('input', { bubbles: true }))
		}

		const handleDisplayChange = (event: ChangeEvent<HTMLInputElement>) => {
			const raw = event.target.value
			// A paste arrives whole and ISO; a person types digits.
			const next = ISO_PATTERN.test(raw.trim()) ? toDisplay(raw) : applyMask(raw)
			setText(next)
			emit(toIso(next))
		}

		const handleDisplayBlur = () => {
			const iso = toIso(text)
			setText(iso ? toDisplay(iso) : '')
			emit(iso)
			isoRef.current?.dispatchEvent(new Event('blur', { bubbles: false }))
		}

		const pick = (iso: string) => {
			setText(toDisplay(iso))
			emit(iso)
			setOpen(false)
		}

		const closeOnLeave = (event: FocusEvent<HTMLDivElement>) => {
			if (containerRef.current?.contains(event.relatedTarget as Node)) return
			if (calendarRef.current?.contains(event.relatedTarget as Node)) return
			setOpen(false)
		}

		// The sections that host a date field clip their content while the
		// accordion animates, so the popover is anchored in the body instead.
		const calendar = open && !disabled && (
			<div
				ref={calendarRef}
				role="dialog"
				aria-label={t('openCalendar')}
				style={{ top: anchorRect?.bottom ?? 0, left: anchorRect?.left ?? 0 }}
				className="fixed z-50 mt-1 w-[17.5rem] rounded-lg border border-border bg-white p-3 shadow-dropdown"
			>
				<div className="flex items-center justify-between pb-2">
					<button
						type="button"
						aria-label={t('previousMonth')}
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => setViewDate(new Date(viewYear, viewMonth - 1, 1))}
						className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-grey-100 hover:bg-grey-25 hover:text-black"
					>
						<ChevronLeft className="h-4 w-4" />
					</button>
					<span className="text-body-sm font-medium text-black">{monthLabel}</span>
					<button
						type="button"
						aria-label={t('nextMonth')}
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => setViewDate(new Date(viewYear, viewMonth + 1, 1))}
						className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-grey-100 hover:bg-grey-25 hover:text-black"
					>
						<ChevronRight className="h-4 w-4" />
					</button>
				</div>
				<div className="grid grid-cols-7 gap-0.5 pb-1">
					{weekdays.map((weekday) => (
						<span
							key={weekday}
							className="flex h-7 items-center justify-center text-caption text-grey-100"
						>
							{weekday}
						</span>
					))}
				</div>
				<div className="grid grid-cols-7 gap-0.5">
					{days.map((day) => (
						<button
							key={day.iso}
							type="button"
							aria-label={day.iso}
							aria-pressed={day.iso === selectedIso}
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => pick(day.iso)}
							className={cn(
								'flex h-8 cursor-pointer items-center justify-center rounded-md text-body-sm text-black hover:bg-grey-25',
								!day.isCurrentMonth && 'text-grey-100',
								day.isToday && day.iso !== selectedIso && 'border border-border',
								day.iso === selectedIso && 'bg-primary font-medium text-white hover:bg-primary',
							)}
						>
							{day.day}
						</button>
					))}
				</div>
			</div>
		)

		return (
			<div className={cn('flex flex-col gap-3', className)}>
				{label && <Label htmlFor={fieldId}>{label}</Label>}
				<div ref={containerRef} className="relative" onBlur={closeOnLeave}>
					<input
						{...props}
						ref={(node) => {
							isoRef.current = node
							if (typeof ref === 'function') ref(node)
							else if (ref) ref.current = node
						}}
						name={name}
						type="text"
						tabIndex={-1}
						aria-hidden="true"
						autoComplete="off"
						disabled={disabled}
						onChange={onChange}
						onBlur={onBlur}
						className="absolute inset-0 h-full w-full rounded-md border border-transparent bg-transparent px-4 text-body-sm text-transparent caret-transparent outline-none"
					/>
					<input
						id={fieldId}
						type="text"
						inputMode="numeric"
						autoComplete="off"
						disabled={disabled}
						placeholder={placeholder ?? t('placeholder')}
						value={text}
						onChange={handleDisplayChange}
						onBlur={handleDisplayBlur}
						onFocus={() => setOpen(false)}
						className={cn(
							'relative flex h-11 w-full rounded-md border border-border bg-white px-4 py-3 pr-11 text-body-sm text-black placeholder:text-placeholder focus:border-border-focus focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
							error && 'border-error focus:border-error',
							showMissing && MISSING_FIELD_CLASS,
							inputClassName,
						)}
						aria-invalid={!!error}
						data-missing={showMissing ? 'true' : undefined}
						aria-describedby={showMissing && missingLabel ? `${fieldId}-missing` : undefined}
					/>
					<button
						type="button"
						tabIndex={-1}
						aria-label={t('openCalendar')}
						aria-expanded={open}
						disabled={disabled}
						onMouseDown={(event) => {
							event.preventDefault()
							if (disabled) return
							if (open) setOpen(false)
							else openCalendar()
						}}
						className="absolute inset-y-0 right-0 z-10 flex w-11 cursor-pointer items-center justify-center text-grey-100 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
					>
						<Calendar className="h-4 w-4" />
					</button>
					{calendar && createPortal(calendar, document.body)}
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
	},
)
DateField.displayName = 'DateField'

export type { DateFieldProps }
export { DateField, toDisplay, toIso }
