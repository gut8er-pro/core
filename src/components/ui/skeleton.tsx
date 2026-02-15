import { cn } from '@/lib/utils'

type SkeletonProps = {
	className?: string
	variant?: 'text' | 'circle' | 'rect'
}

function Skeleton({ className, variant = 'text' }: SkeletonProps) {
	return (
		<div
			className={cn(
				'animate-pulse bg-grey-25',
				variant === 'text' && 'h-4 w-full rounded',
				variant === 'circle' && 'h-10 w-10 rounded-full',
				variant === 'rect' && 'h-20 w-full rounded-md',
				className,
			)}
			aria-hidden="true"
		/>
	)
}

function SkeletonGroup({ className, count = 3 }: { className?: string; count?: number }) {
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{Array.from({ length: count }).map((_, i) => (
				<Skeleton key={i} />
			))}
		</div>
	)
}

export { Skeleton, SkeletonGroup }
export type { SkeletonProps }
