import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { PdfTranslations } from './translations'
import { translateValue } from './translations'

// ─── Types ────────────────────────────────────────────────────

type ReportData = {
	report: {
		id: string
		title: string
		reportType: string
		createdAt: Date
		updatedAt: Date
	}
	accidentInfo: {
		accidentDay: Date | null
		accidentScene: string | null
	} | null
	claimantInfo: {
		company: string | null
		salutation: string | null
		firstName: string | null
		lastName: string | null
		street: string | null
		postcode: string | null
		location: string | null
		email: string | null
		phone: string | null
		vehicleMake: string | null
		licensePlate: string | null
		eligibleForInputTaxDeduction: boolean
		isVehicleOwner: boolean
		representedByLawyer: boolean
		involvedLawyer: string | null
	} | null
	opponentInfo: {
		company: string | null
		salutation: string | null
		firstName: string | null
		lastName: string | null
		street: string | null
		postcode: string | null
		location: string | null
		email: string | null
		phone: string | null
		insuranceCompany: string | null
		insuranceNumber: string | null
	} | null
	vehicleInfo: {
		vin: string | null
		datsCode: string | null
		manufacturer: string | null
		mainType: string | null
		subtype: string | null
		kbaNumber: string | null
		powerKw: number | null
		powerHp: number | null
		engineDesign: string | null
		cylinders: number | null
		transmission: string | null
		engineDisplacementCcm: number | null
		firstRegistration: Date | null
		lastRegistration: Date | null
		vehicleType: string | null
		motorType: string | null
		axles: number | null
		doors: number | null
		seats: number | null
		previousOwners: number | null
	} | null
	condition: {
		paintType: string | null
		hard: string | null
		paintCondition: string | null
		vehicleColor: string | null
		generalCondition: string | null
		bodyCondition: string | null
		interiorCondition: string | null
		drivingAbility: string | null
		specialFeatures: string | null
		parkingSensors: boolean
		mileageRead: number | null
		estimateMileage: number | null
		unit: string
		nextMot: Date | null
		fullServiceHistory: boolean
		testDrivePerformed: boolean
		errorMemoryRead: boolean
		airbagsDeployed: boolean
		notes: string | null
		previousDamageReported: string | null
		existingDamageNotReported: string | null
		subsequentDamage: string | null
		damageMarkers: {
			x: number
			y: number
			comment: string | null
		}[]
		paintMarkers: {
			position: string | null
			thickness: number
		}[]
		tireSets: {
			setNumber: number
			matchAndAlloy: string | null
			tires: {
				position: string
				size: string | null
				profileLevel: number | null
				manufacturer: string | null
				dotCode: string | null
				tireType: string | null
			}[]
		}[]
	} | null
	visits: {
		type: string
		street: string | null
		postcode: string | null
		location: string | null
		date: Date | null
		expert: string | null
		vehicleCondition: string | null
	}[]
	expertOpinion: {
		expertName: string | null
		fileNumber: string | null
		caseDate: Date | null
		orderWasPlacement: string | null
		issuedDate: Date | null
		orderByClaimant: boolean
		mediator: string | null
	} | null
	signatures: {
		type: string
		imageUrl: string | null
	}[]
	calculation: {
		replacementValue: number | null
		taxRate: string | null
		residualValue: number | null
		diminutionInValue: number | null
		wheelAlignment: string | null
		bodyMeasurements: string | null
		bodyPaint: string | null
		plasticRepair: boolean
		repairMethod: string | null
		risks: string | null
		damageClass: string | null
		dropoutGroup: string | null
		costPerDay: number | null
		rentalCarClass: string | null
		repairTimeDays: number | null
		replacementTimeDays: number | null
		// BE valuation
		generalCondition: string | null
		taxation: string | null
		dataSource: string | null
		valuationMax: number | null
		valuationAvg: number | null
		valuationMin: number | null
		valuationDate: string | null
		// OT valuation
		marketValue: number | null
		baseVehicleValue: number | null
		restorationValue: number | null
		additionalCosts: { description: string; amount: number }[]
	} | null
	invoice: {
		invoiceNumber: string | null
		date: Date | null
		totalNet: number
		totalGross: number
		taxRate: number
		lineItems: {
			description: string
			amount: number
			quantity: number
			rate: number
			isLumpSum: boolean
			order: number
		}[]
	} | null
	exportConfig: {
		includeVehicleValuation: boolean
		includeInvoice: boolean
	}
	photos: {
		id: string
		url: string
		annotatedUrl: string | null
		filename: string
		aiClassification: string | null
		aiDescription: string | null
	}[]
	expert: {
		firstName: string | null
		lastName: string | null
		companyName: string | null
	} | null
}

// ─── Styles ───────────────────────────────────────────────────

const PRIMARY_GREEN = '#16A34A'
const DARK_TEXT = '#1A1A1A'
const GREY_TEXT = '#6B7280'
const BORDER_COLOR = '#E5E7EB'
const LIGHT_BG = '#F7F8FA'

