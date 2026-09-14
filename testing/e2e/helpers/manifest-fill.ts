import type { Page } from '@playwright/test'

/**
 * Fills everything a report type's completeness manifest requires.
 *
 * Sending and PDF generation are refused server-side while any required field
 * is empty, so every happy-path spec needs its report to actually be complete
 * before it reaches Export & Send. Rather than restate ~60 fields in six specs,
 * they each call this once, as their last step before export.
 *
 * Written against the same API the browser uses, and idempotent: scalar fields
 * are overwritten with valid values, while collections (photos, signatures,
 * visits, markers, tyre sets) are only created when the report has none — so a
 * spec that filled them through the UI keeps what it built and still gets
 * asserted against.
 */

type ReportType = 'HS' | 'BE' | 'KG' | 'OT'

type Json = Record<string, unknown>

async function apiGet(page: Page, path: string): Promise<Json> {
	return page.evaluate(async (url: string) => {
		const response = await fetch(url)
		return response.ok ? ((await response.json()) as Record<string, unknown>) : {}
	}, path)
}

async function apiPatch(page: Page, path: string, body: Json): Promise<void> {
	await page.evaluate(
		async (args: { url: string; body: Record<string, unknown> }) => {
			await fetch(args.url, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(args.body),
			})
		},
		{ url: path, body },
	)
}

async function apiPost(page: Page, path: string, body: Json): Promise<void> {
	await page.evaluate(
		async (args: { url: string; body: Record<string, unknown> }) => {
			await fetch(args.url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(args.body),
			})
		},
		{ url: path, body },
	)
}

/** A 1×1 PNG — enough to satisfy "the report carries a signature". */
const SIGNATURE_IMAGE =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

const GRADES = {
	gradingBodywork: '2',
	gradingTires: '3',
	gradingPaint: '2',
	gradingInterior: '2',
	gradingChrome: '3',
	gradingEngineBay: '2',
	gradingSeals: '3',
	gradingEngine: '2',
	gradingGlass: '2',
	gradingTrunk: '3',
	gradingOverall: '2',
}

async function ensurePhoto(page: Page, reportId: string) {
	const photos = (await apiGet(page, `/api/reports/${reportId}/photos`)).photos
	if (Array.isArray(photos) && photos.length > 0) return

	await apiPost(page, `/api/reports/${reportId}/photos`, {
		url: 'https://placehold.co/800x600.png',
		filename: 'manifest-fill.png',
	})
}

async function fillAccidentInfo(page: Page, reportId: string, type: ReportType) {
	const describesAccident = type === 'HS' || type === 'KG'
	const existing = await apiGet(page, `/api/reports/${reportId}/accident-info`)
	const signatures = Array.isArray(existing.signatures) ? existing.signatures : []
	const visits = Array.isArray(existing.visits) ? existing.visits : []

	const hasDataPermission = signatures.some(
		(signature) => (signature as Json).type === 'DATA_PERMISSION' && (signature as Json).imageUrl,
	)

	const body: Json = {
		claimantInfo: {
			lastName: 'Müller',
			street: 'Bahnhofstraße 12',
			postcode: '28195',
			location: 'Bremen',
			email: 'hans.mueller@example.test',
			licensePlate: 'HB AB 1234',
		},
		expertOpinion: {
			expertName: 'Dr. Hans Turnes',
			fileNumber: 'HB-2026-001',
			caseDate: '2026-03-16',
			issuedDate: '2026-04-01',
		},
	}

	if (describesAccident) {
		body.accidentInfo = { accidentDay: '2026-03-15', accidentScene: 'Kreuzung B1/B2, Berlin-Mitte' }
		body.opponentInfo = {
			lastName: 'Braun',
			insuranceCompany: 'HUK-COBURG',
			insuranceNumber: 'HUK-2026-789012',
		}
	}

	// Visits replace wholesale on save, so only write one when there is none.
	if (visits.length === 0) {
		body.visits = [
			{
				type: 'claimant_residence',
				street: 'Bahnhofstraße 12',
				postcode: '28195',
				location: 'Bremen',
				date: '2026-03-20',
				expert: 'Dr. Hans Turnes',
			},
		]
	}

	if (!hasDataPermission) {
		body.signatures = [{ type: 'DATA_PERMISSION', imageUrl: SIGNATURE_IMAGE }]
	}

	await apiPatch(page, `/api/reports/${reportId}/accident-info`, body)
}

async function fillVehicle(page: Page, reportId: string) {
	await apiPatch(page, `/api/reports/${reportId}/vehicle`, {
		vin: 'WVWZZZ3CZWE999999',
		manufacturer: 'Volkswagen',
		mainType: 'Golf',
		kbaNumber: '0603/BGH',
		firstRegistration: '2020-01-15',
		powerKw: 110,
		displacement: 1968,
		transmission: 'Manual (6-speed)',
		sourceOfTechnicalData: 'DAT SilverDAT3',
		vehicleType: 'compact',
		motorType: 'diesel',
		doors: 4,
		seats: 5,
		previousOwners: 1,
	})
}

