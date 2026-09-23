import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import de from '@/messages/de.json'
import en from '@/messages/en.json'
import { DateField, toDisplay, toIso } from './date-field'

type FormValues = { accidentDay: string }

function Harness({
	locale = 'en',
	hydrate,
	disabled,
}: {
	locale?: 'en' | 'de'
	hydrate?: string
	disabled?: boolean
}) {
	const { register, reset, watch } = useForm<FormValues>({
		defaultValues: { accidentDay: '' },
	})
	const value = watch('accidentDay')

	useEffect(() => {
		if (hydrate) reset({ accidentDay: hydrate })
	}, [hydrate, reset])

	return (
		<NextIntlClientProvider locale={locale} messages={locale === 'de' ? de : en}>
			<DateField label="Accident Day" disabled={disabled} {...register('accidentDay')} />
			<output data-testid="iso">{value}</output>
		</NextIntlClientProvider>
	)
}

/** The visible, masked input — the one an assessor types into. */
function display(): HTMLInputElement {
	return screen.getByLabelText('Accident Day') as HTMLInputElement
}

/** The registered input carrying `name`, which E2E fills with ISO. */
function isoInput(): HTMLInputElement {
	return document.querySelector('input[name="accidentDay"]') as HTMLInputElement
}

describe('toIso', () => {
	it('accepts ISO, ISO datetime and dd.mm.yyyy', () => {
		expect(toIso('2026-03-15')).toBe('2026-03-15')
		expect(toIso('2026-03-15T00:00:00.000Z')).toBe('2026-03-15')
		expect(toIso('15.03.2026')).toBe('2026-03-15')
		expect(toIso('1.3.2026')).toBe('2026-03-01')
	})

	it('rejects impossible and partial dates', () => {
		expect(toIso('')).toBe('')
		expect(toIso('31.02.2026')).toBe('')
		expect(toIso('2026-13-01')).toBe('')
		expect(toIso('15.03')).toBe('')
	})
})

describe('toDisplay', () => {
	it('renders ISO as dd.mm.yyyy and leaves other text alone', () => {
		expect(toDisplay('2026-03-15')).toBe('15.03.2026')
		expect(toDisplay('15.0')).toBe('15.0')
	})
})

describe('DateField', () => {
	it('masks digits into dd.mm.yyyy as they are typed', () => {
		render(<Harness />)
		fireEvent.change(display(), { target: { value: '15032026' } })
		expect(display()).toHaveValue('15.03.2026')
	})

	it('stores a typed date as ISO in form state', async () => {
		render(<Harness />)
		fireEvent.change(display(), { target: { value: '15032026' } })
		await waitFor(() => expect(screen.getByTestId('iso')).toHaveTextContent('2026-03-15'))
	})

	it('accepts an ISO value filled straight into the named input', async () => {
		render(<Harness />)
		fireEvent.change(isoInput(), { target: { value: '2026-09-01' } })
		await waitFor(() => expect(display()).toHaveValue('01.09.2026'))
		expect(screen.getByTestId('iso')).toHaveTextContent('2026-09-01')
	})

	it('accepts a pasted ISO string in the visible input', async () => {
		render(<Harness />)
		fireEvent.change(display(), { target: { value: '2026-09-01' } })
		expect(display()).toHaveValue('01.09.2026')
		await waitFor(() => expect(screen.getByTestId('iso')).toHaveTextContent('2026-09-01'))
	})

	it('shows a hydrated ISO value as dd.mm.yyyy', async () => {
		render(<Harness hydrate="2019-06-04" />)
		await waitFor(() => expect(display()).toHaveValue('04.06.2019'))
	})

	it('clears an unparseable entry on blur', async () => {
		render(<Harness />)
		fireEvent.change(display(), { target: { value: '3102' } })
		fireEvent.blur(display())
		expect(display()).toHaveValue('')
		await waitFor(() => expect(screen.getByTestId('iso')).toHaveTextContent(''))
	})

	it('picks a day from the calendar and reports it as ISO', async () => {
		render(<Harness hydrate="2026-03-15" />)
		await waitFor(() => expect(display()).toHaveValue('15.03.2026'))
		fireEvent.mouseDown(screen.getByLabelText('Open calendar'))
		fireEvent.click(screen.getByRole('button', { name: '2026-03-20' }))
		expect(display()).toHaveValue('20.03.2026')
		await waitFor(() => expect(screen.getByTestId('iso')).toHaveTextContent('2026-03-20'))
	})

	it('starts the week on Monday', () => {
		render(<Harness />)
		fireEvent.mouseDown(screen.getByLabelText('Open calendar'))
		const weekdays = screen.getByRole('dialog').querySelectorAll('span.text-caption')
		expect(weekdays[0]?.textContent).toBe('Mon')
	})

	it('names the month in German', async () => {
		render(<Harness locale="de" hydrate="2026-03-15" />)
		await waitFor(() => expect(display()).toHaveValue('15.03.2026'))
		fireEvent.mouseDown(screen.getByLabelText('Kalender öffnen'))
		expect(screen.getByRole('dialog')).toHaveTextContent('März 2026')
	})

	it('names the month in English', async () => {
		render(<Harness hydrate="2026-03-15" />)
		await waitFor(() => expect(display()).toHaveValue('15.03.2026'))
		fireEvent.mouseDown(screen.getByLabelText('Open calendar'))
		expect(screen.getByRole('dialog')).toHaveTextContent('March 2026')
	})

	it('does not open the calendar when disabled', () => {
		render(<Harness disabled />)
		expect(display()).toBeDisabled()
		fireEvent.mouseDown(screen.getByLabelText('Open calendar'))
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
	})

	it('disables the registered input too, so a locked report cannot be edited', () => {
		render(<Harness disabled />)
		expect(isoInput()).toBeDisabled()
	})
})
