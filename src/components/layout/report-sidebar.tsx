import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

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
			className={cn('flex w-full shrink-0 gap-2 overflow-x-auto rounded-2xl bg-white p-3 lg:w-75.5 lg:flex-col lg:gap-4 lg:p-6', className)}
			aria-label="Report navigation"
		>
			{sections.map((section) => {
				const Icon = section.icon
				const isActive = section.key === activeSection
				return (
					<button
						key={section.key}
						type="button"
						onClick={() => onSectionChange?.(section.key)}
						className={cn(
							'flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-body-sm font-medium transition-colors lg:w-full lg:gap-2.5 lg:px-3.5 lg:py-3 lg:text-body lg:tracking-[0.16px]',
							isActive ? 'bg-grey-25 text-primary' : 'text-black hover:bg-grey-25',
						)}
						aria-current={isActive ? 'page' : undefined}
					>
						<Icon className="h-6 w-6 shrink-0" />
						{section.label}
					</button>
				)
			})}
		</nav>
	)
}

export type { ReportSidebarProps, SidebarSection }
export { ReportSidebar }
