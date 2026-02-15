import { forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
	'rounded-lg border border-border bg-white transition-colors',
	{
		variants: {
			variant: {
				default: 'shadow-card',
				selectable: 'cursor-pointer hover:border-grey-50 hover:shadow-card',
				selected: 'border-primary bg-primary-light shadow-card',
				elevated: 'shadow-elevated',
			},
			padding: {
				sm: 'p-2',
				md: 'p-4',
				lg: 'p-6',
			},
		},
		defaultVariants: {
			variant: 'default',
			padding: 'lg',
		},
	},
)

type CardProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>

const Card = forwardRef<HTMLDivElement, CardProps>(
	({ className, variant, padding, ...props }, ref) => (
		<div
			ref={ref}
			className={cn(cardVariants({ variant, padding, className }))}
			role={variant === 'selectable' || variant === 'selected' ? 'button' : undefined}
			tabIndex={variant === 'selectable' || variant === 'selected' ? 0 : undefined}
			{...props}
		/>
	),
)
Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />
	),
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
	({ className, ...props }, ref) => (
		<h3 ref={ref} className={cn('text-h4 font-semibold text-black', className)} {...props} />
	),
)
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
	({ className, ...props }, ref) => (
		<p ref={ref} className={cn('text-body-sm text-grey-100', className)} {...props} />
	),
)
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn('', className)} {...props} />
	),
)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn('flex items-center gap-2', className)} {...props} />
	),
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants }
export type { CardProps }
