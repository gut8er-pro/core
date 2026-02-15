import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { IntegrationsStep } from './integrations-step'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/lib/auth/actions', () => ({
	completeSignup: vi.fn().mockResolvedValue({ error: null }),
}))

const mockSetIntegrations = vi.fn()
const mockCompleteStep = vi.fn()
const mockSetCurrentStep = vi.fn()
const mockReset = vi.fn()

vi.mock('@/stores/signup-store', () => ({
	useSignupStore: () => ({
		account: { email: 'test@example.com', password: 'Password1!' },
		personal: { title: 'Herr', firstName: 'Max', lastName: 'Mustermann', phone: '', professionalQualification: '' },
		business: { companyName: '', street: '', postcode: '', city: '', taxId: '', vatId: '' },
		plan: { plan: 'free' },
		integrations: {},
		setIntegrations: mockSetIntegrations,
		completeStep: mockCompleteStep,
		setCurrentStep: mockSetCurrentStep,
		reset: mockReset,
	}),
}))

describe('IntegrationsStep', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('renders heading and description', () => {
		render(<IntegrationsStep />)
		expect(screen.getByText('Connect your tools')).toBeInTheDocument()
		expect(
			screen.getByText(/Link your calculation provider/),
		).toBeInTheDocument()
	})

	it('renders three provider cards', () => {
		render(<IntegrationsStep />)
		expect(screen.getAllByText('DAT').length).toBeGreaterThanOrEqual(1)
		expect(screen.getAllByText('Coming Soon')).toHaveLength(2)
	})

	it('shows placeholder text when no provider selected', () => {
		render(<IntegrationsStep />)
		expect(
			screen.getByText('Select a provider above to enter your credentials'),
		).toBeInTheDocument()
	})

	it('shows DAT credentials form when DAT is selected', async () => {
		const user = userEvent.setup()
		render(<IntegrationsStep />)

		const datCard = screen.getAllByText('DAT')[0]!.closest('[role="button"]')!
		await user.click(datCard)

		expect(screen.getByText('DAT SilverDAT3 Credentials')).toBeInTheDocument()
		expect(screen.getByLabelText('Username')).toBeInTheDocument()
		expect(screen.getByLabelText('Password')).toBeInTheDocument()
	})

	it('shows "Register with DAT" link', async () => {
		const user = userEvent.setup()
		render(<IntegrationsStep />)

		const datCard = screen.getAllByText('DAT')[0]!.closest('[role="button"]')!
		await user.click(datCard)

		expect(screen.getByText('Register with DAT')).toHaveAttribute(
			'href',
			'https://www.dat.de',
		)
	})

	it('shows skip instruction', () => {
		render(<IntegrationsStep />)
		expect(
			screen.getByText(/You can skip this step and configure integrations later/),
		).toBeInTheDocument()
	})

	it('navigates back to plan step', async () => {
		const user = userEvent.setup()
		render(<IntegrationsStep />)
		await user.click(screen.getByRole('button', { name: 'Back' }))
		expect(mockSetCurrentStep).toHaveBeenCalledWith(4)
		expect(mockPush).toHaveBeenCalledWith('/signup/plan')
	})

	it('skips to complete page when no provider selected', async () => {
		const user = userEvent.setup()
		render(<IntegrationsStep />)
		await user.click(screen.getByRole('button', { name: 'Create an Account' }))
		expect(mockSetIntegrations).toHaveBeenCalledWith({})
		await waitFor(() => {
			expect(mockReset).toHaveBeenCalled()
		})
		expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/signup/complete'))
		expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('email=test%40example.com'))
	})
})
