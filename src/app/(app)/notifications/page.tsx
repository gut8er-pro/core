'use client'

import { formatDistanceToNow } from 'date-fns'
import {
	Bell,
	FileText,
	Lock,
	CheckCircle2,
	Receipt,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/use-notifications'
import type { NotificationType } from '@/hooks/use-notifications'

const NOTIFICATION_ICON_MAP: Record<
	NotificationType,
	{ icon: typeof FileText; bgClass: string; iconClass: string }
> = {
	report_created: {
		icon: FileText,
		bgClass: 'bg-primary-light',
		iconClass: 'text-primary',
	},
	report_sent: {
		icon: CheckCircle2,
		bgClass: 'bg-primary-light',
		iconClass: 'text-primary',
	},
	report_locked: {
		icon: Lock,
		bgClass: 'bg-warning-light',
		iconClass: 'text-warning',
	},
	report_updated: {
		icon: Receipt,
		bgClass: 'bg-grey-25',
		iconClass: 'text-grey-100',
	},
}

function NotificationsPage() {
	const {
		notifications,
		unreadCount,
		markRead,
		markAllRead,
		isLoading,
		error,
	} = useNotifications()

	if (error) {
		return (
			<div className="mx-auto max-w-2xl">
				<PageHeader unreadCount={0} onMarkAllRead={() => {}} />
				<div className="mt-6 rounded-lg border border-error bg-error-light px-6 py-4 text-body-sm text-error">
					Failed to load notifications. Please try again.
				</div>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-2xl">
			<PageHeader
				unreadCount={unreadCount}
				onMarkAllRead={markAllRead}
				isLoading={isLoading}
			/>

			{isLoading ? (
				<NotificationsSkeleton />
			) : notifications.length === 0 ? (
				<EmptyState />
			) : (
				<div className="mt-6 overflow-hidden rounded-xl border border-border bg-white">
					{notifications.map((notification, index) => {
						const iconConfig = NOTIFICATION_ICON_MAP[notification.type]
						const Icon = iconConfig.icon
						const relativeTime = formatDistanceToNow(
							new Date(notification.createdAt),
							{ addSuffix: true },
						)

						return (
							<div
								key={notification.id}
								className={cn(
									'flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors hover:bg-grey-25',
									index < notifications.length - 1 && 'border-b border-border',
								)}
								onClick={() => markRead(notification.id)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										markRead(notification.id)
									}
								}}
								role="button"
								tabIndex={0}
							>
								{/* Icon */}
								<div
									className={cn(
										'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
										iconConfig.bgClass,
									)}
								>
									<Icon className={cn('h-5 w-5', iconConfig.iconClass)} />
								</div>

								{/* Content */}
								<div className="min-w-0 flex-1">
									<p
										className={cn(
											'text-body-sm text-black',
											!notification.isRead ? 'font-semibold' : 'font-medium',
										)}
									>
										{notification.title}
									</p>
									<p className="mt-0.5 text-body-sm text-grey-100">
										{notification.description}
									</p>
									<p className="mt-1 text-caption text-grey-100">
										{relativeTime}
									</p>
								</div>

								{/* Unread indicator */}
								{!notification.isRead && (
									<div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
								)}
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}

function PageHeader({
	unreadCount,
	onMarkAllRead,
	isLoading,
}: {
	unreadCount: number
	onMarkAllRead: () => void
	isLoading?: boolean
}) {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-3">
				<h1 className="text-h2 font-bold text-black">Notifications</h1>
				{!isLoading && unreadCount > 0 && (
					<Badge variant="info">{unreadCount}</Badge>
				)}
			</div>
			{!isLoading && unreadCount > 0 && (
				<button
					type="button"
					onClick={onMarkAllRead}
					className="cursor-pointer text-body-sm font-medium text-primary hover:text-primary-hover"
				>
					Mark all as read
				</button>
			)}
		</div>
	)
}

function EmptyState() {
	return (
		<div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-16">
			<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-grey-25">
				<Bell className="h-8 w-8 text-grey-50" />
			</div>
			<p className="text-body-sm font-medium text-grey-100">
				No notifications yet
			</p>
			<p className="mt-1 text-caption text-grey-100">
				Notifications will appear here when there is activity on your reports.
			</p>
		</div>
	)
}

function NotificationsSkeleton() {
	return (
		<div className="mt-6 overflow-hidden rounded-xl border border-border bg-white">
			{Array.from({ length: 5 }).map((_, i) => (
				<div
					key={i}
					className={cn(
						'flex items-start gap-4 px-5 py-4',
						i < 4 && 'border-b border-border',
					)}
				>
					<Skeleton variant="circle" className="h-10 w-10" />
					<div className="flex-1">
						<Skeleton variant="text" className="mb-2 h-4 w-40" />
						<Skeleton variant="text" className="mb-2 h-4 w-72" />
						<Skeleton variant="text" className="h-3 w-24" />
					</div>
				</div>
			))}
		</div>
	)
}

export default NotificationsPage
