'use client'

import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown, Info } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type CollapsibleSectionProps = {
  title: string
  info?: boolean
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

function CollapsibleSection({
  title,
  info,
  defaultOpen = false,
  children,
  className,
}: CollapsibleSectionProps) {
  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      defaultValue={defaultOpen ? 'content' : undefined}
      className={cn('border-b border-border', className)}
    >
      <AccordionPrimitive.Item value="content">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            {title}
            {info && <Info className="h-4 w-4 text-grey-100" />}
          </span>
        </AccordionTrigger>
        <AccordionContent>{children}</AccordionContent>
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  )
}

const AccordionTrigger = forwardRef<
  ElementRef<typeof AccordionPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 cursor-pointer items-center justify-between py-4 text-h4 font-semibold text-black transition-all [&[data-state=open]>svg]:rotate-180',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-5 w-5 shrink-0 text-grey-100 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = 'AccordionTrigger'

const AccordionContent = forwardRef<
  ElementRef<typeof AccordionPrimitive.Content>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('pb-6', className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = 'AccordionContent'

export { CollapsibleSection, AccordionTrigger, AccordionContent }
export type { CollapsibleSectionProps }
