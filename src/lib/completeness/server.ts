import { accidentInfoValuesFromApi } from '@/components/report/accident-info/form-data'
import { calculationFromApi } from '@/components/report/calculation/form-data'
import { conditionValuesFromApi } from '@/components/report/condition/form-data'
import type { ConditionResponse } from '@/components/report/condition/types'
import { invoiceFromApi } from '@/components/report/invoice/form-data'
import { vehicleFromApi } from '@/components/report/vehicle/form-data'
import type { AccidentInfoResponse } from '@/hooks/use-accident-info'
import type { CalculationResponse } from '@/hooks/use-calculation'
import type { InvoiceResponse } from '@/hooks/use-invoice'
import type { VehicleInfoResponse } from '@/hooks/use-vehicle-info'
import { prisma } from '@/lib/prisma'
import { computeMissingInfo, isDelivered, toReportType } from './compute'
import type { MissingInfoReport } from './types'

/** Exactly what the five tab GET routes and the photo route fetch between them. */
const COMPLETENESS_INCLUDE = {
	photos: { select: { id: true }, orderBy: { order: 'asc' } },
	accidentInfo: true,
	claimantInfo: true,
	ownerInfo: true,
	opponentInfo: true,
	visits: { orderBy: { id: 'asc' } },
	expertOpinion: true,
	signatures: { orderBy: { id: 'asc' } },
	vehicleInfo: true,
	condition: {
		include: {
			damageMarkers: { orderBy: { id: 'asc' } },
			paintMarkers: { orderBy: { id: 'asc' } },
			tireSets: {
				orderBy: { setNumber: 'asc' },
				include: { tires: { orderBy: { position: 'asc' } } },
			},
		},
	},
	oldtimer: true,
	calculation: { include: { additionalCosts: { orderBy: { id: 'asc' } } } },
	invoice: { include: { lineItems: { orderBy: { order: 'asc' } } } },
} as const

/**
 * Whether the gate leaves this report alone.
 *
 * The one exemption, and the only one: a report that has already been delivered
 * passed at send time, so tightening the manifest later must not retract a
 * Gutachten that is already in an insurer's inbox.
 */
function _isExemptFromCompleteness(report: { isLocked: boolean; status: string }): boolean {
	return report.isLocked || report.status === 'SENT' || report.status === 'LOCKED'
}

/** The vehicle row before the vehicle route renames two of its columns. */
type VehicleRow = Omit<NonNullable<VehicleInfoResponse>, 'subType' | 'displacement'> & {
	subtype: string | null
	engineDisplacementCcm: number | null
}

/**
 * A Prisma result as the browser would receive it.
 *
 * Load-bearing, not laziness. The `*FromApi` mappers consume the API's JSON
 * shape — `accident?.accidentDay?.split('T')[0]` and friends — while Prisma
 * hands back `Date` objects, so calling a mapper on a raw row throws
 * `.split is not a function` for any report with a date set. Serialising first
 * makes the server's input byte-identical to the browser's, and keeps exactly
 * one mapper per tab rather than two manifests in a trenchcoat.
 */
function asApiShape<TResponse>(rows: unknown): TResponse {
	return JSON.parse(JSON.stringify(rows)) as TResponse
}

/**
 * What this report still needs, answered server-side from the same manifest the
 * browser uses. `null` when no such report belongs to this user.
 *
 * This is the seam the send and PDF gates read: the guarantee holds regardless
 * of what the browser does.
 */
async function getMissingInfo(reportId: string, userId: string): Promise<MissingInfoReport | null> {
	const report = await prisma.report.findFirst({
		where: { id: reportId, userId },
		include: COMPLETENESS_INCLUDE,
	})

	if (!report) return null

	const json = asApiShape<{
		photos: { id: string }[]
		accidentInfo: AccidentInfoResponse['accidentInfo']
		claimantInfo: AccidentInfoResponse['claimantInfo']
		ownerInfo: AccidentInfoResponse['ownerInfo']
		opponentInfo: AccidentInfoResponse['opponentInfo']
		visits: AccidentInfoResponse['visits']
		expertOpinion: AccidentInfoResponse['expertOpinion']
		signatures: AccidentInfoResponse['signatures']
		vehicleInfo: VehicleRow | null
		condition: ConditionResponse['condition'] & {
			damageMarkers: ConditionResponse['damageMarkers']
			paintMarkers: ConditionResponse['paintMarkers']
			tireSets: ConditionResponse['tireSets']
		}
		oldtimer: ConditionResponse['oldtimerDetails']
		calculation:
			| (NonNullable<CalculationResponse['calculation']> & {
					additionalCosts: CalculationResponse['additionalCosts']
			  })
			| null
		invoice:
			| (NonNullable<InvoiceResponse['invoice']> & { lineItems: InvoiceResponse['lineItems'] })
			| null
	}>(report)

	// Each tab is reassembled exactly as its GET route returns it, including the
	// two column renames the vehicle route performs.
	const vehicle: VehicleInfoResponse | null = json.vehicleInfo
		? {
				...json.vehicleInfo,
				subType: json.vehicleInfo.subtype,
				displacement: json.vehicleInfo.engineDisplacementCcm,
			}
		: null

	// Grading reads the same condition payload — it is its own tab in the UI and
	// its own grouping in the manifest, not its own endpoint.
	const condition = conditionValuesFromApi({
		condition: json.condition,
		damageMarkers: json.condition?.damageMarkers ?? [],
		paintMarkers: json.condition?.paintMarkers ?? [],
		tireSets: json.condition?.tireSets ?? [],
		oldtimerDetails: json.oldtimer,
	})

	return computeMissingInfo(toReportType(report.reportType), {
		gallery: { photos: json.photos },
		accidentInfo: accidentInfoValuesFromApi({
			accidentInfo: json.accidentInfo,
			claimantInfo: json.claimantInfo,
			ownerInfo: json.ownerInfo,
			opponentInfo: json.opponentInfo,
			visits: json.visits,
			expertOpinion: json.expertOpinion,
			signatures: json.signatures,
		}),
		vehicle: vehicleFromApi(vehicle),
		condition,
		grading: condition,
		calculation: calculationFromApi({
			calculation: json.calculation,
			additionalCosts: json.calculation?.additionalCosts ?? [],
		}),
		invoice: invoiceFromApi({
			invoice: json.invoice,
			lineItems: json.invoice?.lineItems ?? [],
		}),
	})
}

export { getMissingInfo, isDelivered }
