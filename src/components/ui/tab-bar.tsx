import * as TabsPrimitive from '@radix-ui/react-tabs'
import { Check } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { cn } from '@/lib/utils'

type Tab = {
	key: string
	label: string
	completion?: string
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
				className={cn('flex items-center gap-1 overflow-x-auto', className)}
			>
				{tabs.map((tab) => (
					<TabsPrimitive.Trigger
						key={tab.key}
						value={tab.key}
						className={cn(
							'inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-4 py-2 text-body-sm font-medium transition-colors',
							activeTab === tab.key
								? 'bg-primary text-white'
								: 'bg-transparent text-grey-100 hover:bg-grey-25',
						)}
					>
						{tab.label}
						{tab.completion && (
							<span className="text-caption font-medium opacity-70">
								{tab.completion}
							</span>
						)}
						{tab.isComplete && <Check className="h-4 w-4 text-primary" />}
					</TabsPrimitive.Trigger>
				))}
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

export { TabBar, TabsContent }
export type { TabBarProps, Tab }
