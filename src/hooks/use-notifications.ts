import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

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

async function fetchNotifications(): Promise<NotificationsResponse> {
	const res = await fetch('/api/notifications?limit=50')
	if (!res.ok) throw new Error('Failed to fetch notifications')
	return res.json()
}

function useNotifications() {
	const queryClient = useQueryClient()

	const query = useQuery<NotificationsResponse>({
		queryKey: ['notifications'],
		queryFn: fetchNotifications,
		staleTime: 30_000,
	})

	const markRead = useCallback(
		async (id: string) => {
			// Optimistic update
			queryClient.setQueryData<NotificationsResponse>(['notifications'], (old) => {
				if (!old) return old
				const updated = old.notifications.map((n) =>
					n.id === id ? { ...n, isRead: true } : n,
				)
				return {
					notifications: updated,
					unreadCount: updated.filter((n) => !n.isRead).length,
				}
			})
			await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
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
	}, [queryClient])

	return {
		notifications: query.data?.notifications ?? [],
		unreadCount: query.data?.unreadCount ?? 0,
		markRead,
		markAllRead,
		isLoading: query.isLoading,
		error: query.error,
	}
}

export { useNotifications }
export type { Notification, NotificationEventType }
