import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { BusinessStep } from './business-step'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
}))

const mockSetBusiness = vi.fn()
const mockCompleteStep = vi.fn()
const mockSetCurrentStep = vi.fn()

vi.mock('@/stores/signup-store', () => ({
	useSignupStore: () => ({
		business: {},
		setBusiness: mockSetBusiness,
		completeStep: mockCompleteStep,
		setCurrentStep: mockSetCurrentStep,
	}),
}))

describe('BusinessStep', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('renders heading and description', () => {
		render(<BusinessStep />)
		expect(screen.getByText('Business information')).toBeInTheDocument()
		expect(screen.getByText('Your company details for invoices and reports.')).toBeInTheDocument()
	})

	it('renders all business form fields', () => {
		render(<BusinessStep />)
		expect(screen.getByText('Company name')).toBeInTheDocument()
		expect(screen.getByText('Street & house number')).toBeInTheDocument()
		expect(screen.getByText('Postcode')).toBeInTheDocument()
		expect(screen.getByText('City')).toBeInTheDocument()
		expect(screen.getByText('Tax ID (Steuernummer)')).toBeInTheDocument()
		expect(screen.getByText(/VAT ID/)).toBeInTheDocument()
	})

	it('navigates back to personal step', async () => {
		const user = userEvent.setup()
		render(<BusinessStep />)
		await user.click(screen.getByRole('button', { name: 'Back' }))
		expect(mockSetCurrentStep).toHaveBeenCalledWith(2)
		expect(mockPush).toHaveBeenCalledWith('/signup/personal')
	})

	it('shows validation errors on empty submit', async () => {
		const user = userEvent.setup()
		render(<BusinessStep />)
		await user.click(screen.getByRole('button', { name: 'Continue' }))
		expect(await screen.findByText('Company name is required')).toBeInTheDocument()
	})

	it('navigates to plan step on valid submit', async () => {
		const user = userEvent.setup()
		render(<BusinessStep />)

		await user.type(screen.getByPlaceholderText('Mustermann Gutachten GmbH'), 'Test GmbH')
		await user.type(screen.getByPlaceholderText('Musterstraße 123'), 'Musterstraße 1')
		await user.type(screen.getByPlaceholderText('12345'), '28195')
		await user.type(screen.getByPlaceholderText('Berlin'), 'Bremen')
		await user.type(screen.getByPlaceholderText('123/456/78901'), '12/345/67890')
		await user.click(screen.getByRole('button', { name: 'Continue' }))

		await vi.waitFor(() => {
			expect(mockSetBusiness).toHaveBeenCalled()
			expect(mockCompleteStep).toHaveBeenCalledWith(3)
			expect(mockSetCurrentStep).toHaveBeenCalledWith(4)
			expect(mockPush).toHaveBeenCalledWith('/signup/plan')
		})
	})
})
