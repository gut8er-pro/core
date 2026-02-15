import { render, screen } from '@/test/test-utils'
import { describe, expect, it } from 'vitest'
import { StepperSidebar, StepperProgress } from './stepper-sidebar'

const steps = [
	{ number: 1, title: 'Account', subtitle: 'Create your login' },
	{ number: 2, title: 'Personal', subtitle: 'Your details' },
	{ number: 3, title: 'Business', subtitle: 'Company info' },
	{ number: 4, title: 'Plan', subtitle: 'Choose your plan' },
	{ number: 5, title: 'Integrations', subtitle: 'Connect tools' },
]

describe('StepperSidebar', () => {
	it('renders all steps', () => {
		render(<StepperSidebar steps={steps} currentStep={1} completedSteps={[]} />)
		expect(screen.getByText('Account')).toBeInTheDocument()
		expect(screen.getByText('Personal')).toBeInTheDocument()
		expect(screen.getByText('Business')).toBeInTheDocument()
		expect(screen.getByText('Plan')).toBeInTheDocument()
		expect(screen.getByText('Integrations')).toBeInTheDocument()
	})

	it('renders subtitles', () => {
		render(<StepperSidebar steps={steps} currentStep={1} completedSteps={[]} />)
		expect(screen.getByText('Create your login')).toBeInTheDocument()
	})

	it('marks current step with primary styling', () => {
		render(<StepperSidebar steps={steps} currentStep={2} completedSteps={[1]} />)
		const currentStepIndicator = screen.getByText('2')
		expect(currentStepIndicator.className).toContain('bg-primary')
		expect(currentStepIndicator.className).toContain('text-white')
	})

	it('shows checkmark for completed steps', () => {
		render(<StepperSidebar steps={steps} currentStep={3} completedSteps={[1, 2]} />)
		const completedIcons = screen.getAllByLabelText('Completed')
		expect(completedIcons).toHaveLength(2)
	})

	it('renders login link', () => {
		render(<StepperSidebar steps={steps} currentStep={1} completedSteps={[]} />)
		expect(screen.getByText('Log in')).toHaveAttribute('href', '/login')
	})

	it('renders logo', () => {
		render(<StepperSidebar steps={steps} currentStep={1} completedSteps={[]} />)
		expect(screen.getByText(/Gut8er/)).toBeInTheDocument()
	})

	it('has navigation landmark', () => {
		render(<StepperSidebar steps={steps} currentStep={1} completedSteps={[]} />)
		expect(screen.getByRole('navigation')).toBeInTheDocument()
	})
})

describe('StepperProgress', () => {
	it('renders step numbers for non-completed steps', () => {
		render(<StepperProgress steps={steps} currentStep={2} completedSteps={[1]} />)
		expect(screen.getByText('2')).toBeInTheDocument()
		expect(screen.getByText('3')).toBeInTheDocument()
	})

	it('marks current step with primary styling', () => {
		render(<StepperProgress steps={steps} currentStep={3} completedSteps={[1, 2]} />)
		const current = screen.getByText('3')
		expect(current.className).toContain('bg-primary')
	})
})