const styles = StyleSheet.create({
	page: {
		fontFamily: 'Helvetica',
		fontSize: 10,
		paddingTop: 60,
		paddingBottom: 60,
		paddingHorizontal: 50,
		color: DARK_TEXT,
	},
	// Header
	header: {
		marginBottom: 30,
		borderBottomWidth: 2,
		borderBottomColor: PRIMARY_GREEN,
		paddingBottom: 15,
	},
	headerTitle: {
		fontSize: 22,
		fontFamily: 'Helvetica-Bold',
		color: DARK_TEXT,
		marginBottom: 6,
	},
	headerSubtitle: {
		fontSize: 10,
		color: GREY_TEXT,
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
	},
	headerLeft: {
		flex: 1,
	},
	headerRight: {
		alignItems: 'flex-end',
	},
	reportNumber: {
		fontSize: 9,
		color: GREY_TEXT,
		marginTop: 4,
	},
	// Section
	section: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 13,
		fontFamily: 'Helvetica-Bold',
		color: PRIMARY_GREEN,
		marginBottom: 10,
		paddingBottom: 4,
		borderBottomWidth: 1,
		borderBottomColor: BORDER_COLOR,
	},
	// Data rows
	dataRow: {
		flexDirection: 'row',
		paddingVertical: 4,
		borderBottomWidth: 0.5,
		borderBottomColor: BORDER_COLOR,
	},
	dataLabel: {
		width: 180,
		fontSize: 9,
		color: GREY_TEXT,
		fontFamily: 'Helvetica-Bold',
	},
	dataValue: {
		flex: 1,
		fontSize: 9,
		color: DARK_TEXT,
	},
	// Table
	tableHeader: {
		flexDirection: 'row',
		backgroundColor: LIGHT_BG,
		paddingVertical: 6,
		paddingHorizontal: 8,
		borderBottomWidth: 1,
		borderBottomColor: PRIMARY_GREEN,
	},
	tableHeaderText: {
		fontSize: 8,
		fontFamily: 'Helvetica-Bold',
		color: DARK_TEXT,
	},
	tableRow: {
		flexDirection: 'row',
		paddingVertical: 5,
		paddingHorizontal: 8,
		borderBottomWidth: 0.5,
		borderBottomColor: BORDER_COLOR,
	},
	tableRowAlt: {
		flexDirection: 'row',
		paddingVertical: 5,
		paddingHorizontal: 8,
		borderBottomWidth: 0.5,
		borderBottomColor: BORDER_COLOR,
		backgroundColor: LIGHT_BG,
	},
	tableCell: {
		fontSize: 9,
		color: DARK_TEXT,
	},
	colPos: { width: 30 },
	colDescription: { flex: 1 },
	colQuantity: { width: 50, textAlign: 'right' as const },
	colRate: { width: 70, textAlign: 'right' as const },
	colAmount: { width: 80, textAlign: 'right' as const },
	// Totals
	totalsContainer: {
		marginTop: 10,
		alignItems: 'flex-end' as const,
	},
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		paddingVertical: 3,
		width: 250,
	},
	totalLabel: {
		fontSize: 9,
		color: GREY_TEXT,
		width: 150,
		textAlign: 'right' as const,
		paddingRight: 15,
	},
	totalValue: {
		fontSize: 9,
		color: DARK_TEXT,
		width: 100,
		textAlign: 'right' as const,
	},
	totalGrossRow: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		paddingVertical: 5,
		width: 250,
		borderTopWidth: 1.5,
		borderTopColor: PRIMARY_GREEN,
		marginTop: 3,
	},
	totalGrossLabel: {
		fontSize: 10,
		fontFamily: 'Helvetica-Bold',
		color: DARK_TEXT,
		width: 150,
		textAlign: 'right' as const,
		paddingRight: 15,
	},
	totalGrossValue: {
		fontSize: 10,
		fontFamily: 'Helvetica-Bold',
		color: DARK_TEXT,
		width: 100,
		textAlign: 'right' as const,
	},
	// Footer
	footer: {
		position: 'absolute',
		bottom: 25,
		left: 50,
		right: 50,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		borderTopWidth: 1,
		borderTopColor: BORDER_COLOR,
		paddingTop: 8,
	},
	footerLeft: {
		fontSize: 8,
		color: GREY_TEXT,
	},
	footerRight: {
		fontSize: 8,
		color: GREY_TEXT,
	},
	// Photo gallery
	photoGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	photoItem: {
		width: '48%',
		marginBottom: 8,
	},
	photoImage: {
		width: '100%',
		height: 180,
		objectFit: 'cover',
		borderRadius: 4,
		borderWidth: 0.5,
		borderColor: BORDER_COLOR,
	},
	photoCaption: {
		fontSize: 7,
		color: GREY_TEXT,
		marginTop: 3,
		maxLines: 2,
	},
	photoCategoryTitle: {
		fontSize: 10,
		fontFamily: 'Helvetica-Bold',
		color: DARK_TEXT,
		marginBottom: 6,
		marginTop: 8,
	},
	// Utility
	textBold: {
		fontFamily: 'Helvetica-Bold',
	},
	noData: {
		fontSize: 9,
		color: GREY_TEXT,
		fontStyle: 'italic',
	},
})

// ─── Helpers ──────────────────────────────────────────────────

