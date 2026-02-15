import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { PersonalStep } from './personal-step'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
}))

const mockSetPersonal = vi.fn()
const mockCompleteStep = vi.fn()
const mockSetCurrentStep = vi.fn()

vi.mock('@/stores/signup-store', () => ({
	useSignupStore: () => ({
		personal: {},
		setPersonal: mockSetPersonal,
		completeStep: mockCompleteStep,
		setCurrentStep: mockSetCurrentStep,
	}),
}))

describe('PersonalStep', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('renders heading and description', () => {
		render(<PersonalStep />)
		expect(screen.getByText('Personal details')).toBeInTheDocument()
		expect(screen.getByText('Tell us about yourself')).toBeInTheDocument()
	})

	it('renders all form fields', () => {
		render(<PersonalStep />)
		expect(screen.getByText('Title')).toBeInTheDocument()
		expect(screen.getByLabelText('First name')).toBeInTheDocument()
		expect(screen.getByLabelText('Last name')).toBeInTheDocument()
		expect(screen.getByLabelText('Phone number')).toBeInTheDocument()
		expect(screen.getByLabelText('Professional qualification')).toBeInTheDocument()
	})

	it('renders Back and Continue buttons', () => {
		render(<PersonalStep />)
		expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
	})

	it('navigates back to account step', async () => {
		const user = userEvent.setup()
		render(<PersonalStep />)
		await user.click(screen.getByRole('button', { name: 'Back' }))
		expect(mockSetCurrentStep).toHaveBeenCalledWith(1)
		expect(mockPush).toHaveBeenCalledWith('/signup/account')
	})

	it('shows validation errors on empty submit', async () => {
		const user = userEvent.setup()
		render(<PersonalStep />)
		await user.click(screen.getByRole('button', { name: 'Continue' }))
		expect(await screen.findByText('First name is required')).toBeInTheDocument()
	})
})
