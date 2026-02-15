import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { CompleteStep } from './complete-step'

const mockPush = vi.fn()
const mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
	useSearchParams: () => mockSearchParams,
}))

describe('CompleteStep', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockSearchParams.set('plan', 'pro')
		mockSearchParams.set('email', 'test@example.com')
	})

	it('renders welcome heading', () => {
		render(<CompleteStep />)
		expect(screen.getByText('Welcome aboard!')).toBeInTheDocument()
	})

	it('renders success message', () => {
		render(<CompleteStep />)
		expect(
			screen.getByText('Your account has been created successfully.'),
		).toBeInTheDocument()
	})

	it('shows Pro plan badge and payment setup section', () => {
		render(<CompleteStep />)
		expect(screen.getByText(/Pro Plan/)).toBeInTheDocument()
		expect(screen.getByText('Set up your payment')).toBeInTheDocument()
	})

	it('renders quick-start cards', () => {
		render(<CompleteStep />)
		expect(screen.getByText('Create Report')).toBeInTheDocument()
		expect(screen.getByText('Enjoy AI')).toBeInTheDocument()
		expect(screen.getByText('Settings')).toBeInTheDocument()
	})

	it('renders payment setup and skip buttons', () => {
		render(<CompleteStep />)
		expect(
			screen.getByRole('button', { name: /Set up payment/ }),
		).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Skip for now' })).toBeInTheDocument()
	})

	it('shows confirmation email text', () => {
		render(<CompleteStep />)
		expect(screen.getByText(/We've sent a confirmation email to/)).toBeInTheDocument()
		expect(screen.getByText('test@example.com')).toBeInTheDocument()
	})

	it('navigates to dashboard on skip', async () => {
		const user = userEvent.setup()
		render(<CompleteStep />)
		await user.click(screen.getByRole('button', { name: 'Skip for now' }))
		expect(mockPush).toHaveBeenCalledWith('/dashboard')
	})
})
