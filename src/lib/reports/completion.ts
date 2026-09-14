import { getMissingInfo } from '@/lib/completeness/server'
import { createNotification } from '@/lib/notifications/create'
import { prisma } from '@/lib/prisma'

/**
 * Recomputes what a report is worth on the dashboard and writes it down.
 *
 * Called from each of the five autosave PATCH routes, so `completionPercentage`
 * and `status` describe the report as it actually stands rather than sitting at
 * their column defaults forever. Cost is one relation read and one update per
 * *debounced* save, not per keystroke.
 *
 * `SENT` and `LOCKED` are never touched: a delivered report does not fall back
 * to a draft because the manifest moved underneath it.
 */
async function syncReportCompletion(reportId: string, userId: string): Promise<void> {
	const report = await prisma.report.findFirst({
		where: { id: reportId, userId },
		select: { id: true, title: true, status: true, completionPercentage: true },
	})

	if (!report) return

	try {
		const missingInfo = await getMissingInfo(reportId, userId)
		if (!missingInfo) return

		const isDraftLike = report.status === 'DRAFT' || report.status === 'COMPLETED'
		const status = isDraftLike ? (missingInfo.isComplete ? 'COMPLETED' : 'DRAFT') : report.status

		await prisma.report.update({
			where: { id: reportId },
			data: {
				completionPercentage: missingInfo.completionPercentage,
				status,
				updatedAt: new Date(),
			},
		})

		// Only on the way up. Firing on every crossing would spam the assessor
		// with one notification per toggled field.
		if (report.status === 'DRAFT' && status === 'COMPLETED') {
			await createNotification({
				userId,
				eventType: 'REPORT_COMPLETED',
				title: 'Report Completed',
				description: `Report "${report.title}" now has every required field filled in.`,
				reportId,
			})
		}
	} catch (err) {
		// The assessor's data is already written; a derived number that could
		// not be recomputed must not turn a successful save into "Save failed".
		console.warn('[completion] Failed to recompute report completion:', err)
		await prisma.report
			.update({ where: { id: reportId }, data: { updatedAt: new Date() } })
			.catch(() => {})
	}
}

export { syncReportCompletion }
