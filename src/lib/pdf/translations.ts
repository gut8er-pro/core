import type { Locale } from '@/i18n/config'

type PdfTranslations = {
	vehicleDamageAssessment: string
	vehicleValuation: string
	oldtimerValuation: string
	reportNo: string
	date: string
	vehicleInformation: string
	manufacturer: string
	type: string
	subtype: string
	vin: string
	kbaNumber: string
	firstRegistration: string
	power: string
	engineDesign: string
	displacement: string
	transmission: string
	vehicleType: string
	doors: string
	seats: string
	previousOwners: string
	accidentInformation: string
	claimant: string
	name: string
	company: string
	address: string
	email: string
	phone: string
	licensePlate: string
	vehicleCondition: string
	generalCondition: string
	bodyCondition: string
	interiorCondition: string
	paintType: string
	paintFinish: string
	paintCondition: string
	drivingAbility: string
	mileage: string
	estimatedMileage: string
	nextMot: string
	specialFeatures: string
	fullServiceHistory: string
	notes: string
	previousDamageReported: string
	existingDamageNotReported: string
	subsequentDamage: string
	valuationAndCalculation: string
	vehicleValue: string
	replacementValue: string
	residualValue: string
	diminutionInValue: string
	repair: string
	repairMethod: string
	damageClass: string
	lossOfUse: string
	costPerDay: string
	repairTime: string
	replacementTime: string
	additionalCosts: string
	invoice: string
	invoiceNumber: string
	invoiceDate: string
	description: string
	qty: string
	rate: string
	amount: string
	netTotal: string
	vat: string
	grossTotal: string
	photoDocumentation: string
	otherPhotos: string
	page: string
	of: string
	yes: string
	no: string
	valuation: string
	taxation: string
	dataSource: string
	maximumValue: string
	averageValue: string
	minimumValue: string
	valuationDate: string
	oldtimerValuationSection: string
	marketValue: string
	baseVehicleValue: string
	restorationValue: string
	days: string
	parkingSensors: string
	testDrivePerformed: string
	errorMemoryRead: string
	damageMarkersTitle: string
	markersWithoutDescription: string
	paintReadingsTitle: string
	tiresTitle: string
	tireSet: string
	tireProfile: string
}

