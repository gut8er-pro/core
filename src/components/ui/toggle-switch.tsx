import * as SwitchPrimitive from '@radix-ui/react-switch'
import { Eye } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { cn } from '@/lib/utils'
import { Label } from './label'

type ToggleSwitchProps = Omit<
  ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
  'onChange'
> & {
  label: string
  eyeIcon?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const ToggleSwitch = forwardRef<ElementRef<typeof SwitchPrimitive.Root>, ToggleSwitchProps>(
  ({ label, eyeIcon, className, id, ...props }, ref) => {
    const switchId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={cn('flex items-center justify-between gap-2', className)}>
        <div className="flex items-center gap-2">
          {eyeIcon && <Eye className="h-4 w-4 text-grey-100" />}
          <Label htmlFor={switchId} className="cursor-pointer">
            {label}
          </Label>
        </div>
        <SwitchPrimitive.Root
          ref={ref}
          id={switchId}
          className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-grey-50"
          {...props}
        >
          <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
        </SwitchPrimitive.Root>
      </div>
    )
  },
)
ToggleSwitch.displayName = 'ToggleSwitch'

export { ToggleSwitch }
export type { ToggleSwitchProps }