function formatDate(date: Date | string | null | undefined): string {
	if (!date) return '-'
	const d = typeof date === 'string' ? new Date(date) : date
	if (Number.isNaN(d.getTime())) return '-'
	return d.toLocaleDateString('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	})
}

function formatCurrency(value: number | null | undefined): string {
	if (value === null || value === undefined) return '-'
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
	}).format(value)
}

function formatNumber(value: number | null | undefined, suffix?: string): string {
	if (value === null || value === undefined) return '-'
	const formatted = new Intl.NumberFormat('de-DE').format(value)
	return suffix ? `${formatted} ${suffix}` : formatted
}

function displayValue(value: string | number | null | undefined): string {
	if (value === null || value === undefined || value === '') return '-'
	return String(value)
}

// ─── Sub-components ───────────────────────────────────────────

function DataRow({ label, value }: { label: string; value: string }) {
	return (
		<View style={styles.dataRow}>
			<Text style={styles.dataLabel}>{label}</Text>
			<Text style={styles.dataValue}>{value}</Text>
		</View>
	)
}

function HeaderSection({ data, t }: { data: ReportData; t: PdfTranslations }) {
	const reportDate = formatDate(data.report.createdAt)
	const reportId = data.report.id.slice(0, 8).toUpperCase()

	return (
		<View style={styles.header}>
			<View style={styles.headerRow}>
				<View style={styles.headerLeft}>
					<Text style={styles.headerTitle}>{data.report.title}</Text>
					<Text style={styles.headerSubtitle}>
						{data.report.reportType === 'BE'
							? t.vehicleValuation
							: data.report.reportType === 'OT'
								? t.oldtimerValuation
								: t.vehicleDamageAssessment}
					</Text>
				</View>
				<View style={styles.headerRight}>
					<Text style={styles.reportNumber}>
						{t.reportNo} {reportId}
					</Text>
					<Text style={styles.reportNumber}>
						{t.date}: {reportDate}
					</Text>
				</View>
			</View>
		</View>
	)
}

function VehicleInfoSection({
	vehicleInfo,
	t,
	locale = 'en',
}: {
	vehicleInfo: ReportData['vehicleInfo']
	t: PdfTranslations
	locale?: string
}) {
	const tv = (v: string | null | undefined) => translateValue(v, locale)
	if (!vehicleInfo) return null

	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{t.vehicleInformation}</Text>
			<DataRow label={t.manufacturer} value={displayValue(vehicleInfo.manufacturer)} />
			<DataRow label={t.type} value={displayValue(vehicleInfo.mainType)} />
			{vehicleInfo.subtype && (
				<DataRow label={t.subtype} value={displayValue(vehicleInfo.subtype)} />
			)}
			<DataRow label={t.vin} value={displayValue(vehicleInfo.vin)} />
			{vehicleInfo.kbaNumber && (
				<DataRow label={t.kbaNumber} value={displayValue(vehicleInfo.kbaNumber)} />
			)}
			<DataRow label={t.firstRegistration} value={formatDate(vehicleInfo.firstRegistration)} />
			{vehicleInfo.lastRegistration && (
				<DataRow label="Last Registration" value={formatDate(vehicleInfo.lastRegistration)} />
			)}
			{vehicleInfo.powerKw && (
				<DataRow
					label={t.power}
					value={`${formatNumber(vehicleInfo.powerKw)} kW / ${formatNumber(vehicleInfo.powerHp)} PS`}
				/>
			)}
			{vehicleInfo.engineDesign && (
				<DataRow label={t.engineDesign} value={tv(vehicleInfo.engineDesign)} />
			)}
			{vehicleInfo.engineDisplacementCcm && (
				<DataRow
					label={t.displacement}
					value={formatNumber(vehicleInfo.engineDisplacementCcm, 'ccm')}
				/>
			)}
			{vehicleInfo.transmission && (
				<DataRow label={t.transmission} value={tv(vehicleInfo.transmission)} />
			)}
			{vehicleInfo.vehicleType && (
				<DataRow label={t.vehicleType} value={tv(vehicleInfo.vehicleType)} />
			)}
			{vehicleInfo.doors && <DataRow label={t.doors} value={formatNumber(vehicleInfo.doors)} />}
			{vehicleInfo.seats && <DataRow label={t.seats} value={formatNumber(vehicleInfo.seats)} />}
			{vehicleInfo.previousOwners !== null && vehicleInfo.previousOwners !== undefined && (
				<DataRow label={t.previousOwners} value={formatNumber(vehicleInfo.previousOwners)} />
			)}
		</View>
	)
}

