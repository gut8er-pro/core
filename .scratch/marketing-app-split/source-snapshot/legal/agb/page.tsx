import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'AGB — Gut8erPRO',
}

function AGBPage() {
	return (
		<>
			<h1 className="text-page-title font-semibold">Allgemeine Geschäftsbedingungen</h1>

			<h2 className="text-h2 font-medium">§ 1 Geltungsbereich</h2>
			<p>
				Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen [Firmenname]
				(nachfolgend „Anbieter") und Unternehmern im Sinne des § 14 BGB (nachfolgend „Kunde") über
				die Nutzung der Software-as-a-Service-Plattform Gut8erPRO.
			</p>

			<h2 className="text-h2 font-medium">§ 2 Vertragsgegenstand</h2>
			<p>
				Der Anbieter stellt dem Kunden die Software Gut8erPRO als webbasierte Anwendung zur
				Erstellung von Kfz-Gutachten zur Verfügung. Die Software unterstützt insbesondere bei der
				Erstellung von Haftpflicht-, Bewertungs-, Kurz- und Oldtimer-Gutachten.
			</p>

			<h2 className="text-h2 font-medium">§ 3 Vertragsschluss, Testphase</h2>
			<p>
				Der Vertrag kommt durch die Online-Anmeldung des Kunden zustande. Neue Kunden erhalten eine
				kostenlose Testphase von 7 Tagen. Eine Zahlungsmethode wird bereits bei der Anmeldung
				hinterlegt; eine Abbuchung erfolgt erst nach Ablauf der Testphase, sofern der Kunde nicht
				vor Ablauf kündigt.
			</p>

			<h2 className="text-h2 font-medium">§ 4 Preise und Zahlung</h2>
			<p>
				Die aktuelle Vergütung ergibt sich aus der Preisübersicht auf der Website. Die Vergütung
				beträgt derzeit 69 €/Monat (netto, zzgl. gesetzlicher Umsatzsteuer). Die Abrechnung erfolgt
				monatlich im Voraus. Zahlungsdienstleister ist Stripe.
			</p>

			<h2 className="text-h2 font-medium">§ 5 Laufzeit und Kündigung</h2>
			<p>
				Der Vertrag wird auf unbestimmte Zeit geschlossen und kann mit einer Frist von einem Monat
				zum Monatsende vom Kunden in den Einstellungen oder per E-Mail an [kontakt@beispiel.de]
				gekündigt werden. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt
				unberührt.
			</p>

			<h2 className="text-h2 font-medium">§ 6 Verfügbarkeit</h2>
			<p>
				Der Anbieter bemüht sich um eine möglichst hohe Verfügbarkeit der Software. Wartungs-
				arbeiten und nicht beeinflussbare technische Störungen können zu kurzzeitigen
				Beeinträchtigungen führen.
			</p>

			<h2 className="text-h2 font-medium">§ 7 Pflichten des Kunden</h2>
			<p>
				Der Kunde verpflichtet sich, die Zugangsdaten zur Software vertraulich zu behandeln und vor
				dem Zugriff Dritter zu schützen. Der Kunde ist für die inhaltliche Richtigkeit der von ihm
				eingegebenen Daten und erstellten Gutachten allein verantwortlich. Insbesondere ersetzt die
				KI-gestützte Vorbefüllung nicht die fachliche Prüfung durch den Sachverständigen.
			</p>

			<h2 className="text-h2 font-medium">§ 8 Haftung</h2>
			<p>
				Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach den
				Vorschriften des Produkthaftungsgesetzes. Für leichte Fahrlässigkeit haftet der Anbieter nur
				bei Verletzung einer wesentlichen Vertragspflicht und beschränkt auf den bei Vertragsschluss
				vorhersehbaren, vertragstypischen Schaden.
			</p>

			<h2 className="text-h2 font-medium">§ 9 Datenschutz</h2>
			<p>
				Der Schutz personenbezogener Daten richtet sich nach unserer{' '}
				<a href="/legal/datenschutz" className="text-primary underline">
					Datenschutzerklärung
				</a>
				.
			</p>

			<h2 className="text-h2 font-medium">§ 10 Schlussbestimmungen</h2>
			<p>
				Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
				Gerichtsstand ist, soweit gesetzlich zulässig, der Sitz des Anbieters.
			</p>

			<p className="text-caption text-grey-100">
				⚠ Diese AGB enthalten Platzhalter und sollten vor dem Launch durch einen Anwalt geprüft
				werden.
			</p>
		</>
	)
}

export default AGBPage
