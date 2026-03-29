import Image from 'next/image'
import { BarChart3, Bell, CheckCircle2, CreditCard, FileText, Home, LogOut, Settings, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

type Notification = {
	id: string
	icon: typeof CheckCircle2
	iconColor: string
	title: string
	description: string
	timestamp: string
	unread: boolean
}

const STATIC_NOTIFICATIONS: Notification[] = [
	{
		id: '1',
		icon: CheckCircle2,
		iconColor: 'text-primary',
		title: 'Report Completed',
		description: 'GH-331-02 has been marked as completed',
		timestamp: '2 hours ago',
		unread: true,
	},
	{
		id: '2',
		icon: CreditCard,
		iconColor: 'text-black',
		title: 'New invoice generated',
		description: 'Invoice INV-2026-002 is ready',
		timestamp: '4 hours ago',
		unread: true,
	},
	{
		id: '3',
		icon: FileText,
		iconColor: 'text-black',
		title: 'Payment received',
		description: 'Payment of €185.50 received from Marko Jovanović',
		timestamp: '4 hours ago',
		unread: false,
	},
]

type TopNavBarProps = {
	userName?: string
	userRole?: string
	activePath?: string
	onNavigate?: (path: string) => void
	onLogout?: () => void
	className?: string
}

function TopNavBar({ userName, userRole, activePath, onNavigate, onLogout, className }: TopNavBarProps) {
	const unreadCount = STATIC_NOTIFICATIONS.filter((n) => n.unread).length

	return (
		<header
			className={cn(
				'flex items-center justify-between px-6 py-4',
				className,
			)}
		>
			{/* Left: Logo */}
			<div className="flex items-center">
				<button
					type="button"
					className="cursor-pointer"
					onClick={() => onNavigate?.('/dashboard')}
					aria-label="Gut8erPRO home"
				>
					<Image src="/images/logo.svg" alt="Gut8erPRO" width={131} height={31} priority />
				</button>
			</div>

			{/* Center: Navigation items */}
			<nav className="flex items-center gap-2.5">
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

			{/* Right: Notification bell + User avatar */}
			<div className="flex items-center gap-2.5">
				{/* Notifications dropdown */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="relative flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-[15px] bg-white text-grey-100 transition-colors hover:bg-grey-25 hover:text-black"
							aria-label="Notifications"
						>
							<Bell className="h-6 w-6" />
							{unreadCount > 0 && (
								<span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary" />
							)}
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-80 p-0">
						{/* Header */}
						<div className="flex items-center justify-between px-4 py-3">
							<span className="text-body-sm font-semibold text-black">Notifications</span>
							<button
								type="button"
								className="text-caption font-medium text-primary hover:underline"
							>
								Mark all as read
							</button>
						</div>
						<DropdownMenuSeparator className="my-0" />

						{/* Notification items */}
						{STATIC_NOTIFICATIONS.map((notification) => {
							const Icon = notification.icon
							return (
								<div
									key={notification.id}
									className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-0"
								>
									<div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-grey-25">
										<Icon className={cn('h-4 w-4', notification.iconColor)} />
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-2">
											<p className="text-body-sm font-semibold text-black">{notification.title}</p>
											{notification.unread && (
												<span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
											)}
										</div>
										<p className="text-caption text-grey-100">{notification.description}</p>
										<p className="mt-0.5 text-caption text-grey-100">{notification.timestamp}</p>
									</div>
								</div>
							)
						})}

						{/* Footer */}
						<div className="px-4 py-3">
							<button
								type="button"
								onClick={() => onNavigate?.('/notifications')}
								className="w-full text-center text-body-sm font-medium text-primary hover:underline"
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
							className="ml-2 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-grey-25"
						>
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-body-sm font-semibold text-white">
								{userName?.charAt(0)?.toUpperCase() || 'U'}
							</div>
							<div className="hidden text-left lg:block">
								<p className="text-body-sm font-medium text-black">{userName || 'User'}</p>
								{userRole && <p className="text-caption text-grey-100">{userRole}</p>}
							</div>
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuLabel>
							<div className="flex flex-col gap-0.5">
								<span className="text-body-sm font-medium">{userName || 'User'}</span>
								{userRole && <span className="text-caption font-normal text-grey-100">{userRole}</span>}
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => onNavigate?.('/settings')}>
							<User className="mr-2 h-4 w-4" />
							Settings
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={onLogout} className="text-error focus:text-error">
							<LogOut className="mr-2 h-4 w-4" />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
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
				className="flex h-[50px] cursor-pointer items-center gap-2.5 rounded-[15px] bg-black px-3.5 text-body-sm font-medium text-white transition-colors"
				aria-label={label}
				aria-current="page"
			>
				<Icon className="h-6 w-6" />
				<span>{label}</span>
			</button>
		)
	}

	return (
		<button
			type="button"
			onClick={onClick}
			className="flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-[15px] bg-white text-grey-100 transition-colors hover:bg-grey-25 hover:text-black"
			aria-label={label}
		>
			<Icon className="h-6 w-6" />
		</button>
	)
}

export { TopNavBar }
export type { TopNavBarProps }
