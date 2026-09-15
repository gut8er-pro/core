import type { ReportType } from '@/lib/completeness'

/** One source for the calculation tab label and the card heading under it. */
function calculationHeadingKey(reportType: ReportType): 'title' | 'valuationTab' {
	return reportType === 'BE' || reportType === 'OT' ? 'valuationTab' : 'title'
}

export { calculationHeadingKey }
