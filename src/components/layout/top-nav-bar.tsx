import { BarChart3, Bell, Home, LogOut, Settings, User } from 'lucide-react'
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

type TopNavBarProps = {
	userName?: string
	userRole?: string
	activePath?: string
	onNavigate?: (path: string) => void
	onLogout?: () => void
	className?: string
}

function TopNavBar({ userName, userRole, activePath, onNavigate, onLogout, className }: TopNavBarProps) {
	return (
		<header
			className={cn(
				'flex h-16 items-center justify-between border-b border-border bg-white px-6',
				className,
			)}
		>
			{/* Left: Logo */}
			<div className="flex items-center">
				<span
					className="cursor-pointer text-h4 font-bold"
					onClick={() => onNavigate?.('/dashboard')}
					role="button"
					tabIndex={0}
					onKeyDown={(e) => { if (e.key === 'Enter') onNavigate?.('/dashboard') }}
				>
					Gut8er<span className="text-primary">PRO</span>
				</span>
			</div>

			{/* Center: Navigation items */}
			<nav className="flex items-center gap-1">
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
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => onNavigate?.('/notifications')}
					className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-grey-100 transition-colors hover:bg-grey-25 hover:text-black"
					aria-label="Notifications"
				>
					<Bell className="h-5 w-5" />
				</button>

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
				className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-black px-4 text-body-sm font-medium text-white transition-colors"
				aria-label={label}
				aria-current="page"
			>
				<Icon className="h-5 w-5" />
				<span>{label}</span>
			</button>
		)
	}

	return (
		<button
			type="button"
			onClick={onClick}
			className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-grey-100 transition-colors hover:bg-grey-25 hover:text-black"
			aria-label={label}
		>
			<Icon className="h-5 w-5" />
		</button>
	)
}

export { TopNavBar }
export type { TopNavBarProps }