const translations: Record<Locale, PdfTranslations> = {
	en: {
		vehicleDamageAssessment: 'Vehicle Damage Assessment Report',
		vehicleValuation: 'Vehicle Valuation Report',
		oldtimerValuation: 'Oldtimer Valuation Report',
		reportNo: 'Report No.',
		date: 'Date',
		vehicleInformation: 'Vehicle Information',
		manufacturer: 'Manufacturer',
		type: 'Type',
		subtype: 'Subtype',
		vin: 'VIN',
		kbaNumber: 'KBA Number',
		firstRegistration: 'First Registration',
		power: 'Power',
		engineDesign: 'Engine Design',
		displacement: 'Displacement',
		transmission: 'Transmission',
		vehicleType: 'Vehicle Type',
		doors: 'Doors',
		seats: 'Seats',
		previousOwners: 'Previous Owners',
		accidentInformation: 'Accident Information',
		claimant: 'Claimant',
		name: 'Name',
		company: 'Company',
		address: 'Address',
		email: 'Email',
		phone: 'Phone',
		licensePlate: 'License Plate',
		vehicleCondition: 'Vehicle Condition',
		generalCondition: 'General Condition',
		bodyCondition: 'Body Condition',
		interiorCondition: 'Interior Condition',
		paintType: 'Paint Type',
		paintFinish: 'Paint Finish',
		paintCondition: 'Paint Condition',
		drivingAbility: 'Driving Ability',
		mileage: 'Mileage',
		estimatedMileage: 'Estimated Mileage',
		nextMot: 'Next MOT',
		specialFeatures: 'Special Features',
		fullServiceHistory: 'Full Service History',
		notes: 'Notes',
		previousDamageReported: 'Previous Damage Reported',
		existingDamageNotReported: 'Existing Damage (Not Reported)',
		subsequentDamage: 'Subsequent Damage',
		valuationAndCalculation: 'Valuation & Calculation',
		vehicleValue: 'Vehicle Value',
		replacementValue: 'Replacement Value',
		residualValue: 'Residual Value',
		diminutionInValue: 'Diminution in Value',
		repair: 'Repair',
		repairMethod: 'Repair Method',
		damageClass: 'Damage Class',
		lossOfUse: 'Loss of Use',
		costPerDay: 'Cost per Day',
		repairTime: 'Repair Time',
		replacementTime: 'Replacement Time',
		additionalCosts: 'Additional Costs',
		invoice: 'Invoice',
		invoiceNumber: 'Invoice Number',
		invoiceDate: 'Invoice Date',
		description: 'Description',
		qty: 'Qty',
		rate: 'Rate',
		amount: 'Amount',
		netTotal: 'Net Total',
		vat: 'VAT',
		grossTotal: 'Gross Total',
		photoDocumentation: 'Photo Documentation',
		otherPhotos: 'Other Photos',
		page: 'Page',
		of: 'of',
		yes: 'Yes',
		no: 'No',
		valuation: 'Valuation',
		taxation: 'Taxation',
		dataSource: 'Data Source',
		maximumValue: 'Maximum Value',
		averageValue: 'Average Value',
		minimumValue: 'Minimum Value',
		valuationDate: 'Valuation Date',
		oldtimerValuationSection: 'Oldtimer Valuation',
		marketValue: 'Market Value',
		baseVehicleValue: 'Base Vehicle Value',
		restorationValue: 'Restoration Value',
		days: 'days',
		parkingSensors: 'Parking Sensors',
		testDrivePerformed: 'Test Drive Performed',
		errorMemoryRead: 'Error Memory Read',
		damageMarkersTitle: 'Damage Markers',
		markersWithoutDescription: 'markers without description',
		paintReadingsTitle: 'Paint Thickness Readings',
		tiresTitle: 'Tires',
		tireSet: 'Set',
		tireProfile: 'profile',
	},
	de: {
		vehicleDamageAssessment: 'Kfz-Schadensgutachten',
		vehicleValuation: 'Fahrzeugbewertung',
		oldtimerValuation: 'Oldtimer-Wertgutachten',
		reportNo: 'Gutachten-Nr.',
		date: 'Datum',
		vehicleInformation: 'Fahrzeuginformationen',
		manufacturer: 'Hersteller',
		type: 'Typ',
		subtype: 'Untertyp',
		vin: 'FIN',
		kbaNumber: 'Schlüsselnummer (KBA)',
		firstRegistration: 'Erstzulassung',
		power: 'Leistung',
		engineDesign: 'Motortyp',
		displacement: 'Hubraum',
		transmission: 'Getriebe',
		vehicleType: 'Fahrzeugart',
		doors: 'Türen',
		seats: 'Sitze',
		previousOwners: 'Vorbesitzer',
		accidentInformation: 'Unfallinformationen',
		claimant: 'Geschädigter',
		name: 'Name',
		company: 'Firma',
		address: 'Adresse',
		email: 'E-Mail',
		phone: 'Telefon',
		licensePlate: 'Kennzeichen',
		vehicleCondition: 'Fahrzeugzustand',
		generalCondition: 'Allgemeinzustand',
		bodyCondition: 'Karosseriezustand',
		interiorCondition: 'Innenraumzustand',
		paintType: 'Lackart',
		paintFinish: 'Lackierung',
		paintCondition: 'Lackzustand',
		drivingAbility: 'Fahrbereitschaft',
		mileage: 'Kilometerstand',
		estimatedMileage: 'Geschätzter Kilometerstand',
		nextMot: 'Nächste HU/AU',
		specialFeatures: 'Besondere Ausstattung',
		fullServiceHistory: 'Vollständige Servicehistorie',
		notes: 'Anmerkungen',
		previousDamageReported: 'Vorschäden (bekannt)',
		existingDamageNotReported: 'Altschäden (nicht gemeldet)',
		subsequentDamage: 'Nachfolgeschäden',
		valuationAndCalculation: 'Bewertung & Kalkulation',
		vehicleValue: 'Fahrzeugwert',
		replacementValue: 'Wiederbeschaffungswert',
		residualValue: 'Restwert',
		diminutionInValue: 'Wertminderung',
		repair: 'Reparatur',
		repairMethod: 'Reparaturmethode',
		damageClass: 'Schadensklasse',
		lossOfUse: 'Nutzungsausfall',
		costPerDay: 'Kosten pro Tag',
		repairTime: 'Reparaturdauer',
		replacementTime: 'Ersatzbeschaffungszeit',
		additionalCosts: 'Nebenkosten',
		invoice: 'Rechnung',
		invoiceNumber: 'Rechnungsnummer',
		invoiceDate: 'Rechnungsdatum',
		description: 'Beschreibung',
		qty: 'Menge',
		rate: 'Satz',
		amount: 'Betrag',
		netTotal: 'Nettobetrag',
		vat: 'MwSt.',
		grossTotal: 'Bruttobetrag',
		photoDocumentation: 'Fotodokumentation',
		otherPhotos: 'Weitere Fotos',
		page: 'Seite',
		of: 'von',
		yes: 'Ja',
		no: 'Nein',
		valuation: 'Bewertung',
		taxation: 'Besteuerung',
		dataSource: 'Datenquelle',
		maximumValue: 'Höchstwert',
		averageValue: 'Durchschnittswert',
		minimumValue: 'Mindestwert',
		valuationDate: 'Bewertungsdatum',
		oldtimerValuationSection: 'Oldtimer-Bewertung',
		marketValue: 'Marktwert',
		baseVehicleValue: 'Basisfahrzeugwert',
		restorationValue: 'Restaurierungswert',
		days: 'Tage',
		parkingSensors: 'Einparkhilfe',
		testDrivePerformed: 'Probefahrt durchgeführt',
		errorMemoryRead: 'Fehlerspeicher ausgelesen',
		damageMarkersTitle: 'Schadensmarkierungen',
		markersWithoutDescription: 'Markierungen ohne Beschreibung',
		paintReadingsTitle: 'Lackschichtdickenmessung',
		tiresTitle: 'Bereifung',
		tireSet: 'Satz',
		tireProfile: 'Profil',
	},
}

