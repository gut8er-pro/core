'use client'

import { notFound, useParams } from 'next/navigation'
import { StepperSidebar, StepperProgress } from '@/components/ui/stepper-sidebar'
import { useSignupStore } from '@/stores/signup-store'
import { AccountStep } from '@/components/auth/account-step'
import { PersonalStep } from '@/components/auth/personal-step'
import { BusinessStep } from '@/components/auth/business-step'
import { PlanStep } from '@/components/auth/plan-step'
import { IntegrationsStep } from '@/components/auth/integrations-step'
import { CompleteStep } from '@/components/auth/complete-step'

const STEPS = [
	{ number: 1, title: 'Account', subtitle: 'Create your login' },
	{ number: 2, title: 'Personal', subtitle: 'Your details' },
	{ number: 3, title: 'Business', subtitle: 'Company info' },
	{ number: 4, title: 'Plan', subtitle: 'Choose your plan' },
	{ number: 5, title: 'Integrations', subtitle: 'Connect tools' },
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
	const params = useParams<{ step: string }>()
	const stepKey = params.step
	const stepNumber = STEP_MAP[stepKey]
	const { completedSteps } = useSignupStore()

	if (stepNumber === undefined) {
		notFound()
	}

	if (stepKey === 'complete') {
		return <CompleteStep />
	}

	return (
		<div className="flex min-h-screen">
			<StepperSidebar
				steps={STEPS}
				currentStep={stepNumber}
				completedSteps={completedSteps}
			/>

			<div className="flex flex-1 flex-col">
				<div className="px-6 pt-4 lg:hidden">
					<StepperProgress
						steps={STEPS}
						currentStep={stepNumber}
						completedSteps={completedSteps}
					/>
				</div>

				<div className="flex flex-1 items-start justify-center px-6 py-8">
					<div className="w-full max-w-lg">
						{stepKey === 'account' && <AccountStep />}
						{stepKey === 'personal' && <PersonalStep />}
						{stepKey === 'business' && <BusinessStep />}
						{stepKey === 'plan' && <PlanStep />}
						{stepKey === 'integrations' && <IntegrationsStep />}
					</div>
				</div>
			</div>
		</div>
	)
}

export default SignupStepPage