function AccidentInfoSection({
	accidentInfo,
	claimantInfo,
	opponentInfo,
	t,
}: {
	accidentInfo: ReportData['accidentInfo']
	claimantInfo: ReportData['claimantInfo']
	opponentInfo: ReportData['opponentInfo']
	t: PdfTranslations
}) {
	if (!accidentInfo && !claimantInfo && !opponentInfo) return null

	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{t.accidentInformation}</Text>

			{accidentInfo && (
				<View style={{ marginBottom: 8 }}>
					<DataRow label={t.date} value={formatDate(accidentInfo.accidentDay)} />
					<DataRow label="Accident Scene" value={displayValue(accidentInfo.accidentScene)} />
				</View>
			)}

			{claimantInfo && (
				<View style={{ marginBottom: 8 }}>
					<Text style={[styles.dataLabel, { marginBottom: 4, marginTop: 6, fontSize: 10 }]}>
						{t.claimant}
					</Text>
					<DataRow
						label={t.name}
						value={
							[claimantInfo.salutation, claimantInfo.firstName, claimantInfo.lastName]
								.filter(Boolean)
								.join(' ') || '-'
						}
					/>
					{claimantInfo.company && (
						<DataRow label={t.company} value={displayValue(claimantInfo.company)} />
					)}
					<DataRow
						label={t.address}
						value={
							[claimantInfo.street, claimantInfo.postcode, claimantInfo.location]
								.filter(Boolean)
								.join(', ') || '-'
						}
					/>
					{claimantInfo.email && (
						<DataRow label={t.email} value={displayValue(claimantInfo.email)} />
					)}
					{claimantInfo.phone && (
						<DataRow label={t.phone} value={displayValue(claimantInfo.phone)} />
					)}
					{claimantInfo.licensePlate && (
						<DataRow label={t.licensePlate} value={displayValue(claimantInfo.licensePlate)} />
					)}
				</View>
			)}

			{opponentInfo && (
				<View style={{ marginBottom: 8 }}>
					<Text style={[styles.dataLabel, { marginBottom: 4, marginTop: 6, fontSize: 10 }]}>
						Opponent
					</Text>
					<DataRow
						label={t.name}
						value={
							[opponentInfo.salutation, opponentInfo.firstName, opponentInfo.lastName]
								.filter(Boolean)
								.join(' ') || '-'
						}
					/>
					{opponentInfo.company && (
						<DataRow label={t.company} value={displayValue(opponentInfo.company)} />
					)}
					{opponentInfo.insuranceCompany && (
						<DataRow
							label="Insurance Company"
							value={displayValue(opponentInfo.insuranceCompany)}
						/>
					)}
					{opponentInfo.insuranceNumber && (
						<DataRow label="Insurance Number" value={displayValue(opponentInfo.insuranceNumber)} />
					)}
				</View>
			)}
		</View>
	)
}

