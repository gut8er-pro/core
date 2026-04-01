import * as TabsPrimitive from '@radix-ui/react-tabs'
import { Check } from 'lucide-react'
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Tab = {
	key: string
	label: string
	/** e.g. "3/4" or "0/12" — shown next to the label */
	completion?: string
	/** Whether this tab is fully complete (shows green checkmark) */
	isComplete?: boolean
}

type TabBarProps = {
	tabs: Tab[]
	activeTab: string
	onTabChange: (key: string) => void
	className?: string
}

function TabBar({ tabs, activeTab, onTabChange, className }: TabBarProps) {
	return (
		<TabsPrimitive.Root value={activeTab} onValueChange={onTabChange}>
			<TabsPrimitive.List
				className={cn(
					'flex items-center gap-1 overflow-x-auto rounded-full bg-grey-25 p-1',
					className,
				)}
			>
				{tabs.map((tab) => {
					const isActive = activeTab === tab.key
					return (
						<TabsPrimitive.Trigger
							key={tab.key}
							value={tab.key}
							className={cn(
								'inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-body-sm font-medium transition-colors',
								isActive
									? 'bg-primary text-white shadow-sm'
									: 'bg-transparent text-grey-100 hover:text-black',
							)}
						>
							{tab.label}
							{tab.isComplete && !isActive && <Check className="h-4 w-4 text-primary" />}
							{tab.isComplete && isActive && <Check className="h-4 w-4 text-white" />}
							{tab.completion && !tab.isComplete && (
								<span
									className={cn(
										'text-caption font-medium',
										isActive ? 'text-white/70' : 'text-grey-100',
									)}
								>
									{tab.completion}
								</span>
							)}
						</TabsPrimitive.Trigger>
					)
				})}
			</TabsPrimitive.List>
		</TabsPrimitive.Root>
	)
}

const TabsContent = forwardRef<
	ElementRef<typeof TabsPrimitive.Content>,
	ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Content ref={ref} className={cn('mt-4', className)} {...props} />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export type { Tab, TabBarProps }
export { TabBar, TabsContent }
