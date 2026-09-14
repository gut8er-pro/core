import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { accidentInfoValuesFromApi } from '@/components/report/accident-info/form-data'
import { calculationFromApi } from '@/components/report/calculation/form-data'
import { conditionValuesFromApi } from '@/components/report/condition/form-data'
import { invoiceFromApi } from '@/components/report/invoice/form-data'
import { vehicleFromApi } from '@/components/report/vehicle/form-data'
import type { MissingInfoReport } from '@/lib/completeness'
import { computeMissingInfo, toReportType } from '@/lib/completeness'
import { useAccidentInfo } from './use-accident-info'
import { useCalculation } from './use-calculation'
import { useCondition } from './use-condition'
import { useInvoice } from './use-invoice'
import { usePhotos } from './use-photos'
import { useVehicleInfo } from './use-vehicle-info'

/**
 * What this report still needs, broken down by tab, section and field.
 *
 * Every completeness number in the app — the tab badges, the section badges,
 * the banner counter and the Export page's send gate — comes from here, so they
 * cannot disagree with one another. The server answers the same question from
 * the same manifest in `lib/completeness/server.ts`.
 */
function useMissingInfo(reportId: string, reportType?: string): MissingInfoReport {
	const { data: photoData } = usePhotos(reportId)
	const { data: accidentData } = useAccidentInfo(reportId)
	const { data: vehicleData } = useVehicleInfo(reportId)
	const { data: conditionData } = useCondition(reportId)
	const { data: calculationData } = useCalculation(reportId)
	const { data: invoiceData } = useInvoice(reportId)

	return useMemo(
		() =>
			computeMissingInfo(toReportType(reportType), {
				gallery: { photos: photoData?.photos ?? [] },
				accidentInfo: accidentInfoValuesFromApi(accidentData),
				vehicle: vehicleFromApi(vehicleData),
				condition: conditionValuesFromApi(conditionData),
				calculation: calculationFromApi(calculationData),
				invoice: invoiceFromApi(invoiceData),
			}),
		[reportType, photoData, accidentData, vehicleData, conditionData, calculationData, invoiceData],
	)
}

/** Every query the completeness engine reads, under `['report', id, …]`. */
const COMPLETENESS_QUERIES = [
	'photos',
	'accident-info',
	'vehicle',
	'condition',
	'calculation',
	'invoice',
] as const

/**
 * The same answer, but only once every tab has been refetched.
 *
 * Autosave flushes on unmount when the assessor leaves the Report Details
 * route, so a field filled seconds ago may not be in the cache — or on the
 * server — yet. The Export page waits for a fresh round-trip before it judges
 * anyone incomplete, rather than blocking Send against stale data.
 */
function useFreshMissingInfo(
	reportId: string,
	reportType?: string,
): { missingInfo: MissingInfoReport; isRefreshing: boolean } {
	const queryClient = useQueryClient()
	const missingInfo = useMissingInfo(reportId, reportType)
	const [isRefreshing, setIsRefreshing] = useState(true)

	useEffect(() => {
		if (!reportId) return
		let active = true
		setIsRefreshing(true)

		Promise.all(
			COMPLETENESS_QUERIES.map((section) =>
				queryClient.invalidateQueries({ queryKey: ['report', reportId, section] }),
			),
		).finally(() => {
			if (active) setIsRefreshing(false)
		})

		return () => {
			active = false
		}
	}, [queryClient, reportId])

	return { missingInfo, isRefreshing }
}

export { useFreshMissingInfo, useMissingInfo }