function ConditionSection({
	condition,
	t,
	locale = 'en',
}: {
	condition: ReportData['condition']
	t: PdfTranslations
	locale?: string
}) {
	const tv = (v: string | null | undefined) => translateValue(v, locale)
	if (!condition) return null

	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{t.vehicleCondition}</Text>
			<DataRow label={t.generalCondition} value={tv(condition.generalCondition)} />
			{condition.bodyCondition && (
				<DataRow label={t.bodyCondition} value={tv(condition.bodyCondition)} />
			)}
			{condition.interiorCondition && (
				<DataRow label={t.interiorCondition} value={tv(condition.interiorCondition)} />
			)}
			{condition.paintType && <DataRow label={t.paintType} value={tv(condition.paintType)} />}
			{condition.hard && <DataRow label={t.paintFinish} value={tv(condition.hard)} />}
			{condition.paintCondition && (
				<DataRow label={t.paintCondition} value={tv(condition.paintCondition)} />
			)}
			{condition.vehicleColor && (
				<DataRow label="Vehicle Color" value={displayValue(condition.vehicleColor)} />
			)}
			{condition.drivingAbility && (
				<DataRow label={t.drivingAbility} value={tv(condition.drivingAbility)} />
			)}
			{condition.mileageRead != null && (
				<DataRow label={t.mileage} value={formatNumber(condition.mileageRead, condition.unit)} />
			)}
			{condition.estimateMileage != null && (
				<DataRow
					label={t.estimatedMileage}
					value={formatNumber(condition.estimateMileage, condition.unit)}
				/>
			)}
			{condition.nextMot && <DataRow label={t.nextMot} value={formatDate(condition.nextMot)} />}
			{condition.specialFeatures && (
				<DataRow label={t.specialFeatures} value={displayValue(condition.specialFeatures)} />
			)}
			{condition.parkingSensors && <DataRow label={t.parkingSensors} value={t.yes} />}
			{condition.fullServiceHistory && <DataRow label={t.fullServiceHistory} value={t.yes} />}
			{condition.testDrivePerformed && <DataRow label={t.testDrivePerformed} value={t.yes} />}
			{condition.errorMemoryRead && <DataRow label={t.errorMemoryRead} value={t.yes} />}
			{condition.airbagsDeployed && <DataRow label="Airbags Deployed" value={t.yes} />}
			{condition.notes && <DataRow label={t.notes} value={displayValue(condition.notes)} />}
			{condition.previousDamageReported && (
				<DataRow
					label={t.previousDamageReported}
					value={displayValue(condition.previousDamageReported)}
				/>
			)}
			{condition.existingDamageNotReported && (
				<DataRow
					label={t.existingDamageNotReported}
					value={displayValue(condition.existingDamageNotReported)}
				/>
			)}
			{condition.subsequentDamage && (
				<DataRow label={t.subsequentDamage} value={displayValue(condition.subsequentDamage)} />
			)}

			{/* Damage Markers */}
			{condition.damageMarkers.length > 0 && (
				<View style={{ marginTop: 10 }}>
					<Text style={[styles.sectionTitle, { fontSize: 11, marginBottom: 6 }]}>
						{t.damageMarkersTitle}
					</Text>
					<View style={{ flexDirection: 'column', gap: 3 }}>
						{condition.damageMarkers
							.filter((m) => m.comment)
							.map((m, i) => (
								<View key={`dm-${i}`} style={{ flexDirection: 'row' }}>
									<Text style={[styles.dataLabel, { fontSize: 9, width: 30 }]}>#{i + 1}:</Text>
									<Text style={[styles.dataValue, { fontSize: 9, flex: 1 }]}>{m.comment}</Text>
								</View>
							))}
						{condition.damageMarkers.filter((m) => !m.comment).length > 0 && (
							<Text style={[styles.dataValue, { fontSize: 8, color: GREY_TEXT, marginTop: 2 }]}>
								+{condition.damageMarkers.filter((m) => !m.comment).length}{' '}
								{t.markersWithoutDescription}
							</Text>
						)}
					</View>
				</View>
			)}

			{/* Paint Thickness Readings */}
			{condition.paintMarkers.length > 0 && (
				<View style={{ marginTop: 8 }}>
					<Text style={[styles.sectionTitle, { fontSize: 11, marginBottom: 4 }]}>
						{t.paintReadingsTitle}
					</Text>
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
						{condition.paintMarkers
							.filter((m) => m.position)
							.map((m, i) => (
								<Text
									key={`pm-${i}`}
									style={[styles.dataValue, { fontSize: 9, color: GREY_TEXT, marginBottom: 2 }]}
								>
									{m.position}: {m.thickness} µm
								</Text>
							))}
					</View>
				</View>
			)}

			{/* Tire Sets */}
			{condition.tireSets.length > 0 && (
				<View style={{ marginTop: 10 }}>
					<Text style={[styles.sectionTitle, { fontSize: 11, marginBottom: 6 }]}>
						{t.tiresTitle}
					</Text>
					{condition.tireSets.map((ts, i) => (
						<View key={`tireset-${i}`} style={{ marginBottom: 8 }}>
							<Text style={[styles.dataLabel, { fontSize: 9, marginBottom: 4 }]}>
								{t.tireSet} {ts.setNumber}
							</Text>
							<View style={{ flexDirection: 'column', gap: 3 }}>
								{ts.tires
									.filter((tr) => tr.size || tr.manufacturer || tr.profileLevel)
									.map((tr, j) => (
										<View key={`tire-${j}`} style={{ flexDirection: 'row' }}>
											<Text style={[styles.dataLabel, { fontSize: 9, width: 25 }]}>
												{tr.position}:
											</Text>
											<Text style={[styles.dataValue, { fontSize: 9, flex: 1 }]}>
												{[
													tr.size,
													tr.profileLevel ? `${tr.profileLevel}mm ${t.tireProfile}` : null,
													tr.manufacturer,
													tr.tireType,
													tr.dotCode ? `DOT ${tr.dotCode}` : null,
												]
													.filter(Boolean)
													.join(' | ')}
											</Text>
										</View>
									))}
							</View>
						</View>
					))}
				</View>
			)}
		</View>
	)
}