async function fillCondition(page: Page, reportId: string, type: ReportType) {
	const marksDamage = type === 'HS' || type === 'KG'
	const marksPaint = marksDamage || type === 'OT'
	const existing = await apiGet(page, `/api/reports/${reportId}/condition`)
	const damageMarkers = Array.isArray(existing.damageMarkers) ? existing.damageMarkers : []
	const paintMarkers = Array.isArray(existing.paintMarkers) ? existing.paintMarkers : []
	const tireSets = Array.isArray(existing.tireSets) ? existing.tireSets : []

	const body: Json = {
		condition: {
			mileageRead: 85420,
			nextMot: '2027-06-01',
			vehicleColor: 'Silver Metallic',
			paintType: 'Metallic',
			paintCondition: 'Good',
			generalCondition: 'Well maintained',
			bodyCondition: 'Minor cosmetic',
			interiorCondition: 'Clean, no structural damage.',
			drivingAbility: 'Roadworthy',
			// Findings, answered explicitly — the point of the Yes/No control.
			airbagsDeployed: type === 'HS' || type === 'KG',
			errorMemoryRead: true,
			previousDamageReported: 'Keine',
		},
	}

	if (marksDamage && damageMarkers.length === 0) {
		body.damageMarkers = [{ x: 32, y: 48, comment: 'Front left wing' }]
	}
	if (marksPaint && paintMarkers.length === 0) {
		body.paintMarkers = [{ x: 40, y: 55, thickness: 120, color: '#52D57B' }]
	}
	if (tireSets.length === 0) {
		body.tireSets = [
			{
				setNumber: 1,
				matchAndAlloy: true,
				tires: [
					{ position: 'VL', size: '205/55 R16', profileLevel: '6' },
					{ position: 'VR', size: '205/55 R16', profileLevel: '6' },
					{ position: 'HL', size: '205/55 R16', profileLevel: '5' },
					{ position: 'HR', size: '205/55 R16', profileLevel: '5' },
				],
			},
		]
	}

	if (type === 'OT') {
		body.oldtimerDetails = { ...GRADES }
	}

	await apiPatch(page, `/api/reports/${reportId}/condition`, body)
}

function calculationFor(type: ReportType): Json {
	if (type === 'OT') {
		return {
			marketValue: 185000,
			replacementValue: 210000,
			restorationValue: 78000,
			baseVehicleValue: 95000,
		}
	}

	if (type === 'BE') {
		return {
			generalCondition: 'good',
			taxation: '2.4',
			dataSource: 'mobile.de',
			valuationMax: 38500,
			valuationAvg: 35200,
			valuationMin: 32000,
			valuationDate: '2026-03-04',
		}
	}

	const shared: Json = {
		replacementValue: 25000,
		residualValue: 18000,
		taxRate: '19',
		damageClass: 'III',
		repairMethod: 'Instandsetzung',
		dropoutGroup: 'C',
		costPerDay: 35,
		repairTimeDays: 5,
	}

	// KG drops the correction calculation, and with it the diminution in value.
	return type === 'HS' ? { ...shared, diminutionInValue: 3500 } : shared
}

async function fillCalculation(page: Page, reportId: string, type: ReportType) {
	await apiPatch(page, `/api/reports/${reportId}/calculation`, {
		calculation: calculationFor(type),
	})
}

async function fillInvoice(page: Page, reportId: string) {
	const existing = await apiGet(page, `/api/reports/${reportId}/invoice`)
	const lineItems = Array.isArray(existing.lineItems) ? existing.lineItems : []

	const body: Json = {
		invoice: {
			invoiceNumber: 'GH-3552-2026',
			date: '2026-04-03T00:00:00Z',
			recipientId: 'individual',
		},
	}

	if (lineItems.length === 0) {
		body.lineItems = [
			{
				description: 'Grundhonorar Gutachten',
				rate: 362,
				amount: 362,
				quantity: 1,
				isLumpSum: true,
				order: 0,
			},
		]
	}

	await apiPatch(page, `/api/reports/${reportId}/invoice`, body)
}

/** Make this report satisfy its type's manifest, so the send gate lets it past. */
export async function completeManifest(page: Page, reportId: string, type: ReportType) {
	await ensurePhoto(page, reportId)
	await fillAccidentInfo(page, reportId, type)
	await fillVehicle(page, reportId)
	await fillCondition(page, reportId, type)
	await fillCalculation(page, reportId, type)
	await fillInvoice(page, reportId)
	// One debounce beyond the last write, so the report row's recomputed
	// completion has certainly landed before anyone opens Export & Send.
	await page.waitForTimeout(1000)
}

/**
 * What the server's gate thinks is still missing, probed through the PDF
 * download — which is gated on identical terms and, unlike send, changes
 * nothing. 0 means the gate would let this report through.
 */
export async function fetchMissingCount(page: Page, reportId: string): Promise<number> {
	const response = await page.evaluate(async (rid: string) => {
		const r = await fetch(`/api/reports/${rid}/export?format=pdf`)
		if (r.status !== 422) return { status: r.status, body: {} }
		return { status: r.status, body: await r.json().catch(() => ({})) }
	}, reportId)

	if (response.status !== 422) return 0
	const missingInfo = (response.body as { missingInfo?: { missingCount?: number } }).missingInfo
	return missingInfo?.missingCount ?? 0
}

/**
 * The completion the server wrote down — recomputed on every autosave PATCH, so
 * the dashboard percentage and the status filter mean something.
 */
export async function fetchReportCompletion(
	page: Page,
	reportId: string,
): Promise<{ status: string; completionPercentage: number }> {
	return page.evaluate(async (rid: string) => {
		const response = await fetch(`/api/reports/${rid}`)
		const { report } = (await response.json()) as {
			report: { status: string; completionPercentage: number }
		}
		return { status: report.status, completionPercentage: report.completionPercentage }
	}, reportId)
}

export type { ReportType }
