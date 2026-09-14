import { useMemo } from 'react'
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
import { useVehicleInfo } from './use-vehicle-info'

/**
 * What this report still needs, broken down by tab, section and field.
 *
 * Every completeness number on the Report Details screen — the tab badges, the
 * section badges and the banner counter — comes from here, so they cannot
 * disagree with one another.
 */
function useMissingInfo(reportId: string, reportType?: string): MissingInfoReport {
	const { data: accidentData } = useAccidentInfo(reportId)
	const { data: vehicleData } = useVehicleInfo(reportId)
	const { data: conditionData } = useCondition(reportId)
	const { data: calculationData } = useCalculation(reportId)
	const { data: invoiceData } = useInvoice(reportId)

	return useMemo(
		() =>
			computeMissingInfo(toReportType(reportType), {
				accidentInfo: accidentInfoValuesFromApi(accidentData),
				vehicle: vehicleFromApi(vehicleData),
				condition: conditionValuesFromApi(conditionData),
				calculation: calculationFromApi(calculationData),
				invoice: invoiceFromApi(invoiceData),
			}),
		[reportType, accidentData, vehicleData, conditionData, calculationData, invoiceData],
	)
}

export { useMissingInfo }