function CalculationSection({
	calculation,
	reportType,
	t,
}: {
	calculation: ReportData['calculation']
	reportType: string
	t: PdfTranslations
}) {
	if (!calculation) return null

	const isBE = reportType === 'BE'
	const isOT = reportType === 'OT'
	const sectionTitle = isBE || isOT ? t.valuation : t.valuationAndCalculation

	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{sectionTitle}</Text>

			{/* HS/KG: Vehicle Value + Repair + Loss of Use */}
			{!isBE && !isOT && (
				<View>
					<Text style={[styles.dataLabel, { marginBottom: 4, marginTop: 2, fontSize: 10 }]}>
						{t.vehicleValue}
					</Text>
					{calculation.replacementValue != null && (
						<DataRow
							label={t.replacementValue}
							value={formatCurrency(calculation.replacementValue)}
						/>
					)}
					{calculation.residualValue != null && (
						<DataRow label={t.residualValue} value={formatCurrency(calculation.residualValue)} />
					)}
					{calculation.diminutionInValue != null && (
						<DataRow
							label={t.diminutionInValue}
							value={formatCurrency(calculation.diminutionInValue)}
						/>
					)}
					{calculation.taxRate && (
						<DataRow label="Tax Rate" value={displayValue(calculation.taxRate)} />
					)}
				</View>
			)}

			{!isBE &&
				!isOT &&
				(calculation.repairMethod || calculation.damageClass || calculation.wheelAlignment) && (
					<View style={{ marginTop: 8 }}>
						<Text style={[styles.dataLabel, { marginBottom: 4, marginTop: 2, fontSize: 10 }]}>
							{t.repair}
						</Text>
						{calculation.wheelAlignment && (
							<DataRow label="Wheel Alignment" value={displayValue(calculation.wheelAlignment)} />
						)}
						{calculation.bodyMeasurements && (
							<DataRow
								label="Body Measurements"
								value={displayValue(calculation.bodyMeasurements)}
							/>
						)}
						{calculation.bodyPaint && (
							<DataRow label="Body Paint" value={displayValue(calculation.bodyPaint)} />
						)}
						{calculation.plasticRepair && <DataRow label="Plastic Repair" value={t.yes} />}
						{calculation.repairMethod && (
							<DataRow label={t.repairMethod} value={displayValue(calculation.repairMethod)} />
						)}
						{calculation.damageClass && (
							<DataRow label={t.damageClass} value={displayValue(calculation.damageClass)} />
						)}
						{calculation.risks && <DataRow label="Risks" value={displayValue(calculation.risks)} />}
					</View>
				)}

			{!isBE &&
				!isOT &&
				(calculation.dropoutGroup || calculation.costPerDay || calculation.repairTimeDays) && (
					<View style={{ marginTop: 8 }}>
						<Text style={[styles.dataLabel, { marginBottom: 4, marginTop: 2, fontSize: 10 }]}>
							{t.lossOfUse}
						</Text>
						{calculation.dropoutGroup && (
							<DataRow label="Dropout Group" value={displayValue(calculation.dropoutGroup)} />
						)}
						{calculation.costPerDay !== null && calculation.costPerDay !== undefined && (
							<DataRow label={t.costPerDay} value={formatCurrency(calculation.costPerDay)} />
						)}
						{calculation.rentalCarClass && (
							<DataRow label="Rental Car Class" value={displayValue(calculation.rentalCarClass)} />
						)}
						{calculation.repairTimeDays !== null && calculation.repairTimeDays !== undefined && (
							<DataRow
								label={t.repairTime}
								value={formatNumber(calculation.repairTimeDays, t.days)}
							/>
						)}
						{calculation.replacementTimeDays !== null &&
							calculation.replacementTimeDays !== undefined && (
								<DataRow
									label={t.replacementTime}
									value={formatNumber(calculation.replacementTimeDays, t.days)}
								/>
							)}
					</View>
				)}

			{/* BE Valuation */}
			{(calculation.valuationMax != null || calculation.valuationAvg != null) && (
				<View style={{ marginTop: 8 }}>
					<Text style={[styles.dataLabel, { marginBottom: 4, marginTop: 2, fontSize: 10 }]}>
						{t.valuation}
					</Text>
					{calculation.generalCondition && (
						<DataRow
							label={t.generalCondition}
							value={displayValue(calculation.generalCondition)}
						/>
					)}
					{calculation.taxation && (
						<DataRow label={t.taxation} value={`${calculation.taxation}%`} />
					)}
					{calculation.dataSource && (
						<DataRow label={t.dataSource} value={displayValue(calculation.dataSource)} />
					)}
					{calculation.valuationMax != null && (
						<DataRow label={t.maximumValue} value={formatCurrency(calculation.valuationMax)} />
					)}
					{calculation.valuationAvg != null && (
						<DataRow label={t.averageValue} value={formatCurrency(calculation.valuationAvg)} />
					)}
					{calculation.valuationMin != null && (
						<DataRow label={t.minimumValue} value={formatCurrency(calculation.valuationMin)} />
					)}
					{calculation.valuationDate && (
						<DataRow label={t.valuationDate} value={displayValue(calculation.valuationDate)} />
					)}
				</View>
			)}

			{/* OT Valuation */}
			{(calculation.marketValue != null || calculation.baseVehicleValue != null) && (
				<View style={{ marginTop: 8 }}>
					<Text style={[styles.dataLabel, { marginBottom: 4, marginTop: 2, fontSize: 10 }]}>
						{t.oldtimerValuationSection}
					</Text>
					{calculation.marketValue != null && (
						<DataRow label={t.marketValue} value={formatCurrency(calculation.marketValue)} />
					)}
					{isOT && calculation.replacementValue != null && (
						<DataRow
							label={t.replacementValue}
							value={formatCurrency(calculation.replacementValue)}
						/>
					)}
					{calculation.baseVehicleValue != null && (
						<DataRow
							label={t.baseVehicleValue}
							value={formatCurrency(calculation.baseVehicleValue)}
						/>
					)}
					{calculation.restorationValue != null && (
						<DataRow
							label={t.restorationValue}
							value={formatCurrency(calculation.restorationValue)}
						/>
					)}
				</View>
			)}

			{/* Additional Costs */}
			{calculation.additionalCosts.length > 0 && (
				<View style={{ marginTop: 8 }}>
					<Text style={[styles.dataLabel, { marginBottom: 4, marginTop: 2, fontSize: 10 }]}>
						{t.additionalCosts}
					</Text>
					{calculation.additionalCosts.map((ac, i) => (
						<DataRow key={`ac-${i}`} label={ac.description} value={formatCurrency(ac.amount)} />
					))}
				</View>
			)}
		</View>
	)
}

