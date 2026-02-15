import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
	SignupAccountInput,
	SignupPersonalInput,
	SignupBusinessInput,
	SignupPlanInput,
	SignupIntegrationsInput,
} from '@/lib/validations/auth'

type SignupState = {
	account: Partial<SignupAccountInput>
	personal: Partial<SignupPersonalInput>
	business: Partial<SignupBusinessInput>
	plan: SignupPlanInput
	integrations: Partial<SignupIntegrationsInput>
	currentStep: number
	completedSteps: number[]

	setAccount: (data: Partial<SignupAccountInput>) => void
	setPersonal: (data: Partial<SignupPersonalInput>) => void
	setBusiness: (data: Partial<SignupBusinessInput>) => void
	setPlan: (data: SignupPlanInput) => void
	setIntegrations: (data: Partial<SignupIntegrationsInput>) => void
	setCurrentStep: (step: number) => void
	completeStep: (step: number) => void
	reset: () => void
}

const initialState = {
	account: {},
	personal: {},
	business: {},
	plan: { plan: 'pro' as const },
	integrations: {},
	currentStep: 1,
	completedSteps: [] as number[],
}

const useSignupStore = create<SignupState>()(
	persist(
		(set) => ({
			...initialState,

			setAccount: (data) => set((state) => ({ account: { ...state.account, ...data } })),
			setPersonal: (data) => set((state) => ({ personal: { ...state.personal, ...data } })),
			setBusiness: (data) => set((state) => ({ business: { ...state.business, ...data } })),
			setPlan: (data) => set({ plan: data }),
			setIntegrations: (data) =>
				set((state) => ({ integrations: { ...state.integrations, ...data } })),
			setCurrentStep: (step) => set({ currentStep: step }),
			completeStep: (step) =>
				set((state) => ({
					completedSteps: state.completedSteps.includes(step)
						? state.completedSteps
						: [...state.completedSteps, step],
				})),
			reset: () => set(initialState),
		}),
		{
			name: 'gut8erpro-signup',
		},
	),
)

export { useSignupStore }
export type { SignupState }
