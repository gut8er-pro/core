import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
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
		expect(screen.getByText('Enter your company details for invoicing')).toBeInTheDocument()
	})

	it('renders all business form fields', () => {
		render(<BusinessStep />)
		expect(screen.getByLabelText('Company name')).toBeInTheDocument()
		expect(screen.getByLabelText('Street & house number')).toBeInTheDocument()
		expect(screen.getByLabelText('Postcode')).toBeInTheDocument()
		expect(screen.getByLabelText('City')).toBeInTheDocument()
		expect(screen.getByLabelText('Tax ID (Steuernummer)')).toBeInTheDocument()
		expect(screen.getByLabelText('VAT ID (USt-IdNr.)')).toBeInTheDocument()
	})

	it('shows VAT ID optional hint', () => {
		render(<BusinessStep />)
		expect(screen.getByText(/Optional — Format: DE \+ 9 digits/)).toBeInTheDocument()
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

		await user.type(screen.getByLabelText('Company name'), 'Test GmbH')
		await user.type(screen.getByLabelText('Street & house number'), 'Musterstraße 1')
		await user.type(screen.getByLabelText('Postcode'), '28195')
		await user.type(screen.getByLabelText('City'), 'Bremen')
		await user.type(screen.getByLabelText('Tax ID (Steuernummer)'), '12/345/67890')
		await user.click(screen.getByRole('button', { name: 'Continue' }))

		await vi.waitFor(() => {
			expect(mockSetBusiness).toHaveBeenCalled()
			expect(mockCompleteStep).toHaveBeenCalledWith(3)
			expect(mockSetCurrentStep).toHaveBeenCalledWith(4)
			expect(mockPush).toHaveBeenCalledWith('/signup/plan')
		})
	})
})
