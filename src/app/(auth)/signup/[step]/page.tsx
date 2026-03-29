'use client'

import { notFound, useParams } from 'next/navigation'
import { StepperSidebar } from '@/components/ui/stepper-sidebar'
import { useSignupStore } from '@/stores/signup-store'
import { AccountStep } from '@/components/auth/account-step'
import { PersonalStep } from '@/components/auth/personal-step'
import { BusinessStep } from '@/components/auth/business-step'
import { PlanStep } from '@/components/auth/plan-step'
import { IntegrationsStep } from '@/components/auth/integrations-step'
import { CompleteStep } from '@/components/auth/complete-step'

const STEPS = [
	{ number: 1, title: 'Account', subtitle: 'Login credentials' },
	{ number: 2, title: 'Personal', subtitle: 'Your details' },
	{ number: 3, title: 'Business', subtitle: 'Company info' },
	{ number: 4, title: 'Plan', subtitle: 'Choose your plan' },
	{ number: 5, title: 'Integrations', subtitle: 'Connect services' },
]

const STEP_MAP: Record<string, number> = {
	account: 1,
	personal: 2,
	business: 3,
	plan: 4,
	integrations: 5,
	complete: 6,
}

function SignupStepPage() {
	const params = useParams<{ id: string; step: string }>()
	const stepKey = params.step
	const stepNumber = STEP_MAP[stepKey]
	const { completedSteps } = useSignupStore()

	if (stepNumber === undefined) {
		notFound()
	}

	if (stepKey === 'complete') {
		return <CompleteStep />
	}

	const progressPercent = Math.min((stepNumber / 5) * 100, 100)

	return (
		<div className="flex h-screen">
			<StepperSidebar
				steps={STEPS}
				currentStep={stepNumber}
				completedSteps={completedSteps}
			/>

			{/* Right panel: progress bar pinned at top, content scrolls below */}
			<div className="flex flex-1 flex-col">
				{/* Progress bar — always visible at top */}
				<div className="shrink-0 pt-8 pb-6">
					<div className="h-[3px] w-full bg-[#e5e7eb]">
						<div
							className="h-full bg-primary transition-all duration-500"
							style={{ width: `${progressPercent}%` }}
						/>
					</div>
				</div>

				{/* Scrollable form area */}
				<div className="flex-1 overflow-y-auto">
					<div className="flex min-h-full items-center justify-center px-12 py-16 pt-12">
						<div className="w-full max-w-[600px]">
							{stepKey === 'account' && <AccountStep />}
							{stepKey === 'personal' && <PersonalStep />}
							{stepKey === 'business' && <BusinessStep />}
							{stepKey === 'plan' && <PlanStep />}
							{stepKey === 'integrations' && <IntegrationsStep />}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SignupStepPage
