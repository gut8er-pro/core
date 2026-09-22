import { GRADING_CATEGORIES, gradingKey } from '@/components/report/condition/types'
import { SECTION } from './sections'
import type {
	AccidentInfoValues,
	CalculationValues,
	ConditionValues,
	GalleryValues,
	InvoiceValues,
	Manifest,
	ReportType,
	Rule,
	SectionSpec,
	VehicleValues,
} from './types'

const field = <T>(path: Extract<keyof T, string>): Rule<T> => ({ kind: 'field', path })
const fields = <T>(...paths: Extract<keyof T, string>[]): Rule<T>[] => paths.map((p) => field<T>(p))

// ── Gallery ───────────────────────────────────────────────────────────────

/**
 * A Gutachten with no photographs is not a defensible one: the funnel starts at
 * photo upload and the PDF renders them.
 */
const galleryTab: SectionSpec<GalleryValues>[] = [
	{ id: SECTION.photos, rules: [{ kind: 'rows', path: 'photos' }] },
]

// ── Accident Info / Customer ──────────────────────────────────────────────

/** Accident day and scene exist only on the types that describe a collision. */
const accidentSection: SectionSpec<AccidentInfoValues> = {
	id: SECTION.accident,
	rules: fields<AccidentInfoValues>('accidentDay', 'accidentScene'),
}

function claimantSection(reportType: ReportType): SectionSpec<AccidentInfoValues> {
	const rules: Rule<AccidentInfoValues>[] = [
		{ kind: 'either', paths: ['claimantLastName', 'claimantCompany'] },
		...fields<AccidentInfoValues>('claimantStreet', 'claimantPostcode', 'claimantLocation'),
		{ kind: 'either', paths: ['claimantEmail', 'claimantPhone'] },
		field<AccidentInfoValues>('claimantLicensePlate'),
	]

	// OT renders no "represented by a lawyer" checkbox, so the rule cannot apply.
	if (reportType !== 'OT') {
		rules.push({
			kind: 'when',
			path: 'claimantRepresentedByLawyer',
			equals: true,
			// A lawyer on the claim is a party the Gutachten is sent to, so the
			// firm and an address to reach it at are what make the answer usable.
			rules: fields<AccidentInfoValues>(
				'claimantInvolvedLawyer',
				'claimantLawyerFirm',
				'claimantLawyerEmail',
			),
		})
	}

	// Unchecking "is the vehicle owner" claims a Fahrzeughalter exists, so the
	// report has to say who. Every type renders the checkbox.
	rules.push({
		kind: 'when',
		path: 'claimantIsVehicleOwner',
		equals: false,
		rules: [
			{ kind: 'either', paths: ['ownerLastName', 'ownerCompany'] },
			...fields<AccidentInfoValues>('ownerStreet', 'ownerPostcode', 'ownerLocation'),
		],
	})

	return { id: SECTION.claimant, rules }
}

const opponentSection: SectionSpec<AccidentInfoValues> = {
	id: SECTION.opponent,
	rules: [
		{ kind: 'either', paths: ['opponentLastName', 'opponentCompany'] },
		...fields<AccidentInfoValues>('opponentInsuranceCompany', 'opponentInsuranceNumber'),
	],
}

const visitsSection: SectionSpec<AccidentInfoValues> = {
	id: SECTION.visits,
	rules: [
		{
			kind: 'rows',
			path: 'visits',
			row: [
				{ kind: 'field', path: 'date' },
				{ kind: 'field', path: 'location' },
				{ kind: 'field', path: 'expert' },
			],
		},
	],
}

const expertOpinionSection: SectionSpec<AccidentInfoValues> = {
	id: SECTION.expertOpinion,
	rules: fields<AccidentInfoValues>('expertName', 'fileNumber', 'caseDate', 'issuedDate'),
}

function signaturesSection(reportType: ReportType): SectionSpec<AccidentInfoValues> {
	const rules: Rule<AccidentInfoValues>[] = [
		{
			kind: 'rows',
			path: 'signatures',
			where: { type: 'DATA_PERMISSION' },
			row: [{ kind: 'field', path: 'imageUrl' }],
		},
	]

	if (reportType !== 'OT') {
		rules.push({
			kind: 'when',
			path: 'claimantRepresentedByLawyer',
			equals: true,
			rules: [
				{
					kind: 'rows',
					path: 'signatures',
					where: { type: 'LAWYER' },
					row: [{ kind: 'field', path: 'imageUrl' }],
				},
			],
		})
	}

	return { id: SECTION.signatures, rules }
}

function accidentInfoTab(reportType: ReportType): SectionSpec<AccidentInfoValues>[] {
	const describesAccident = reportType === 'HS' || reportType === 'KG'
	return [
		...(describesAccident ? [accidentSection] : []),
		claimantSection(reportType),
		...(describesAccident ? [opponentSection] : []),
		visitsSection,
		expertOpinionSection,
		signaturesSection(reportType),
	]
}

// ── Vehicle ───────────────────────────────────────────────────────────────

