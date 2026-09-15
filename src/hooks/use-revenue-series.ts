import { useLocale } from 'next-intl'
import { useMemo } from 'react'
import type { ChartPeriod, RevenueSeries } from '@/hooks/use-revenue-stats'

type LabeledSeries = {
	values: number[]
	labels: string[]
}

function parseDateKey(key: string): Date {
	const [year, month, day] = key.split('-').map(Number)
	return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1)
}

function useRevenueSeries({
	series,
	period,
	monthLabels,
}: {
	series: RevenueSeries | undefined
	period: ChartPeriod
	monthLabels: string[]
}): LabeledSeries {
	const locale = useLocale()

	return useMemo(() => {
		const points = series?.[period] ?? []
		const dayAndMonth = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' })

		return {
			values: points.map((point) => point.value),
			labels: points.map((point) => {
				const date = parseDateKey(point.date)
				if (period === 'monthly') return monthLabels[date.getMonth()] ?? ''
				if (period === 'yearly') return String(date.getFullYear())
				return dayAndMonth.format(date)
			}),
		}
	}, [series, period, monthLabels, locale])
}

export type { LabeledSeries }
export { useRevenueSeries }
