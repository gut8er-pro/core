import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { PlanStep } from './plan-step'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
}))

const mockSetPlan = vi.fn()
const mockCompleteStep = vi.fn()
const mockSetCurrentStep = vi.fn()

vi.mock('@/stores/signup-store', () => ({
	useSignupStore: () => ({
		plan: { plan: 'pro' },
		setPlan: mockSetPlan,
		completeStep: mockCompleteStep,
		setCurrentStep: mockSetCurrentStep,
	}),
}))

describe('PlanStep', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('renders heading and description', () => {
		render(<PlanStep />)
		expect(screen.getByText('Your plan')).toBeInTheDocument()
		expect(screen.getByText('All features included with a 7-day free trial.')).toBeInTheDocument()
	})

	it('renders Pro plan card with pricing', () => {
		render(<PlanStep />)
		expect(screen.getByText('Pro')).toBeInTheDocument()
		expect(screen.getByText('€69')).toBeInTheDocument()
	})

	it('shows "7 days free" badge', () => {
		render(<PlanStep />)
		expect(screen.getByText('7 days free')).toBeInTheDocument()
	})

	it('shows Pro plan features', () => {
		render(<PlanStep />)
		expect(screen.getByText('AI-powered auto-fill')).toBeInTheDocument()
		expect(screen.getByText('Image damage analysis')).toBeInTheDocument()
		expect(screen.getByText('VIN auto-detection')).toBeInTheDocument()
		expect(screen.getByText('PDF export')).toBeInTheDocument()
	})

	it('does not show Free plan card', () => {
		render(<PlanStep />)
		expect(screen.queryByText('€0')).not.toBeInTheDocument()
		expect(screen.queryByText('forever')).not.toBeInTheDocument()
	})

	it('navigates back to business step', async () => {
		const user = userEvent.setup()
		render(<PlanStep />)
		await user.click(screen.getByRole('button', { name: 'Back' }))
		expect(mockSetCurrentStep).toHaveBeenCalledWith(3)
		expect(mockPush).toHaveBeenCalledWith('/signup/business')
	})

	it('navigates to integrations step on continue', async () => {
		const user = userEvent.setup()
		render(<PlanStep />)
		await user.click(screen.getByRole('button', { name: 'Continue' }))
		expect(mockSetPlan).toHaveBeenCalledWith({ plan: 'pro' })
		expect(mockCompleteStep).toHaveBeenCalledWith(4)
		expect(mockSetCurrentStep).toHaveBeenCalledWith(5)
		expect(mockPush).toHaveBeenCalledWith('/signup/integrations')
	})

	it('shows trial notice text', () => {
		render(<PlanStep />)
		expect(screen.getByText(/You won't be charged until your 7-day trial ends/)).toBeInTheDocument()
	})
})
