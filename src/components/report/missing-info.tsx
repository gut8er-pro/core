'use client'

import { useTranslations } from 'next-intl'
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from 'react'
import {
	type Control,
	type FieldErrors,
	type FieldValues,
	type Path,
	type UseFormRegister,
	useWatch,
} from 'react-hook-form'
import type { ReportType, SectionId, TabKey } from '@/lib/completeness'
import { evaluateTab } from '@/lib/completeness'

// ── The review toggle ─────────────────────────────────────────────────────

type MissingInfoToggle = {
	showMissing: boolean
	setShowMissing: (showMissing: boolean) => void
}

const ToggleContext = createContext<MissingInfoToggle>({
	showMissing: false,
	setShowMissing: () => {},
})

/**
 * Holds the "Show missing information" toggle for the Report Details route.
 *
 * Route-scoped on purpose: the state survives moving between the five tabs
 * because the App Router keeps the layout mounted, and it dies — back to off —
 * as soon as the assessor leaves the report. It is a transient review mode, not
 * a saved preference.
 */
function MissingInfoProvider({ children }: { children: ReactNode }) {
	const [showMissing, setShowMissing] = useState(false)
	const value = useMemo(() => ({ showMissing, setShowMissing }), [showMissing])

	return <ToggleContext.Provider value={value}>{children}</ToggleContext.Provider>
}

function useMissingInfoToggle(): MissingInfoToggle {
	return useContext(ToggleContext)
}

// ── The current tab's missing fields ──────────────────────────────────────

type MissingFields = {
	showMissing: boolean
	missingPaths: ReadonlySet<string>
	sectionMissing: ReadonlyMap<SectionId, number>
}

const NOTHING_MISSING: MissingFields = {
	showMissing: false,
	missingPaths: new Set(),
	sectionMissing: new Map(),
}

const MissingFieldsContext = createContext<MissingFields>(NOTHING_MISSING)

type MissingFieldsProviderProps<TFieldValues extends FieldValues> = {
	tab: TabKey
	reportType: ReportType
	control: Control<TFieldValues>
	/** Collections the form does not own — signatures, markers, tyre sets. */
	extraValues?: Record<string, unknown>
	children: ReactNode
}

/**
 * Evaluates this tab against the completeness manifest on every change, so a
 * highlight clears the moment its field is filled — ahead of the auto-save
 * round-trip the tab badges and banner wait for.
 */
function MissingFieldsProvider<TFieldValues extends FieldValues>({
	tab,
	reportType,
	control,
	extraValues,
	children,
}: MissingFieldsProviderProps<TFieldValues>) {
	const { showMissing } = useMissingInfoToggle()
	const values = useWatch({ control })

	const report = showMissing
		? evaluateTab(reportType, tab, { ...values, ...extraValues } as Record<string, unknown>)
		: null

	// Typing re-runs the evaluation, but consumers should only re-render when
	// the answer changes — so the context value is cached against a signature
	// of it rather than rebuilt on every keystroke.
	const signature = report
		? [
				report.missingPaths.join('|'),
				report.sections.map((section) => `${section.id}=${section.missingCount}`).join(','),
			].join('#')
		: ''
	const cache = useRef<{ signature: string | null; value: MissingFields }>({
		signature: null,
		value: NOTHING_MISSING,
	})

	if (cache.current.signature !== signature) {
		cache.current = {
			signature,
			value: report
				? {
						showMissing: true,
						missingPaths: new Set(report.missingPaths),
						sectionMissing: new Map(
							report.sections.map((section) => [section.id, section.missingCount]),
						),
					}
				: NOTHING_MISSING,
		}
	}

	return (
		<MissingFieldsContext.Provider value={cache.current.value}>
			{children}
		</MissingFieldsContext.Provider>
	)
}

function useMissingFields(): MissingFields {
	return useContext(MissingFieldsContext)
}

/** Required fields still empty inside one section, or 0 while the mode is off. */
function useSectionMissingCount(sectionId: SectionId): number {
	const { showMissing, sectionMissing } = useMissingFields()
	return showMissing ? (sectionMissing.get(sectionId) ?? 0) : 0
}

/** Spread onto a section header to give it a missing-count badge. */
function useSectionBadge(sectionId: SectionId): { missingCount: number; missingLabel: string } {
	const missingCount = useSectionMissingCount(sectionId)
	const t = useTranslations('report.details')
	return { missingCount, missingLabel: t('fieldsMissingBadge') }
}

// ── Call-site helpers ─────────────────────────────────────────────────────

function errorMessage(errors: FieldErrors, path: string): string | undefined {
	let node: unknown = errors
	for (const segment of path.split('.')) {
		if (typeof node !== 'object' || node === null) return undefined
		node = (node as Record<string, unknown>)[segment]
	}
	if (typeof node !== 'object' || node === null) return undefined
	const message = (node as { message?: unknown }).message
	return typeof message === 'string' ? message : undefined
}

type FieldSource<TFieldValues extends FieldValues> = {
	register: UseFormRegister<TFieldValues>
	errors: FieldErrors<TFieldValues>
	onFieldBlur?: (field: string) => void
}

/**
 * Everything a registered control needs in one spread: the form registration,
 * its error message, the auto-save blur handler and the missing flag.
 */
function useFieldProps<TFieldValues extends FieldValues>({
	register,
	errors,
	onFieldBlur,
}: FieldSource<TFieldValues>) {
	const { showMissing, missingPaths } = useMissingFields()
	const t = useTranslations('report.details')
	const missingLabel = t('notFilledIn')

	return useCallback(
		(name: Path<TFieldValues>) => ({
			...register(name),
			error: errorMessage(errors, name),
			onBlur: () => onFieldBlur?.(name),
			isMissing: showMissing && missingPaths.has(name),
			missingLabel,
		}),
		[register, errors, onFieldBlur, showMissing, missingPaths, missingLabel],
	)
}

type ControlledField = { value: unknown; onChange: (value: unknown) => void }

type ControlledSource<TFieldValues extends FieldValues> = {
	errors: FieldErrors<TFieldValues>
	onFieldBlur?: (field: string) => void
}

/**
 * The same for a control driven through `control` rather than `register` —
 * pass the render prop's `field` and spread the result onto the control.
 */
function useControlledFieldProps<TFieldValues extends FieldValues>({
	errors,
	onFieldBlur,
}: ControlledSource<TFieldValues>) {
	const { showMissing, missingPaths } = useMissingFields()
	const t = useTranslations('report.details')
	const missingLabel = t('notFilledIn')

	return useCallback(
		(name: Path<TFieldValues>, field: ControlledField) => ({
			value: typeof field.value === 'string' ? field.value : undefined,
			onValueChange: (value: string) => {
				field.onChange(value)
				onFieldBlur?.(name)
			},
			error: errorMessage(errors, name),
			isMissing: showMissing && missingPaths.has(name),
			missingLabel,
		}),
		[errors, onFieldBlur, showMissing, missingPaths, missingLabel],
	)
}

/** For the handful of controls that are neither registered nor controlled. */
function useMissingProps(): (path: string) => { isMissing: boolean; missingLabel: string } {
	const { showMissing, missingPaths } = useMissingFields()
	const t = useTranslations('report.details')
	const missingLabel = t('notFilledIn')

	return useCallback(
		(path: string) => ({ isMissing: showMissing && missingPaths.has(path), missingLabel }),
		[showMissing, missingPaths, missingLabel],
	)
}

export {
	MissingFieldsProvider,
	MissingInfoProvider,
	useControlledFieldProps,
	useFieldProps,
	useMissingInfoToggle,
	useMissingProps,
	useSectionBadge,
}
