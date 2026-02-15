import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { AccountStep } from './account-step'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
}))

vi.mock('next/link', () => ({
	default: ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	),
}))

const mockSetAccount = vi.fn()
const mockCompleteStep = vi.fn()
const mockSetCurrentStep = vi.fn()

vi.mock('@/stores/signup-store', () => ({
	useSignupStore: () => ({
		account: {},
		setAccount: mockSetAccount,
		completeStep: mockCompleteStep,
		setCurrentStep: mockSetCurrentStep,
	}),
}))

describe('AccountStep', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('renders heading and description', () => {
		render(<AccountStep />)
		expect(screen.getByText('Create your account')).toBeInTheDocument()
		expect(screen.getByText('Start with your email and a secure password')).toBeInTheDocument()
	})

	it('renders email, password, and confirm password fields', () => {
		render(<AccountStep />)
		expect(screen.getByLabelText('Email address')).toBeInTheDocument()
		expect(screen.getByLabelText('Password')).toBeInTheDocument()
		expect(screen.getByLabelText('Confirm password')).toBeInTheDocument()
	})

	it('renders Cancel and Continue buttons', () => {
		render(<AccountStep />)
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
	})

	it('shows validation error on empty submit', async () => {
		const user = userEvent.setup()
		render(<AccountStep />)
		await user.click(screen.getByRole('button', { name: 'Continue' }))
		expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument()
	})

	it('shows password mismatch error', async () => {
		const user = userEvent.setup()
		render(<AccountStep />)

		await user.type(screen.getByLabelText('Email address'), 'test@example.com')
		await user.type(screen.getByLabelText('Password'), 'password123')
		await user.type(screen.getByLabelText('Confirm password'), 'different123')
		await user.click(screen.getByRole('button', { name: 'Continue' }))

		expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
	})

	it('navigates to personal step on valid submit', async () => {
		const user = userEvent.setup()
		render(<AccountStep />)

		await user.type(screen.getByLabelText('Email address'), 'test@example.com')
		await user.type(screen.getByLabelText('Password'), 'password123')
		await user.type(screen.getByLabelText('Confirm password'), 'password123')
		await user.click(screen.getByRole('button', { name: 'Continue' }))

		await vi.waitFor(() => {
			expect(mockSetAccount).toHaveBeenCalled()
			expect(mockCompleteStep).toHaveBeenCalledWith(1)
			expect(mockSetCurrentStep).toHaveBeenCalledWith(2)
			expect(mockPush).toHaveBeenCalledWith('/signup/personal')
		})
	})
})
