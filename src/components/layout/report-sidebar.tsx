import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type SidebarSection = {
	key: string
	label: string
	icon: LucideIcon
}

type ReportSidebarProps = {
	sections: SidebarSection[]
	activeSection: string
	onSectionChange?: (key: string) => void
	className?: string
}

function ReportSidebar({
	sections,
	activeSection,
	onSectionChange,
	className,
}: ReportSidebarProps) {
	return (
		<nav
			className={cn(
				'hidden w-[200px] shrink-0 rounded-2xl bg-surface-secondary p-4 lg:block',
				className,
			)}
			aria-label="Report navigation"
		>
			<ul className="flex flex-col gap-1">
				{sections.map((section) => {
					const Icon = section.icon
					const isActive = section.key === activeSection
					return (
						<li key={section.key}>
							<button
								type="button"
								onClick={() => onSectionChange?.(section.key)}
								className={cn(
									'flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-body-sm font-medium transition-colors',
									isActive
										? 'font-semibold text-primary'
										: 'text-grey-100 hover:bg-grey-25 hover:text-black',
								)}
								aria-current={isActive ? 'page' : undefined}
							>
								<Icon className="h-5 w-5 shrink-0" />
								{section.label}
							</button>
						</li>
					)
				})}
			</ul>
		</nav>
	)
}

export { ReportSidebar }
export type { ReportSidebarProps, SidebarSection }
