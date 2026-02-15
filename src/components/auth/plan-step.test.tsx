import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
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
		expect(screen.getByText('All features included with a 14-day free trial.')).toBeInTheDocument()
	})

	it('renders Pro plan card with pricing', () => {
		render(<PlanStep />)
		expect(screen.getByText('Pro')).toBeInTheDocument()
		expect(screen.getByText('€49')).toBeInTheDocument()
	})

	it('shows "14 Days Free" badge', () => {
		render(<PlanStep />)
		expect(screen.getByText('14 Days Free')).toBeInTheDocument()
	})

	it('shows trial info section', () => {
		render(<PlanStep />)
		expect(screen.getByText('14-day free trial')).toBeInTheDocument()
		expect(screen.getByText('Payments secured by Stripe')).toBeInTheDocument()
	})

	it('shows Pro plan features', () => {
		render(<PlanStep />)
		expect(screen.getByText('AI-powered auto-fill')).toBeInTheDocument()
		expect(screen.getByText('Image damage analysis')).toBeInTheDocument()
		expect(screen.getByText('VIN auto-detection')).toBeInTheDocument()
		expect(screen.getByText('14 days free trial')).toBeInTheDocument()
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
		expect(
			screen.getByText(/You won't be charged until your 14-day trial ends/),
		).toBeInTheDocument()
	})
})
