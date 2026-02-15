import {
	Document,
	Page,
	Text,
	View,
	StyleSheet,
} from '@react-pdf/renderer'

// ─── Types ────────────────────────────────────────────────────

type ReportData = {
	report: {
		id: string
		title: string
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
		generalCondition: string | null
		bodyCondition: string | null
		interiorCondition: string | null
		drivingAbility: string | null
		specialFeatures: string | null
		mileageRead: number | null
		unit: string
		notes: string | null
		previousDamageReported: string | null
		existingDamageNotReported: string | null
		subsequentDamage: string | null
	} | null
	calculation: {
		replacementValue: number | null
		taxRate: string | null
		residualValue: number | null
		diminutionInValue: number | null
		repairMethod: string | null
		risks: string | null
		damageClass: string | null
		dropoutGroup: string | null
		costPerDay: number | null
		rentalCarClass: string | null
		repairTimeDays: number | null
		replacementTimeDays: number | null
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

function HeaderSection({ data }: { data: ReportData }) {
	const reportDate = formatDate(data.report.createdAt)
	const reportId = data.report.id.slice(0, 8).toUpperCase()

	return (
		<View style={styles.header}>
			<View style={styles.headerRow}>
				<View style={styles.headerLeft}>
					<Text style={styles.headerTitle}>{data.report.title}</Text>
					<Text style={styles.headerSubtitle}>
						Vehicle Damage Assessment Report
					</Text>
				</View>
				<View style={styles.headerRight}>
					<Text style={styles.reportNumber}>Report No. {reportId}</Text>
					<Text style={styles.reportNumber}>Date: {reportDate}</Text>
				</View>
			</View>
		</View>
	)
}

function VehicleInfoSection({ vehicleInfo }: { vehicleInfo: ReportData['vehicleInfo'] }) {
	if (!vehicleInfo) return null

	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>Vehicle Information</Text>
			<DataRow label="Manufacturer" value={displayValue(vehicleInfo.manufacturer)} />
			<DataRow label="Type" value={displayValue(vehicleInfo.mainType)} />
			{vehicleInfo.subtype && (
				<DataRow label="Subtype" value={displayValue(vehicleInfo.subtype)} />
			)}
			<DataRow label="VIN" value={displayValue(vehicleInfo.vin)} />
			{vehicleInfo.kbaNumber && (
				<DataRow label="KBA Number" value={displayValue(vehicleInfo.kbaNumber)} />
			)}
			<DataRow label="First Registration" value={formatDate(vehicleInfo.firstRegistration)} />
			{vehicleInfo.lastRegistration && (
				<DataRow label="Last Registration" value={formatDate(vehicleInfo.lastRegistration)} />
			)}
			{vehicleInfo.powerKw && (
				<DataRow
					label="Power"
					value={`${formatNumber(vehicleInfo.powerKw)} kW / ${formatNumber(vehicleInfo.powerHp)} PS`}
				/>
			)}
			{vehicleInfo.engineDesign && (
				<DataRow label="Engine Design" value={displayValue(vehicleInfo.engineDesign)} />
			)}
			{vehicleInfo.engineDisplacementCcm && (
				<DataRow label="Displacement" value={formatNumber(vehicleInfo.engineDisplacementCcm, 'ccm')} />
			)}
			{vehicleInfo.transmission && (
				<DataRow label="Transmission" value={displayValue(vehicleInfo.transmission)} />
			)}
			{vehicleInfo.vehicleType && (
				<DataRow label="Vehicle Type" value={displayValue(vehicleInfo.vehicleType)} />
			)}
			{vehicleInfo.doors && (
				<DataRow label="Doors" value={formatNumber(vehicleInfo.doors)} />
			)}
			{vehicleInfo.seats && (
				<DataRow label="Seats" value={formatNumber(vehicleInfo.seats)} />
			)}
			{vehicleInfo.previousOwners !== null && vehicleInfo.previousOwners !== undefined && (
				<DataRow label="Previous Owners" value={formatNumber(vehicleInfo.previousOwners)} />
			)}
		</View>
	)
}

function AccidentInfoSection({
	accidentInfo,
	claimantInfo,
	opponentInfo,
}: {
	accidentInfo: ReportData['accidentInfo']
	claimantInfo: ReportData['claimantInfo']
	opponentInfo: ReportData['opponentInfo']
}) {
	if (!accidentInfo && !claimantInfo && !opponentInfo) return null

	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>Accident Information</Text>

			{accidentInfo && (
				<View style={{ marginBottom: 8 }}>
					<DataRow label="Accident Date" value={formatDate(accidentInfo.accidentDay)} />
					<DataRow label="Accident Scene" value={displayValue(accidentInfo.accidentScene)} />
				</View>
			)}

			{claimantInfo && (
				<View style={{ marginBottom: 8 }}>
					<Text style={[styles.dataLabel, { marginBottom: 4, marginTop: 6, fontSize: 10 }]}>
						Claimant
					</Text>
					<DataRow
						label="Name"
						value={
							[claimantInfo.salutation, claimantInfo.firstName, claimantInfo.lastName]
								.filter(Boolean)
								.join(' ') || '-'
						}
					/>
					{claimantInfo.company && (
						<DataRow label="Company" value={displayValue(claimantInfo.company)} />
					)}
					<DataRow
						label="Address"
						value={
							[claimantInfo.street, claimantInfo.postcode, claimantInfo.location]
								.filter(Boolean)
								.join(', ') || '-'
						}
					/>
					{claimantInfo.email && (
						<DataRow label="Email" value={displayValue(claimantInfo.email)} />
					)}
					{claimantInfo.phone && (
						<DataRow label="Phone" value={displayValue(claimantInfo.phone)} />
					)}
					{claimantInfo.licensePlate && (
						<DataRow label="License Plate" value={displayValue(claimantInfo.licensePlate)} />
					)}
				</View>
			)}

			{opponentInfo && (
				<View style={{ marginBottom: 8 }}>
					<Text style={[styles.dataLabel, { marginBottom: 4, marginTop: 6, fontSize: 10 }]}>
						Opponent
					</Text>
					<DataRow
						label="Name"
						value={
							[opponentInfo.salutation, opponentInfo.firstName, opponentInfo.lastName]
								.filter(Boolean)
								.join(' ') || '-'
						}
					/>
					{opponentInfo.company && (
						<DataRow label="Company" value={displayValue(opponentInfo.company)} />
					)}
					{opponentInfo.insuranceCompany && (
						<DataRow label="Insurance Company" value={displayValue(opponentInfo.insuranceCompany)} />
					)}
					{opponentInfo.insuranceNumber && (
						<DataRow label="Insurance Number" value={displayValue(opponentInfo.insuranceNumber)} />
					)}
				</View>
			)}
		</View>
	)
}

