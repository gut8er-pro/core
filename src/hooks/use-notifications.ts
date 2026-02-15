import { useMemo, useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Report } from '@/hooks/use-reports'

type NotificationType = 'report_created' | 'report_sent' | 'report_locked' | 'report_updated'

type Notification = {
	id: string
	type: NotificationType
	title: string
	description: string
	createdAt: string
	isRead: boolean
	reportId: string
}

type ReportListResponse = {
	reports: Report[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
	}
}

const NOTIFICATION_CONFIG: Record<
	NotificationType,
	{ title: (reportTitle: string) => string; description: (reportTitle: string) => string }
> = {
	report_created: {
		title: () => 'Report Created',
		description: (reportTitle: string) =>
			`A new report "${reportTitle}" has been created and is ready for editing.`,
	},
	report_sent: {
		title: () => 'Report Sent',
		description: (reportTitle: string) =>
			`Report "${reportTitle}" has been sent successfully.`,
	},
	report_locked: {
		title: () => 'Report Locked',
		description: (reportTitle: string) =>
			`Report "${reportTitle}" has been locked and is now read-only.`,
	},
	report_updated: {
		title: () => 'Report Updated',
		description: (reportTitle: string) =>
			`Report "${reportTitle}" has been updated.`,
	},
}

async function fetchAllReports(): Promise<ReportListResponse> {
	const response = await fetch('/api/reports?limit=100')
	if (!response.ok) {
		throw new Error('Failed to fetch reports')
	}
	return response.json()
}

function generateNotificationsFromReports(reports: Report[]): Notification[] {
	const notifications: Notification[] = []

	for (const report of reports) {
		// Every report gets a "created" notification
		const createdConfig = NOTIFICATION_CONFIG.report_created
		notifications.push({
			id: `${report.id}-created`,
			type: 'report_created',
			title: createdConfig.title(report.title),
			description: createdConfig.description(report.title),
			createdAt: report.createdAt,
			isRead: false,
			reportId: report.id,
		})

		// If the report has been updated after creation, add an "updated" notification
		const createdTime = new Date(report.createdAt).getTime()
		const updatedTime = new Date(report.updatedAt).getTime()
		const timeDiff = updatedTime - createdTime
		// Only add update notification if updated more than 1 minute after creation
		if (timeDiff > 60_000) {
			const updatedConfig = NOTIFICATION_CONFIG.report_updated
			notifications.push({
				id: `${report.id}-updated`,
				type: 'report_updated',
				title: updatedConfig.title(report.title),
				description: updatedConfig.description(report.title),
				createdAt: report.updatedAt,
				isRead: false,
				reportId: report.id,
			})
		}

		// If the report was sent, add a "sent" notification
		if (report.status === 'SENT' || report.status === 'LOCKED') {
			const sentConfig = NOTIFICATION_CONFIG.report_sent
			notifications.push({
				id: `${report.id}-sent`,
				type: 'report_sent',
				title: sentConfig.title(report.title),
				description: sentConfig.description(report.title),
				createdAt: report.updatedAt,
				isRead: false,
				reportId: report.id,
			})
		}

		// If the report is locked, add a "locked" notification
		if (report.status === 'LOCKED' || report.isLocked) {
			const lockedConfig = NOTIFICATION_CONFIG.report_locked
			notifications.push({
				id: `${report.id}-locked`,
				type: 'report_locked',
				title: lockedConfig.title(report.title),
				description: lockedConfig.description(report.title),
				createdAt: report.updatedAt,
				isRead: false,
				reportId: report.id,
			})
		}
	}

	// Sort by date descending (newest first)
	notifications.sort(
		(a, b) =>
			new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	)

	return notifications
}

function useNotifications() {
	const [readIds, setReadIds] = useState<Set<string>>(new Set())

	const query = useQuery({
		queryKey: ['reports', { limit: 100 }],
		queryFn: fetchAllReports,
	})

	const notifications = useMemo<Notification[]>(() => {
		if (!query.data) return []
		const generated = generateNotificationsFromReports(query.data.reports)
		return generated.map((notification) => ({
			...notification,
			isRead: readIds.has(notification.id),
		}))
	}, [query.data, readIds])

	const unreadCount = useMemo(
		() => notifications.filter((n) => !n.isRead).length,
		[notifications],
	)

	const markRead = useCallback((id: string) => {
		setReadIds((prev) => {
			const next = new Set(prev)
			next.add(id)
			return next
		})
	}, [])

	const markAllRead = useCallback(() => {
		setReadIds((prev) => {
			const next = new Set(prev)
			for (const n of notifications) {
				next.add(n.id)
			}
			return next
		})
	}, [notifications])

	return {
		notifications,
		unreadCount,
		markRead,
		markAllRead,
		isLoading: query.isLoading,
		error: query.error,
	}
}

export { useNotifications, generateNotificationsFromReports }
export type { Notification, NotificationType }
