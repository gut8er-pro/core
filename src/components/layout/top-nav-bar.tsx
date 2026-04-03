'use client'

import { formatDistanceToNow } from 'date-fns'
import {
	BarChart3,
	Bell,
	CheckCircle2,
	CreditCard,
	FileText,
	HelpCircle,
	Home,
	Lock,
	LogOut,
	Settings,
	User,
} from 'lucide-react'
import Image from 'next/image'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { NotificationEventType } from '@/hooks/use-notifications'
import { useNotifications } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'

// Map event types to lucide icons
const NOTIFICATION_ICON: Record<NotificationEventType, typeof FileText> = {
	REPORT_COMPLETED: CheckCircle2,
	REPORT_SENT: FileText,
	REPORT_LOCKED: Lock,
	REPORT_CREATED: FileText,
	INVOICE_GENERATED: CreditCard,
	PAYMENT_RECEIVED: CreditCard,
}

// Map event types to the most relevant page
function getNotificationPath(eventType: NotificationEventType, reportId: string | null): string {
	if (!reportId) return '/notifications'
	switch (eventType) {
		case 'REPORT_CREATED':
			return `/reports/${reportId}/gallery`
		case 'REPORT_COMPLETED':
			return `/reports/${reportId}/export`
		case 'REPORT_SENT':
			return `/reports/${reportId}/export`
		case 'REPORT_LOCKED':
			return `/reports/${reportId}/details/accident-info`
		case 'INVOICE_GENERATED':
			return `/reports/${reportId}/details/invoice`
		case 'PAYMENT_RECEIVED':
			return `/reports/${reportId}/details/invoice`
		default:
			return `/reports/${reportId}/gallery`
	}
}

type NavItem = {
	path: string
	icon: typeof Home
	label: string
}

const CENTER_NAV_ITEMS: NavItem[] = [
	{ path: '/dashboard', icon: Home, label: 'Dashboard' },
	{ path: '/statistics', icon: BarChart3, label: 'Statistics' },
	{ path: '/settings', icon: Settings, label: 'Settings' },
]

type TopNavBarProps = {
	userName?: string
	userEmail?: string
	userRole?: string
	activePath?: string
	onNavigate?: (path: string) => void
	onLogout?: () => void
	className?: string
}

