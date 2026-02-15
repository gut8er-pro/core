import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TopNavBar } from './top-nav-bar'

describe('TopNavBar', () => {
	it('renders logo', () => {
		render(<TopNavBar />)
		expect(screen.getByText(/Gut8er/)).toBeInTheDocument()
	})

	it('renders navigation buttons', () => {
		render(<TopNavBar />)
		expect(screen.getByLabelText('Dashboard')).toBeInTheDocument()
		expect(screen.getByLabelText('Statistics')).toBeInTheDocument()
		expect(screen.getByLabelText('Settings')).toBeInTheDocument()
		expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
	})

	it('renders user name', () => {
		render(<TopNavBar userName="Max Mustermann" />)
		expect(screen.getByText('Max Mustermann')).toBeInTheDocument()
	})

	it('renders user avatar initial', () => {
		render(<TopNavBar userName="Max Mustermann" />)
		expect(screen.getByText('M')).toBeInTheDocument()
	})

	it('renders user role', () => {
		render(<TopNavBar userName="Max" userRole="Admin" />)
		expect(screen.getByText('Admin')).toBeInTheDocument()
	})

	it('calls onNavigate with correct path', async () => {
		const user = userEvent.setup()
		const onNavigate = vi.fn()
		render(<TopNavBar onNavigate={onNavigate} />)
		await user.click(screen.getByLabelText('Dashboard'))
		expect(onNavigate).toHaveBeenCalledWith('/dashboard')
	})

	it('defaults to U for unknown user', () => {
		render(<TopNavBar />)
		expect(screen.getByText('U')).toBeInTheDocument()
	})
})