function getPdfTranslations(locale: string): PdfTranslations {
	return translations[locale as Locale] ?? translations.en
}

/**
 * Translate stored DB values (dropdown options) to the target locale.
 * These values are saved in English but need to display in the PDF locale.
 */
const valueTranslations: Record<string, string> = {
	// Engine Design
	Inline: 'Reihe',
	'V-Type': 'V-Motor',
	Boxer: 'Boxer',
	Rotary: 'Wankel',
	// Transmission
	'Manual (5-speed)': 'Schaltgetriebe (5-Gang)',
	'Manual (6-speed)': 'Schaltgetriebe (6-Gang)',
	Automatic: 'Automatik',
	CVT: 'CVT',
	DCT: 'Doppelkupplung',
	// Vehicle Type
	sedan: 'Limousine',
	compact: 'Kompaktwagen',
	suv: 'SUV',
	wagon: 'Kombi',
	coupe: 'Coupé',
	convertible: 'Cabriolet',
	van: 'Transporter',
	// General Condition
	'Well maintained': 'Gepflegt',
	Average: 'Durchschnittlich',
	Poor: 'Schlecht',
	// Body Condition
	'Minor cosmetic': 'Leichte Gebrauchsspuren',
	'No damage': 'Keine Schäden',
	'Structural damage': 'Strukturschäden',
	// Interior Condition
	'Clean, no structural damage.': 'Sauber, keine strukturellen Schäden.',
	'Minor wear': 'Leichte Abnutzung',
	'Significant wear': 'Erhebliche Abnutzung',
	// Paint Type
	'Uni (2 Schicht)': 'Uni (2-Schicht)',
	Metallic: 'Metallic',
	Pearl: 'Perleffekt',
	Matte: 'Matt',
	// Paint Finish
	'Original manufacturer paint': 'Originallackierung',
	Repainted: 'Nachlackiert',
	Mixed: 'Gemischt',
	// Paint Condition
	Good: 'Gut',
	Fair: 'Befriedigend',
	// Driving Ability
	Roadworthy: 'Fahrbereit',
	Limited: 'Eingeschränkt',
	'Not roadworthy': 'Nicht fahrbereit',
}

function translateValue(value: string | null | undefined, locale: string): string {
	if (!value) return ''
	if (locale === 'en') return value
	return valueTranslations[value] ?? value
}

export type { PdfTranslations }
export { getPdfTranslations, translateValue }