function ConditionSection({ condition }: { condition: ReportData['condition'] }) {
	if (!condition) return null

	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>Vehicle Condition</Text>
			<DataRow label="General Condition" value={displayValue(condition.generalCondition)} />
			{condition.bodyCondition && (
				<DataRow label="Body Condition" value={displayValue(condition.bodyCondition)} />
			)}
			{condition.interiorCondition && (
				<DataRow label="Interior Condition" value={displayValue(condition.interiorCondition)} />
			)}
			{condition.paintType && (
				<DataRow label="Paint Type" value={displayValue(condition.paintType)} />
			)}
			{condition.drivingAbility && (
				<DataRow label="Driving Ability" value={displayValue(condition.drivingAbility)} />
			)}
			{condition.mileageRead && (
				<DataRow label="Mileage" value={formatNumber(condition.mileageRead, condition.unit)} />
			)}
			{condition.specialFeatures && (
				<DataRow label="Special Features" value={displayValue(condition.specialFeatures)} />
			)}
			{condition.notes && (
				<DataRow label="Notes" value={displayValue(condition.notes)} />
			)}
			{condition.previousDamageReported && (
				<DataRow label="Previous Damage Reported" value={displayValue(condition.previousDamageReported)} />
			)}
			{condition.existingDamageNotReported && (
				<DataRow label="Existing Damage (Not Reported)" value={displayValue(condition.existingDamageNotReported)} />
			)}
			{condition.subsequentDamage && (
				<DataRow label="Subsequent Damage" value={displayValue(condition.subsequentDamage)} />
			)}
		</View>
	)
}

