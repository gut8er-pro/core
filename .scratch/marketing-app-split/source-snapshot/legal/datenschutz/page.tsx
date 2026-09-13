import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Datenschutzerklärung — Gut8erPRO',
}

function DatenschutzPage() {
	return (
		<>
			<h1 className="text-page-title font-semibold">Datenschutzerklärung</h1>

			<h2 className="text-h2 font-medium">1. Verantwortlicher</h2>
			<p>
				Verantwortlich für die Datenverarbeitung auf dieser Website ist:
				<br />
				[Firmenname], [Straße], [PLZ Ort], Deutschland
				<br />
				E-Mail: [datenschutz@beispiel.de]
			</p>

			<h2 className="text-h2 font-medium">2. Allgemeines zur Datenverarbeitung</h2>
			<p>
				Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur, soweit dies zur
				Bereitstellung einer funktionsfähigen Website sowie unserer Inhalte und Leistungen
				erforderlich ist.
			</p>

			<h2 className="text-h2 font-medium">3. Daten, die wir verarbeiten</h2>
			<ul className="list-disc pl-6">
				<li>Account-Daten (E-Mail, Name, Firmenangaben) — gespeichert in Supabase Auth/Postgres</li>
				<li>Hochgeladene Fotos und Gutachten-Inhalte — gespeichert in Supabase Storage/Postgres</li>
				<li>
					Zahlungsdaten — verarbeitet durch Stripe (PCI-DSS-konform), nicht bei uns gespeichert
				</li>
				<li>E-Mail-Versand — über Resend; Empfängeradresse und Betreff werden geloggt</li>
				<li>KI-Auswertung — Fotos werden zur Analyse an Anthropic (Claude) übermittelt</li>
			</ul>

			<h2 className="text-h2 font-medium">4. Rechtsgrundlagen</h2>
			<p>
				Soweit wir für Verarbeitungsvorgänge personenbezogener Daten eine Einwilligung der
				betroffenen Person einholen, dient Art. 6 Abs. 1 lit. a DSGVO als Rechtsgrundlage. Bei der
				Verarbeitung von personenbezogenen Daten, die zur Erfüllung eines Vertrags erforderlich ist,
				dient Art. 6 Abs. 1 lit. b DSGVO als Rechtsgrundlage.
			</p>

			<h2 className="text-h2 font-medium">5. Auftragsverarbeiter</h2>
			<ul className="list-disc pl-6">
				<li>Supabase — Authentifizierung, Datenbank, Storage (EU-Region)</li>
				<li>Stripe — Zahlungsabwicklung</li>
				<li>Resend — Versand transaktionaler E-Mails</li>
				<li>Anthropic (Claude) — KI-gestützte Bildanalyse</li>
				<li>Vercel — Hosting</li>
				<li>Sentry — Fehler-Monitoring (optional, falls aktiviert)</li>
			</ul>
			<p>
				Mit allen externen Auftragsverarbeitern bestehen Auftragsverarbeitungsverträge (AVV) gemäß
				Art. 28 DSGVO.
			</p>

			<h2 className="text-h2 font-medium">6. Speicherdauer</h2>
			<p>
				Account-Daten werden gelöscht, sobald sie für die Zwecke ihrer Erhebung nicht mehr
				erforderlich sind. Sie können jederzeit die Löschung Ihres Accounts und aller damit
				verknüpften Daten in den Einstellungen verlangen.
			</p>

			<h2 className="text-h2 font-medium">7. Ihre Rechte</h2>
			<p>
				Sie haben gegenüber uns folgende Rechte hinsichtlich der Sie betreffenden personenbezogenen
				Daten:
			</p>
			<ul className="list-disc pl-6">
				<li>Auskunft (Art. 15 DSGVO)</li>
				<li>Berichtigung oder Löschung (Art. 16, 17 DSGVO)</li>
				<li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
				<li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
				<li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
				<li>Beschwerde bei einer Aufsichtsbehörde</li>
			</ul>
			<p>
				Datenexport und Account-Löschung können Sie selbst über die Einstellungen anstoßen oder per
				E-Mail an [datenschutz@beispiel.de] anfordern.
			</p>

			<h2 className="text-h2 font-medium">8. Cookies</h2>
			<p>
				Wir setzen ausschließlich technisch notwendige Cookies (Session-Cookies zur
				Authentifizierung) ein. Es findet kein Tracking und keine Profilbildung statt.
			</p>

			<p className="text-caption text-grey-100">
				⚠ Diese Datenschutzerklärung enthält Platzhalter und sollte vor dem Launch durch einen
				Anwalt geprüft werden.
			</p>
		</>
	)
}

export default DatenschutzPage