function TopNavBar({
	userName,
	userEmail,
	userRole,
	activePath,
	onNavigate,
	onLogout,
	className,
}: TopNavBarProps) {
	const { notifications, unreadCount, markAllRead, markRead } = useNotifications()
	const recentNotifications = notifications.slice(0, 3)

	return (
		<header
			className={cn(
				'flex items-center justify-between px-3 py-3 sm:px-4 md:px-6 md:py-4',
				className,
			)}
		>
			{/* Left: Logo */}
			<div className="flex shrink-0 items-center">
				<button
					type="button"
					className="cursor-pointer"
					onClick={() => onNavigate?.('/dashboard')}
					aria-label="Gut8erPRO home"
				>
					<Image
						src="/images/logo.svg"
						alt="Gut8erPRO"
						width={131}
						height={31}
						priority
						className="h-6 w-auto sm:h-8"
					/>
				</button>
			</div>

			{/* Center: Navigation */}
			<nav className="flex items-center gap-1 sm:gap-2.5">
				{CENTER_NAV_ITEMS.map((item) => {
					const isActive = activePath === item.path
					return (
						<CenterNavItem
							key={item.path}
							icon={item.icon}
							label={item.label}
							isActive={isActive}
							onClick={() => onNavigate?.(item.path)}
						/>
					)
				})}
			</nav>

			{/* Right: Bell + User */}
			<div className="flex items-center gap-1.5 sm:gap-2.5">
				{/* Notifications dropdown */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-btn bg-white text-grey-100 transition-colors hover:bg-grey-25 hover:text-black sm:h-12.5 sm:w-12.5"
							aria-label="Notifications"
						>
							<Bell className="h-5 w-5 sm:h-6 sm:w-6" />
							{unreadCount > 0 && (
								<span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary" />
							)}
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-[275px] p-0 overflow-hidden">
						{/* Header */}
						<div className="flex items-center justify-between border-b border-border px-3.5 py-3">
							<span className="text-body font-medium text-black">Notifications</span>
							<button
								type="button"
								onClick={markAllRead}
								disabled={unreadCount === 0}
								className="text-body-sm font-medium text-primary hover:underline disabled:opacity-40 disabled:cursor-default"
							>
								Mark all as read
							</button>
						</div>

						{/* Notification items */}
						{recentNotifications.length === 0 ? (
							<div className="px-3.5 py-6 text-center text-body-sm text-black/45">
								No notifications yet
							</div>
						) : (
							recentNotifications.map((n) => {
								const Icon = NOTIFICATION_ICON[n.eventType] ?? FileText
								const timeAgo = formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })
								return (
									<div
										key={n.id}
										className="flex cursor-pointer items-start gap-3.5 border-b border-border px-3.5 py-3 last:border-0 hover:bg-grey-25"
										onClick={() => {
											markRead(n.id)
											onNavigate?.(getNotificationPath(n.eventType, n.reportId))
										}}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												markRead(n.id)
												onNavigate?.(getNotificationPath(n.eventType, n.reportId))
											}
										}}
										role="button"
										tabIndex={0}
									>
										<Icon className="mt-0.5 h-[17px] w-[17px] shrink-0 text-primary" />
										<div className="flex min-w-0 flex-1 flex-col gap-1.5">
											<p className="text-body-sm font-medium leading-[18px] text-black">
												{n.title}
											</p>
											<p className="text-body-sm leading-5 text-black/70">{n.description}</p>
											<p className="text-caption text-black/45">{timeAgo}</p>
										</div>
										{!n.isRead && (
											<span className="mt-1 h-[9px] w-[9px] shrink-0 rounded-full bg-primary" />
										)}
									</div>
								)
							})
						)}

						{/* Footer */}
						<div className="flex items-center justify-center px-3.5 py-3">
							<button
								type="button"
								onClick={() => onNavigate?.('/notifications')}
								className="text-body-sm font-medium text-primary hover:underline"
							>
								View all notifications
							</button>
						</div>
					</DropdownMenuContent>
				</DropdownMenu>

				{/* User dropdown */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="ml-1 flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-grey-25 sm:ml-2 sm:px-2 sm:py-1.5"
						>
							<div className="flex h-9 w-9 items-center justify-center rounded-btn bg-primary text-caption font-semibold text-white sm:h-13 sm:w-13 sm:text-body-sm">
								{userName?.charAt(0)?.toUpperCase() || 'U'}
							</div>
							<div className="hidden text-left lg:block">
								<p className="text-input font-medium tracking-[0.18px] text-black">
									{userName || 'User'}
								</p>
								{userRole && (
									<p className="text-body-sm tracking-[0.14px] text-black/60">{userRole}</p>
								)}
							</div>
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-[218px] p-0 overflow-hidden">
						{/* Header: name + email */}
						<div className="border-b-2 border-border px-3.5 py-3">
							<p className="text-body-sm font-medium leading-[18px] text-black">
								{userName || 'User'}
							</p>
							{userEmail && (
								<p className="mt-1.5 text-body-sm leading-5 text-black/70">{userEmail}</p>
							)}
						</div>

						{/* Profile */}
						<ProfileMenuItem
							icon={User}
							label="Profile"
							onClick={() => onNavigate?.('/settings/profile')}
						/>

						{/* Settings */}
						<ProfileMenuItem
							icon={Settings}
							label="Settings"
							onClick={() => onNavigate?.('/settings')}
						/>

						{/* Analytics */}
						<ProfileMenuItem
							icon={BarChart3}
							label="Analytics"
							onClick={() => onNavigate?.('/statistics')}
						/>

						{/* Help & Support */}
						<ProfileMenuItem
							icon={HelpCircle}
							label="Help & Support"
							onClick={() => onNavigate?.('/help')}
						/>

						{/* Log Out */}
						<button
							type="button"
							onClick={onLogout}
							className="flex w-full items-center gap-2.5 border-t border-border px-3.5 py-3 text-body-sm font-medium text-error transition-colors hover:bg-grey-25"
						>
							<LogOut className="h-[17px] w-[17px]" />
							Log Out
						</button>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	)
}

function ProfileMenuItem({
	icon: Icon,
	label,
	onClick,
}: {
	icon: typeof User
	label: string
	onClick?: () => void
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex w-full items-center gap-2.5 border-t border-border px-3.5 py-4 text-body-sm font-medium text-black transition-colors hover:bg-grey-25"
		>
			<Icon className="h-[17px] w-[17px]" />
			{label}
		</button>
	)
}

function CenterNavItem({
	icon: Icon,
	label,
	isActive,
	onClick,
}: {
	icon: typeof Home
	label: string
	isActive: boolean
	onClick?: () => void
}) {
	if (isActive) {
		return (
			<button
				type="button"
				onClick={onClick}
				className="flex h-10 cursor-pointer items-center gap-1.5 rounded-btn bg-black px-2.5 text-caption font-medium text-white transition-colors sm:h-12.5 sm:gap-2.5 sm:px-3.5 sm:text-body-sm"
				aria-label={label}
				aria-current="page"
			>
				<Icon className="h-5 w-5 sm:h-6 sm:w-6" />
				<span className="hidden sm:inline">{label}</span>
			</button>
		)
	}

	return (
		<button
			type="button"
			onClick={onClick}
			className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-btn bg-white text-grey-100 transition-colors hover:bg-grey-25 hover:text-black sm:h-12.5 sm:w-12.5"
			aria-label={label}
		>
			<Icon className="h-5 w-5 sm:h-6 sm:w-6" />
		</button>
	)
}

export type { TopNavBarProps }
export { TopNavBar }
