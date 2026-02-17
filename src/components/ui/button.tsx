import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-hover',
        secondary: 'bg-surface-secondary text-black hover:bg-grey-25 border border-border',
        outline: 'border border-border bg-transparent text-black hover:bg-grey-25',
        ghost: 'bg-transparent text-black hover:bg-grey-25',
        danger: 'border border-error bg-transparent text-error hover:bg-error-light',
      },
      size: {
        sm: 'h-8 px-3 text-body-sm rounded-md',
        md: 'h-10 px-6 text-body-sm rounded-md',
        lg: 'h-12 px-6 text-body font-semibold rounded-md',
        icon: 'h-10 w-10 rounded-md',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    icon?: ReactNode
    iconPosition?: 'left' | 'right'
    loading?: boolean
    asChild?: boolean
  }

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      icon,
      iconPosition = 'left',
      loading,
      asChild = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'
    const buttonClassName = cn(buttonVariants({ variant, size, fullWidth, className }))

    if (asChild) {
      return (
        <Comp className={buttonClassName} ref={ref} {...props}>
          {children}
        </Comp>
      )
    }

    return (
      <Comp
        className={buttonClassName}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span className="shrink-0">{icon}</span>
        )}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
export type { ButtonProps }