function CalculationSection({ calculation }: { calculation: ReportData['calculation'] }) {
	if (!calculation) return null

	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>Valuation &amp; Calculation</Text>

			<Text style={[styles.dataLabel, { marginBottom: 4, marginTop: 2, fontSize: 10 }]}>
				Vehicle Value
			</Text>
			<DataRow label="Replacement Value" value={formatCurrency(calculation.replacementValue)} />
			{calculation.residualValue !== null && calculation.residualValue !== undefined && (
				<DataRow label="Residual Value" value={formatCurrency(calculation.residualValue)} />
			)}
			{calculation.diminutionInValue !== null && calculation.diminutionInValue !== undefined && (
				<DataRow label="Diminution in Value" value={formatCurrency(calculation.diminutionInValue)} />
			)}
			{calculation.taxRate && (
				<DataRow label="Tax Rate" value={displayValue(calculation.taxRate)} />
			)}

			{(calculation.repairMethod || calculation.damageClass) && (
				<View style={{ marginTop: 8 }}>
					<Text style={[styles.dataLabel, { marginBottom: 4, marginTop: 2, fontSize: 10 }]}>
						Repair
					</Text>
					{calculation.repairMethod && (
						<DataRow label="Repair Method" value={displayValue(calculation.repairMethod)} />
					)}
					{calculation.damageClass && (
						<DataRow label="Damage Class" value={displayValue(calculation.damageClass)} />
					)}
					{calculation.risks && (
						<DataRow label="Risks" value={displayValue(calculation.risks)} />
					)}
				</View>
			)}

			{(calculation.dropoutGroup || calculation.costPerDay || calculation.repairTimeDays) && (
				<View style={{ marginTop: 8 }}>
					<Text style={[styles.dataLabel, { marginBottom: 4, marginTop: 2, fontSize: 10 }]}>
						Loss of Use
					</Text>
					{calculation.dropoutGroup && (
						<DataRow label="Dropout Group" value={displayValue(calculation.dropoutGroup)} />
					)}
					{calculation.costPerDay !== null && calculation.costPerDay !== undefined && (
						<DataRow label="Cost per Day" value={formatCurrency(calculation.costPerDay)} />
					)}
					{calculation.rentalCarClass && (
						<DataRow label="Rental Car Class" value={displayValue(calculation.rentalCarClass)} />
					)}
					{calculation.repairTimeDays !== null && calculation.repairTimeDays !== undefined && (
						<DataRow label="Repair Time" value={formatNumber(calculation.repairTimeDays, 'days')} />
					)}
					{calculation.replacementTimeDays !== null && calculation.replacementTimeDays !== undefined && (
						<DataRow label="Replacement Time" value={formatNumber(calculation.replacementTimeDays, 'days')} />
					)}
				</View>
			)}
		</View>
	)
}

function InvoiceSection({ invoice }: { invoice: ReportData['invoice'] }) {
	if (!invoice) return null

	const sortedItems = [...invoice.lineItems].sort((a, b) => a.order - b.order)
	const taxAmount = invoice.totalGross - invoice.totalNet

	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>Invoice</Text>

			{invoice.invoiceNumber && (
				<DataRow label="Invoice Number" value={displayValue(invoice.invoiceNumber)} />
			)}
			{invoice.date && (
				<DataRow label="Invoice Date" value={formatDate(invoice.date)} />
			)}

			{sortedItems.length > 0 && (
				<View style={{ marginTop: 10 }}>
					{/* Table Header */}
					<View style={styles.tableHeader}>
						<Text style={[styles.tableHeaderText, styles.colPos]}>#</Text>
						<Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
						<Text style={[styles.tableHeaderText, styles.colQuantity]}>Qty</Text>
						<Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
						<Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
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
							<Text style={styles.totalLabel}>Net Total</Text>
							<Text style={styles.totalValue}>{formatCurrency(invoice.totalNet)}</Text>
						</View>
						<View style={styles.totalRow}>
							<Text style={styles.totalLabel}>
								VAT ({formatNumber(invoice.taxRate)}%)
							</Text>
							<Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
						</View>
						<View style={styles.totalGrossRow}>
							<Text style={styles.totalGrossLabel}>Gross Total</Text>
							<Text style={styles.totalGrossValue}>
								{formatCurrency(invoice.totalGross)}
							</Text>
						</View>
					</View>
				</View>
			)}

			{sortedItems.length === 0 && (
				<Text style={styles.noData}>No line items</Text>
			)}
		</View>
	)
}

function FooterSection({ expert }: { expert: ReportData['expert'] }) {
	const expertName = expert
		? [expert.firstName, expert.lastName].filter(Boolean).join(' ')
		: null
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
					`Page ${String(pageNumber)} of ${String(totalPages)}`
				}
			/>
		</View>
	)
}

// ─── Main Document ────────────────────────────────────────────

function ReportPdfDocument({ data }: { data: ReportData }) {
	const includeValuation = data.exportConfig.includeVehicleValuation
	const includeInvoice = data.exportConfig.includeInvoice

	return (
		<Document
			title={data.report.title}
			author="Gut8erPRO"
			subject="Vehicle Damage Assessment Report"
			creator="Gut8erPRO"
		>
			<Page size="A4" style={styles.page}>
				<HeaderSection data={data} />
				<VehicleInfoSection vehicleInfo={data.vehicleInfo} />
				<AccidentInfoSection
					accidentInfo={data.accidentInfo}
					claimantInfo={data.claimantInfo}
					opponentInfo={data.opponentInfo}
				/>
				<ConditionSection condition={data.condition} />
				{includeValuation && (
					<CalculationSection calculation={data.calculation} />
				)}
				{includeInvoice && (
					<InvoiceSection invoice={data.invoice} />
				)}
				<FooterSection expert={data.expert} />
			</Page>
		</Document>
	)
}

export { ReportPdfDocument }
export type { ReportData }
