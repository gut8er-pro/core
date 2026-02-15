import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import LoginPage from './page'

vi.mock('next/link', () => ({
	default: ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	),
}))

vi.mock('@/lib/auth/actions', () => ({
	login: vi.fn(),
	signInWithGoogle: vi.fn(),
	signInWithApple: vi.fn(),
}))

describe('LoginPage', () => {
	it('renders the welcome heading', () => {
		render(<LoginPage />)
		expect(screen.getByText('Welcome back')).toBeInTheDocument()
	})

	it('renders email and password fields', () => {
		render(<LoginPage />)
		expect(screen.getByLabelText('Email address')).toBeInTheDocument()
		expect(screen.getByLabelText('Password')).toBeInTheDocument()
	})

	it('renders the sign in button', () => {
		render(<LoginPage />)
		expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
	})

	it('renders social login buttons', () => {
		render(<LoginPage />)
		expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Continue with Apple' })).toBeInTheDocument()
	})

	it('renders branding panel with stats', () => {
		render(<LoginPage />)
		expect(screen.getByText('-35%')).toBeInTheDocument()
		expect(screen.getByText('-60%')).toBeInTheDocument()
		expect(screen.getByText('2000+')).toBeInTheDocument()
	})

	it('renders forgot password and create account links', () => {
		render(<LoginPage />)
		expect(screen.getByText('Forgot password?')).toHaveAttribute('href', '/forgot-password')
		expect(screen.getByText('Create account')).toHaveAttribute('href', '/signup/account')
	})

	it('renders remember me checkbox', () => {
		render(<LoginPage />)
		expect(screen.getByText('Remember me')).toBeInTheDocument()
	})
})
