import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import { decodeNotificationParams, isNotificationMessageKey } from '@/lib/notifications/messages'

type NotificationEventType =
	| 'REPORT_COMPLETED'
	| 'REPORT_SENT'
	| 'REPORT_LOCKED'
	| 'REPORT_CREATED'
	| 'INVOICE_GENERATED'
	| 'PAYMENT_RECEIVED'

type Notification = {
	id: string
	eventType: NotificationEventType
	title: string
	description: string
	reportId: string | null
	isRead: boolean
	createdAt: string
}

type NotificationsResponse = {
	notifications: Notification[]
	unreadCount: number
}

/**
 * A stored row put into words. Rows carry a message key and its parameters
 * rather than prose, so the language is decided here rather than by whichever
 * server route happened to write the row.
 */
type LocalizedNotification = Notification & { relativeTime: string }

async function fetchNotifications(): Promise<NotificationsResponse> {
	const res = await fetch('/api/notifications?limit=50')
	if (!res.ok) throw new Error('Failed to fetch notifications')
	return res.json()
}

function useNotifications() {
	const queryClient = useQueryClient()
	const t = useTranslations('notifications')
	const locale = useLocale()

	const query = useQuery<NotificationsResponse>({
		queryKey: ['notifications'],
		queryFn: fetchNotifications,
		staleTime: 30_000,
	})

	const rows = query.data?.notifications
	const notifications = useMemo<LocalizedNotification[]>(() => {
		const dateLocale = locale === 'de' ? de : undefined
		return (rows ?? []).map((row) => {
			const relativeTime = formatDistanceToNow(new Date(row.createdAt), {
				addSuffix: true,
				locale: dateLocale,
			})
			// Rows written before notifications carried a key keep their stored
			// prose — it is all they have.
			if (!isNotificationMessageKey(row.title)) return { ...row, relativeTime }
			const params = decodeNotificationParams(row.description)
			return {
				...row,
				title: t(`messages.${row.title}.title`),
				description: t(`messages.${row.title}.description`, params),
				relativeTime,
			}
		})
	}, [rows, t, locale])

	const markRead = useCallback(
		async (id: string) => {
			// Optimistic update
			queryClient.setQueryData<NotificationsResponse>(['notifications'], (old) => {
				if (!old) return old
				const updated = old.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
				return {
					notifications: updated,
					unreadCount: updated.filter((n) => !n.isRead).length,
				}
			})
			await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
			queryClient.invalidateQueries({ queryKey: ['notifications'] })
		},
		[queryClient],
	)

	const markAllRead = useCallback(async () => {
		// Optimistic update
		queryClient.setQueryData<NotificationsResponse>(['notifications'], (old) => {
			if (!old) return old
			return {
				notifications: old.notifications.map((n) => ({ ...n, isRead: true })),
				unreadCount: 0,
			}
		})
		await fetch('/api/notifications', { method: 'PATCH' })
		queryClient.invalidateQueries({ queryKey: ['notifications'] })
	}, [queryClient])

	return {
		notifications,
		unreadCount: query.data?.unreadCount ?? 0,
		markRead,
		markAllRead,
		isLoading: query.isLoading,
		error: query.error,
	}
}

export type { LocalizedNotification, Notification, NotificationEventType }
export { useNotifications }
