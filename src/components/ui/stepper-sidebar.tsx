import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = {
	number: number
	title: string
	subtitle?: string
}

type StepperSidebarProps = {
	steps: Step[]
	currentStep: number
	completedSteps: number[]
	className?: string
}

function StepperSidebar({ steps, currentStep, completedSteps, className }: StepperSidebarProps) {
	return (
		<aside
			className={cn(
				'hidden w-[320px] shrink-0 flex-col bg-surface-secondary p-8 lg:flex',
				className,
			)}
			aria-label="Signup progress"
		>
			<div className="mb-8">
				<span className="text-h3 font-bold">
					Gut8er<span className="text-primary">PRO</span>
				</span>
			</div>

			<nav>
				<ol className="flex flex-col gap-2" aria-label="Signup steps">
					{steps.map((step, index) => {
						const isCompleted = completedSteps.includes(step.number)
						const isCurrent = step.number === currentStep
						const isLast = index === steps.length - 1

						return (
							<li key={step.number} className="flex gap-4">
								<div className="flex flex-col items-center">
									<div
										className={cn(
											'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-body-sm font-semibold',
											isCompleted && 'bg-primary text-white',
											isCurrent && !isCompleted && 'bg-primary text-white',
											!isCurrent &&
												!isCompleted &&
												'border border-border bg-grey-25 text-grey-100',
										)}
										aria-current={isCurrent ? 'step' : undefined}
									>
										{isCompleted ? (
											<Check className="h-4 w-4" aria-label="Completed" />
										) : (
											step.number
										)}
									</div>
									{!isLast && (
										<div
											className={cn(
												'mt-1 min-h-[24px] w-0.5 flex-1',
												isCompleted ? 'bg-primary' : 'bg-border',
											)}
										/>
									)}
								</div>
								<div className="pb-6">
									<p
										className={cn(
											'text-body-sm font-medium',
											isCurrent || isCompleted ? 'text-black' : 'text-grey-100',
										)}
									>
										{step.title}
									</p>
									{step.subtitle && (
										<p className="text-caption text-grey-100">{step.subtitle}</p>
									)}
								</div>
							</li>
						)
					})}
				</ol>
			</nav>

			<div className="mt-auto pt-8">
				<p className="text-body-sm text-grey-100">
					Already have an account?{' '}
					<a href="/login" className="font-medium text-primary hover:text-primary-hover">
						Log in
					</a>
				</p>
			</div>
		</aside>
	)
}

function StepperProgress({ steps, currentStep, completedSteps, className }: StepperSidebarProps) {
	return (
		<div className={cn('flex items-center gap-1 lg:hidden', className)}>
			{steps.map((step, index) => {
				const isCompleted = completedSteps.includes(step.number)
				const isCurrent = step.number === currentStep
				const isLast = index === steps.length - 1

				return (
					<div key={step.number} className="flex items-center">
						<div
							className={cn(
								'flex h-6 w-6 items-center justify-center rounded-full text-caption font-semibold',
								isCompleted && 'bg-primary text-white',
								isCurrent && !isCompleted && 'bg-primary text-white',
								!isCurrent &&
									!isCompleted &&
									'border border-border bg-grey-25 text-grey-100',
							)}
							aria-current={isCurrent ? 'step' : undefined}
							aria-label={`Step ${step.number}: ${step.title}`}
						>
							{isCompleted ? <Check className="h-3 w-3" /> : step.number}
						</div>
						{!isLast && (
							<div
								className={cn(
									'mx-1 h-0.5 w-6',
									isCompleted ? 'bg-primary' : 'bg-border',
								)}
							/>
						)}
					</div>
				)
			})}
		</div>
	)
}

export { StepperSidebar, StepperProgress }
export type { StepperSidebarProps, Step }
