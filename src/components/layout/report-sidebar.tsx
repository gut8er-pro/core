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
			className={cn('flex w-75.5 shrink-0 flex-col gap-4 rounded-2xl bg-white p-6', className)}
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
							'flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 text-body font-medium tracking-[0.16px] transition-colors',
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
