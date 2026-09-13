import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Impressum — Gut8erPRO',
}

function ImpressumPage() {
	return (
		<>
			<h1 className="text-page-title font-semibold">Impressum</h1>

			<h2 className="text-h2 font-medium">Angaben gemäß § 5 TMG</h2>
			<p>
				[Firmenname]
				<br />
				[Straße und Hausnummer]
				<br />
				[PLZ] [Ort]
				<br />
				Deutschland
			</p>

			<h2 className="text-h2 font-medium">Vertreten durch</h2>
			<p>[Name des Geschäftsführers / der vertretungsberechtigten Person]</p>

			<h2 className="text-h2 font-medium">Kontakt</h2>
			<p>
				Telefon: [+49 …]
				<br />
				E-Mail: [kontakt@beispiel.de]
			</p>

			<h2 className="text-h2 font-medium">Registereintrag</h2>
			<p>
				Eintragung im Handelsregister.
				<br />
				Registergericht: [Amtsgericht]
				<br />
				Registernummer: [HRB …]
			</p>

			<h2 className="text-h2 font-medium">Umsatzsteuer-ID</h2>
			<p>
				Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:
				<br />
				DE …
			</p>

			<h2 className="text-h2 font-medium">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
			<p>
				[Name]
				<br />
				[Anschrift]
			</p>

			<h2 className="text-h2 font-medium">EU-Streitschlichtung</h2>
			<p>
				Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
				<a
					href="https://ec.europa.eu/consumers/odr/"
					className="text-primary underline"
					target="_blank"
					rel="noopener noreferrer"
				>
					https://ec.europa.eu/consumers/odr/
				</a>
				. Unsere E-Mail-Adresse finden Sie oben im Impressum.
			</p>

			<h2 className="text-h2 font-medium">
				Verbraucherstreitbeilegung / Universalschlichtungsstelle
			</h2>
			<p>
				Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
				Verbraucherschlichtungsstelle teilzunehmen.
			</p>

			<p className="text-caption text-grey-100">
				⚠ Diese Seite enthält noch Platzhalter. Bitte vor dem Launch durch die finalen Firmenangaben
				ersetzen — siehe rechtliche Anforderungen nach § 5 TMG.
			</p>
		</>
	)
}

export default ImpressumPage