function vehicleTab(): SectionSpec<VehicleValues>[] {
	return [
		{
			id: SECTION.identification,
			rules: fields<VehicleValues>('vin', 'manufacturer', 'mainType', 'kbaNumber'),
		},
		{
			id: SECTION.specification,
			rules: fields<VehicleValues>(
				'firstRegistration',
				'powerKw',
				'displacement',
				'transmission',
				'sourceOfTechnicalData',
			),
		},
		{
			id: SECTION.vehicleDetails,
			rules: fields<VehicleValues>('vehicleType', 'motorType', 'doors', 'seats'),
		},
	]
}

// ── Condition ─────────────────────────────────────────────────────────────

/**
 * Position is the row's identity rather than an answer — the tyre section always
 * sets it from the position tab the assessor is on — so only size and profile
 * depth can actually be left empty.
 */
const tiresSection: SectionSpec<ConditionValues> = {
	id: SECTION.tires,
	rules: [
		{
			kind: 'rows',
			path: 'tireSets',
			row: [
				{
					kind: 'rows',
					path: 'tires',
					row: [
						{ kind: 'field', path: 'size' },
						{ kind: 'field', path: 'profileLevel' },
					],
				},
			],
		},
	],
}

/**
 * Every category graded, plus the overall score. The value-increasing lists are
 * not required — a car with no rare equipment is a real answer.
 */
const vehicleGradingSection: SectionSpec<ConditionValues> = {
	id: SECTION.vehicleGrading,
	rules: [
		...GRADING_CATEGORIES.map((category) =>
			field<ConditionValues>(gradingKey(category) as Extract<keyof ConditionValues, string>),
		),
		field<ConditionValues>('gradingOverall'),
	],
}

function conditionTab(reportType: ReportType): SectionSpec<ConditionValues>[] {
	const marksDamage = reportType === 'HS' || reportType === 'KG'
	const marksPaint = marksDamage || reportType === 'OT'

	const diagramRules: Rule<ConditionValues>[] = []
	if (marksDamage) diagramRules.push({ kind: 'rows', path: 'damageMarkers' })
	if (marksPaint) diagramRules.push({ kind: 'rows', path: 'paintMarkers' })

	return [
		{
			id: SECTION.condition,
			rules: fields<ConditionValues>(
				'mileageRead',
				'nextMot',
				'vehicleColor',
				'paintType',
				'paintCondition',
				'generalCondition',
				'bodyCondition',
				'interiorCondition',
				'drivingAbility',
				// Findings, not preferences: every type inspects the vehicle, and
				// the Yes/No control renders on all four.
				'airbagsDeployed',
				'errorMemoryRead',
			),
		},
		// OT grades the vehicle; the other three types never render the table.
		...(reportType === 'OT' ? [vehicleGradingSection] : []),
		...(diagramRules.length > 0 ? [{ id: SECTION.damageDiagram, rules: diagramRules }] : []),
		tiresSection,
		{ id: SECTION.priorDamage, rules: fields<ConditionValues>('previousDamageReported') },
	]
}

// ── Calculation / Valuation ───────────────────────────────────────────────

function calculationTab(reportType: ReportType): SectionSpec<CalculationValues>[] {
	if (reportType === 'OT') {
		return [
			{
				id: SECTION.oldtimerValue,
				rules: fields<CalculationValues>('marketValue', 'replacementValue', 'restorationValue'),
			},
		]
	}

	if (reportType === 'BE') {
		return [
			{
				id: SECTION.datValuation,
				rules: fields<CalculationValues>('generalCondition', 'taxation'),
			},
			{
				id: SECTION.manualValuation,
				rules: fields<CalculationValues>(
					'dataSource',
					'valuationMax',
					'valuationAvg',
					'valuationMin',
					'valuationDate',
				),
			},
		]
	}

	const valueRules = fields<CalculationValues>(
		'replacementValue',
		'residualValue',
		'taxRate',
		'damageClass',
	)
	// KG drops the correction calculation, and with it the diminution in value.
	if (reportType === 'HS') valueRules.push(field<CalculationValues>('diminutionInValue'))

	return [
		{ id: SECTION.value, rules: valueRules },
		{ id: SECTION.repair, rules: fields<CalculationValues>('repairMethod') },
		{
			id: SECTION.loss,
			rules: fields<CalculationValues>('dropoutGroup', 'costPerDay', 'repairTimeDays'),
		},
	]
}

// ── Invoice ───────────────────────────────────────────────────────────────

/**
 * No rule for the fee schedule: it defaults to `bvsk` in both the form and the
 * column, and BVSK is the German standard the invoice maths is built on, so the
 * default is a genuine answer and the rule could never fail.
 */
const invoiceTab: SectionSpec<InvoiceValues>[] = [
	{
		id: SECTION.invoiceSettings,
		rules: fields<InvoiceValues>('invoiceNumber', 'date', 'recipientId'),
	},
	{ id: SECTION.lineItems, rules: [{ kind: 'rows', path: 'lineItems' }] },
]

function manifestFor(reportType: ReportType) {
	return {
		gallery: galleryTab,
		accidentInfo: accidentInfoTab(reportType),
		vehicle: vehicleTab(),
		condition: conditionTab(reportType),
		calculation: calculationTab(reportType),
		invoice: invoiceTab,
	}
}

/** What each report type needs before its Gutachten is defensible. */
const MANIFEST: Manifest = {
	HS: manifestFor('HS'),
	BE: manifestFor('BE'),
	KG: manifestFor('KG'),
	OT: manifestFor('OT'),
}

export { MANIFEST }
