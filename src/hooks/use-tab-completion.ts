import { useMemo } from 'react'
import type { DetailTabKey, TabReport } from '@/lib/completeness'
import { useMissingInfo } from './use-missing-info'

type TabCompletion = Record<DetailTabKey, { filled: number; total: number; isComplete: boolean }>

function toCompletion(tab: TabReport) {
	return {
		filled: tab.sectionsComplete,
		total: tab.sectionsTotal,
		isComplete: tab.isComplete,
	}
}

/**
 * Section completion counts for the tab bar — a thin adapter over the
 * completeness engine. A section counts as filled only when every required
 * field inside it has a value. The gallery has no tab of its own, so its
 * photo requirement is left to the Export page's breakdown.
 */
function useTabCompletion(reportId: string, reportType?: string): TabCompletion {
	const report = useMissingInfo(reportId, reportType)

	return useMemo(
		() => ({
			accidentInfo: toCompletion(report.tabs.accidentInfo),
			vehicle: toCompletion(report.tabs.vehicle),
			condition: toCompletion(report.tabs.condition),
			calculation: toCompletion(report.tabs.calculation),
			invoice: toCompletion(report.tabs.invoice),
		}),
		[report],
	)
}

export type { TabCompletion }
export { useTabCompletion }