function VisitsSection({
	visits,
	expertOpinion,
}: {
	visits: ReportData['visits']
	expertOpinion: ReportData['expertOpinion']
}) {
	if (visits.length === 0 && !expertOpinion) return null

	return (
		<View style={styles.section}>
			{visits.length > 0 && (
				<View>
					<Text style={styles.sectionTitle}>Visits</Text>
					{visits.map((v, i) => (
						<View key={`visit-${i}`} style={{ marginBottom: 6 }}>
							<DataRow label="Type" value={displayValue(v.type)} />
							{(v.street || v.postcode || v.location) && (
								<DataRow
									label="Address"
									value={[v.street, v.postcode, v.location].filter(Boolean).join(', ')}
								/>
							)}
							{v.date && <DataRow label="Date" value={formatDate(v.date)} />}
							{v.expert && <DataRow label="Expert" value={displayValue(v.expert)} />}
							{v.vehicleCondition && (
								<DataRow label="Vehicle Condition" value={displayValue(v.vehicleCondition)} />
							)}
						</View>
					))}
				</View>
			)}

			{expertOpinion && (
				<View style={{ marginTop: visits.length > 0 ? 8 : 0 }}>
					<Text style={styles.sectionTitle}>Expert Opinion</Text>
					{expertOpinion.expertName && (
						<DataRow label="Expert Name" value={displayValue(expertOpinion.expertName)} />
					)}
					{expertOpinion.fileNumber && (
						<DataRow label="File Number" value={displayValue(expertOpinion.fileNumber)} />
					)}
					{expertOpinion.caseDate && (
						<DataRow label="Case Date" value={formatDate(expertOpinion.caseDate)} />
					)}
					{expertOpinion.orderWasPlacement && (
						<DataRow
							label="Order Placement"
							value={displayValue(expertOpinion.orderWasPlacement)}
						/>
					)}
					{expertOpinion.issuedDate && (
						<DataRow label="Issued Date" value={formatDate(expertOpinion.issuedDate)} />
					)}
					{expertOpinion.orderByClaimant && <DataRow label="Ordered by Claimant" value="Yes" />}
					{expertOpinion.mediator && (
						<DataRow label="Mediator" value={displayValue(expertOpinion.mediator)} />
					)}
				</View>
			)}
		</View>
	)
}

function InvoiceSection({ invoice, t }: { invoice: ReportData['invoice']; t: PdfTranslations }) {
	if (!invoice) return null

	const sortedItems = [...invoice.lineItems].sort((a, b) => a.order - b.order)
	// Calculate totals from line items if stored totals are zero
	const computedNet = sortedItems.reduce(
		(sum, item) => sum + (item.amount || item.rate * item.quantity),
		0,
	)
	const netTotal = invoice.totalNet > 0 ? invoice.totalNet : computedNet
	const taxRate = invoice.taxRate > 0 ? invoice.taxRate : 19
	const grossTotal = invoice.totalGross > 0 ? invoice.totalGross : netTotal * (1 + taxRate / 100)
	const taxAmount = grossTotal - netTotal

	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{t.invoice}</Text>

			{invoice.invoiceNumber && (
				<DataRow label={t.invoiceNumber} value={displayValue(invoice.invoiceNumber)} />
			)}
			{invoice.date && <DataRow label={t.invoiceDate} value={formatDate(invoice.date)} />}

			{sortedItems.length > 0 && (
				<View style={{ marginTop: 10 }}>
					{/* Table Header */}
					<View style={styles.tableHeader}>
						<Text style={[styles.tableHeaderText, styles.colPos]}>#</Text>
						<Text style={[styles.tableHeaderText, styles.colDescription]}>{t.description}</Text>
						<Text style={[styles.tableHeaderText, styles.colQuantity]}>{t.qty}</Text>
						<Text style={[styles.tableHeaderText, styles.colRate]}>{t.rate}</Text>
						<Text style={[styles.tableHeaderText, styles.colAmount]}>{t.amount}</Text>
					</View>

					{/* Table Rows */}
					{sortedItems.map((item, index) => (
						<View
							key={`line-${String(index)}`}
							style={index % 2 === 1 ? styles.tableRowAlt : styles.tableRow}
						>
							<Text style={[styles.tableCell, styles.colPos]}>{String(index + 1)}</Text>
							<Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
							<Text style={[styles.tableCell, styles.colQuantity]}>
								{item.isLumpSum ? 'LS' : formatNumber(item.quantity)}
							</Text>
							<Text style={[styles.tableCell, styles.colRate]}>
								{item.isLumpSum ? '-' : formatCurrency(item.rate)}
							</Text>
							<Text style={[styles.tableCell, styles.colAmount]}>
								{formatCurrency(item.amount)}
							</Text>
						</View>
					))}

					{/* Totals */}
					<View style={styles.totalsContainer}>
						<View style={styles.totalRow}>
							<Text style={styles.totalLabel}>{t.netTotal}</Text>
							<Text style={styles.totalValue}>{formatCurrency(netTotal)}</Text>
						</View>
						<View style={styles.totalRow}>
							<Text style={styles.totalLabel}>
								{t.vat} ({formatNumber(taxRate)}%)
							</Text>
							<Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
						</View>
						<View style={styles.totalGrossRow}>
							<Text style={styles.totalGrossLabel}>{t.grossTotal}</Text>
							<Text style={styles.totalGrossValue}>{formatCurrency(grossTotal)}</Text>
						</View>
					</View>
				</View>
			)}

			{sortedItems.length === 0 && <Text style={styles.noData}>No line items</Text>}
		</View>
	)
}

