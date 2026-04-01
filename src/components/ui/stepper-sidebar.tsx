import { Check } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
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
				'hidden lg:flex shrink-0 w-[491px] h-screen sticky top-0 pt-10 pb-6 pl-20 pr-0',
				className,
			)}
			aria-label="Signup progress"
		>
			{/* Green-tinted rounded card */}
			<div className="flex w-full flex-col overflow-hidden rounded-[40px] bg-primary/10 px-10 pb-6 pt-10">
				{/* Logo */}
				<div className="mb-10 shrink-0">
					<Link href="/">
						<Image src="/images/logo.svg" alt="Gut8erPRO" width={131} height={31} priority />
					</Link>
				</div>

				{/* Steps */}
				<nav className="shrink-0">
					<ol className="flex flex-col gap-6" aria-label="Signup steps">
						{steps.map((step) => {
							const isCompleted = completedSteps.includes(step.number)
							const isCurrent = step.number === currentStep

							return (
								<li key={step.number} className="flex items-center gap-3.5">
									<div
										className={cn(
											'flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-[14px] text-[16px] font-medium',
											isCompleted && 'bg-primary text-white',
											isCurrent && !isCompleted && 'border-2 border-primary bg-white text-black',
											!isCurrent && !isCompleted && 'bg-white text-black',
										)}
										aria-current={isCurrent ? 'step' : undefined}
									>
										{isCompleted ? (
											<Check className="h-3.5 w-3.5" aria-label="Completed" />
										) : (
											step.number
										)}
									</div>
									<div className="flex flex-col gap-0.5">
										<p className="text-[18px] font-medium leading-snug text-black">{step.title}</p>
										{step.subtitle && (
											<p className="text-[14px] leading-snug text-grey-100">{step.subtitle}</p>
										)}
									</div>
								</li>
							)
						})}
					</ol>
				</nav>

				{/* Car illustration — grows to fill remaining space, min-h-0 allows shrinking */}
				<div className="mt-6 min-h-0 flex-1 -mx-10">
					<Image
						src="/images/login-car-illustration.webp"
						alt=""
						width={411}
						height={300}
						className="h-full w-full object-contain object-bottom"
					/>
				</div>

				{/* Divider + login link — always visible */}
				<div className="shrink-0 border-t border-border/40 pt-4 mt-4">
					<p className="text-center text-[16px] text-black">
						Already have an account?{' '}
						<Link
							href="/login"
							className="font-medium text-primary underline hover:text-primary-hover"
						>
							Log in
						</Link>
					</p>
				</div>
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
								isCurrent && !isCompleted && 'border-2 border-primary bg-white text-black',
								!isCurrent && !isCompleted && 'border border-border bg-grey-25 text-grey-100',
							)}
							aria-current={isCurrent ? 'step' : undefined}
							aria-label={`Step ${step.number}: ${step.title}`}
						>
							{isCompleted ? <Check className="h-3 w-3" /> : step.number}
						</div>
						{!isLast && (
							<div className={cn('mx-1 h-0.5 w-6', isCompleted ? 'bg-primary' : 'bg-border')} />
						)}
					</div>
				)
			})}
		</div>
	)
}

export type { Step, StepperSidebarProps }
export { StepperProgress, StepperSidebar }
