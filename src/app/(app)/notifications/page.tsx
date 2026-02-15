'use client'

import { formatDistanceToNow } from 'date-fns'
import {
	Bell,
	FileText,
	Send,
	Lock,
	RefreshCw,
	CheckCheck,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
		icon: Send,
		bgClass: 'bg-info-light',
		iconClass: 'text-info-blue',
	},
	report_locked: {
		icon: Lock,
		bgClass: 'bg-warning-light',
		iconClass: 'text-warning',
	},
	report_updated: {
		icon: RefreshCw,
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
			<div className="flex flex-col gap-8">
				<PageHeader unreadCount={0} onMarkAllRead={() => {}} />
				<div className="rounded-lg border border-error bg-error-light px-6 py-4 text-body-sm text-error">
					Failed to load notifications. Please try again.
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-6">
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
				<div className="flex flex-col gap-3">
					{notifications.map((notification) => {
						const iconConfig = NOTIFICATION_ICON_MAP[notification.type]
						const Icon = iconConfig.icon
						const relativeTime = formatDistanceToNow(
							new Date(notification.createdAt),
							{ addSuffix: true },
						)

						return (
							<Card
								key={notification.id}
								padding="md"
								className={cn(
									'cursor-pointer transition-colors hover:bg-grey-25',
									!notification.isRead && 'bg-info-light/30',
								)}
								onClick={() => markRead(notification.id)}
							>
								<div className="flex items-start gap-4">
									{/* Unread indicator + Icon */}
									<div className="relative shrink-0">
										<div
											className={cn(
												'flex h-10 w-10 items-center justify-center rounded-lg',
												iconConfig.bgClass,
											)}
										>
											<Icon
												className={cn('h-5 w-5', iconConfig.iconClass)}
											/>
										</div>
										{!notification.isRead && (
											<div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-info-blue" />
										)}
									</div>

									{/* Content */}
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<p
												className={cn(
													'text-body-sm text-black',
													!notification.isRead
														? 'font-semibold'
														: 'font-medium',
												)}
											>
												{notification.title}
											</p>
											{!notification.isRead && (
												<Badge variant="info">New</Badge>
											)}
										</div>
										<p className="mt-0.5 text-body-sm text-grey-100">
											{notification.description}
										</p>
										<p className="mt-1 text-caption text-grey-75">
											{relativeTime}
										</p>
									</div>
								</div>
							</Card>
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
			<div>
				<div className="flex items-center gap-3">
					<h1 className="text-h2 font-bold text-black">Notifications</h1>
					{!isLoading && unreadCount > 0 && (
						<Badge variant="info">{unreadCount} unread</Badge>
					)}
				</div>
				<p className="mt-1 text-body-sm text-grey-100">
					Stay up to date with your report activity.
				</p>
			</div>
			{!isLoading && unreadCount > 0 && (
				<Button
					variant="outline"
					size="sm"
					onClick={onMarkAllRead}
					icon={<CheckCheck className="h-4 w-4" />}
				>
					Mark all as read
				</Button>
			)}
		</div>
	)
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-16">
			<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-grey-25">
				<Bell className="h-8 w-8 text-grey-50" />
			</div>
			<p className="text-body-md font-medium text-grey-100">
				No notifications yet
			</p>
			<p className="mt-1 text-body-sm text-grey-75">
				Notifications will appear here when there is activity on your
				reports.
			</p>
		</div>
	)
}

function NotificationsSkeleton() {
	return (
		<div className="flex flex-col gap-3">
			{Array.from({ length: 5 }).map((_, i) => (
				<Card key={i} padding="md">
					<div className="flex items-start gap-4">
						<Skeleton variant="circle" className="h-10 w-10 rounded-lg" />
						<div className="flex-1">
							<Skeleton variant="text" className="mb-2 h-4 w-40" />
							<Skeleton variant="text" className="mb-2 h-4 w-72" />
							<Skeleton variant="text" className="h-3 w-24" />
						</div>
					</div>
				</Card>
			))}
		</div>
	)
}

export default NotificationsPage