const PHOTO_CATEGORIES: { key: string; label: string; matchTypes: string[] }[] = [
	{ key: 'vehicle', label: 'Vehicle Overview', matchTypes: ['overview'] },
	{ key: 'damage', label: 'Damage Photos', matchTypes: ['damage'] },
	{ key: 'tire', label: 'Tire Photos', matchTypes: ['tire'] },
	{ key: 'interior', label: 'Interior Photos', matchTypes: ['interior'] },
	{ key: 'document', label: 'Documents', matchTypes: ['document', 'vin', 'plate'] },
]

function PhotoGallerySection({ photos, t }: { photos: ReportData['photos']; t: PdfTranslations }) {
	if (photos.length === 0) return null

	// Group photos by classification
	const categorized = new Map<string, ReportData['photos']>()
	const uncategorized: ReportData['photos'] = []

	for (const photo of photos) {
		const cls = photo.aiClassification
		let placed = false
		if (cls) {
			for (const cat of PHOTO_CATEGORIES) {
				if (cat.matchTypes.includes(cls)) {
					const existing = categorized.get(cat.key) ?? []
					existing.push(photo)
					categorized.set(cat.key, existing)
					placed = true
					break
				}
			}
		}
		if (!placed) uncategorized.push(photo)
	}

	return (
		<View style={styles.section} break>
			<Text style={styles.sectionTitle}>{t.photoDocumentation}</Text>

			{PHOTO_CATEGORIES.map((cat) => {
				const catPhotos = categorized.get(cat.key)
				if (!catPhotos || catPhotos.length === 0) return null
				return (
					<View key={cat.key} wrap={false}>
						<Text style={styles.photoCategoryTitle}>
							{cat.label} ({catPhotos.length})
						</Text>
						<View style={styles.photoGrid}>
							{catPhotos.map((photo) => (
								<View key={photo.id} style={styles.photoItem}>
									<Image src={photo.annotatedUrl ?? photo.url} style={styles.photoImage} />
									{photo.aiDescription && (
										<Text style={styles.photoCaption}>{photo.aiDescription}</Text>
									)}
								</View>
							))}
						</View>
					</View>
				)
			})}

			{uncategorized.length > 0 && (
				<View wrap={false}>
					<Text style={styles.photoCategoryTitle}>
						{t.otherPhotos} ({uncategorized.length})
					</Text>
					<View style={styles.photoGrid}>
						{uncategorized.map((photo) => (
							<View key={photo.id} style={styles.photoItem}>
								<Image src={photo.annotatedUrl ?? photo.url} style={styles.photoImage} />
								{photo.aiDescription && (
									<Text style={styles.photoCaption}>{photo.aiDescription}</Text>
								)}
							</View>
						))}
					</View>
				</View>
			)}
		</View>
	)
}

function FooterSection({ expert, t }: { expert: ReportData['expert']; t: PdfTranslations }) {
	const expertName = expert ? [expert.firstName, expert.lastName].filter(Boolean).join(' ') : null
	const companyName = expert?.companyName ?? null
	const footerText = [expertName, companyName].filter(Boolean).join(' | ')
	const dateStr = new Date().toLocaleDateString('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	})

	return (
		<View style={styles.footer} fixed>
			<Text style={styles.footerLeft}>
				{footerText || 'Gut8erPRO'} | {dateStr}
			</Text>
			<Text
				style={styles.footerRight}
				render={({ pageNumber, totalPages }) =>
					`${t.page} ${String(pageNumber)} ${t.of} ${String(totalPages)}`
				}
			/>
		</View>
	)
}

// ─── Main Document ────────────────────────────────────────────

function ReportPdfDocument({
	data,
	t,
	locale = 'en',
}: {
	data: ReportData
	t: PdfTranslations
	locale?: string
}) {
	const includeValuation = data.exportConfig.includeVehicleValuation
	const includeInvoice = data.exportConfig.includeInvoice

	return (
		<Document
			title={data.report.title}
			author="Gut8erPRO"
			subject={t.vehicleDamageAssessment}
			creator="Gut8erPRO"
		>
			<Page size="A4" style={styles.page}>
				<HeaderSection data={data} t={t} />
				<VehicleInfoSection vehicleInfo={data.vehicleInfo} t={t} locale={locale} />
				<AccidentInfoSection
					accidentInfo={data.accidentInfo}
					claimantInfo={data.claimantInfo}
					opponentInfo={data.opponentInfo}
					t={t}
				/>
				<VisitsSection visits={data.visits} expertOpinion={data.expertOpinion} />
				<ConditionSection condition={data.condition} t={t} locale={locale} />
				{includeValuation && (
					<CalculationSection
						calculation={data.calculation}
						reportType={data.report.reportType}
						t={t}
					/>
				)}
				{includeInvoice && <InvoiceSection invoice={data.invoice} t={t} />}
				<PhotoGallerySection photos={data.photos} t={t} />
				<FooterSection expert={data.expert} t={t} />
			</Page>
		</Document>
	)
}

export type { ReportData }
export { ReportPdfDocument }
