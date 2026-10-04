import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it } from 'vitest'
import de from '@/messages/de.json'
import en from '@/messages/en.json'
import { MissingVehicleFields } from './missing-vehicle-fields'

function renderIn(locale: 'de' | 'en', fields: string[]) {
	return render(
		<NextIntlClientProvider locale={locale} messages={locale === 'de' ? de : en}>
			<MissingVehicleFields fields={fields} />
		</NextIntlClientProvider>,
	)
}

describe('MissingVehicleFields', () => {
	it('names the fields Generate left empty, in German', () => {
		renderIn('de', ['powerKw', 'engineDisplacementCcm'])
		expect(
			screen.getByText('Nicht im Fahrzeugschein: kW, Hubraum — bitte eintragen'),
		).toBeInTheDocument()
	})

	it('names the fields Generate left empty, in English', () => {
		renderIn('en', ['powerKw', 'firstRegistration'])
		expect(
			screen.getByText('Not on the registration document: kW, First registration — please enter'),
		).toBeInTheDocument()
	})

	it('renders nothing when every field was stated', () => {
		const { container } = renderIn('de', [])
		expect(container).toBeEmptyDOMElement()
	})

	it('skips a field name it has no label for', () => {
		// A summary persisted by a later version may name a field this build
		// does not know.
		renderIn('en', ['powerKw', 'somethingNew'])
		expect(
			screen.getByText('Not on the registration document: kW — please enter'),
		).toBeInTheDocument()
	})
})
