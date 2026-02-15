import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
	'inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-semibold transition-colors',
	{
		variants: {
			variant: {
				default: 'bg-grey-25 text-black',
				primary: 'bg-primary-light text-primary',
				success: 'bg-success-light text-success',
				warning: 'bg-warning-light text-warning',
				error: 'bg-error-light text-error',
				info: 'bg-info-light text-info-blue',
				outline: 'border border-border bg-white text-black',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: BadgeProps) {
	return <div className={cn(badgeVariants({ variant, className }))} {...props} />
}

export { Badge, badgeVariants }
export type { BadgeProps }
