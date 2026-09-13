import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Widerrufsbelehrung — Gut8erPRO',
}

function WiderrufPage() {
	return (
		<>
			<h1 className="text-page-title font-semibold">Widerrufsbelehrung</h1>

			<p>
				Gut8erPRO richtet sich ausschließlich an Unternehmer im Sinne des § 14 BGB
				(Kfz-Sachverständige). Ein gesetzliches Widerrufsrecht für Verbraucher (§§ 312g, 355 BGB)
				findet daher keine Anwendung.
			</p>

			<h2 className="text-h2 font-medium">Freiwillige Testphase und Kündigung</h2>
			<p>
				Unabhängig vom gesetzlichen Widerrufsrecht räumen wir Ihnen eine 7-tägige kostenlose
				Testphase ein. Während dieser Phase können Sie den Vertrag jederzeit ohne Angabe von Gründen
				und ohne Kosten beenden, indem Sie ihn in den Einstellungen kündigen oder uns eine E-Mail an
				[kontakt@beispiel.de] senden.
			</p>

			<h2 className="text-h2 font-medium">Folgen der Kündigung in der Testphase</h2>
			<p>
				Sofern Sie innerhalb der Testphase kündigen, erfolgt keine Abbuchung. Bereits in der
				Software gespeicherte Daten werden gemäß unserer Datenschutzerklärung verarbeitet bzw.
				gelöscht. Sie können vor Kündigung jederzeit einen Datenexport in den Einstellungen
				anstoßen.
			</p>

			<h2 className="text-h2 font-medium">Ordentliche Kündigung nach der Testphase</h2>
			<p>
				Nach Ablauf der Testphase gelten die in den{' '}
				<a href="/legal/agb" className="text-primary underline">
					AGB
				</a>{' '}
				geregelten Kündigungsfristen.
			</p>

			<p className="text-caption text-grey-100">
				⚠ Diese Widerrufsbelehrung gilt unter der Annahme einer reinen B2B-Plattform. Sollten Sie
				Verbraucherkunden adressieren, ist die Belehrung anzupassen.
			</p>
		</>
	)
}

export default WiderrufPage
