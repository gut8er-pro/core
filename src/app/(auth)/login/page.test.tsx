import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import LoginPage from './page'

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
	usePathname: () => '/login',
	useParams: () => ({}),
	useSearchParams: () => new URLSearchParams(),
}))

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
		expect(screen.getByText('Email address')).toBeInTheDocument()
		expect(screen.getByText('Password')).toBeInTheDocument()
	})

	it('renders the log in button', () => {
		render(<LoginPage />)
		expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
	})

	it('renders social login buttons', () => {
		render(<LoginPage />)
		expect(screen.getByText('Login with Google')).toBeInTheDocument()
		expect(screen.getByText('Login with Apple')).toBeInTheDocument()
	})

	it('renders branding panel with stats', () => {
		render(<LoginPage />)
		expect(screen.getByText('-35%')).toBeInTheDocument()
		expect(screen.getByText('-40%')).toBeInTheDocument()
	})

	it('renders forgot password and signup links', () => {
		render(<LoginPage />)
		expect(screen.getByText('Forgot password?')).toHaveAttribute('href', '/forgot-password')
		expect(screen.getByText('Sign Up')).toHaveAttribute('href', '/signup/account')
	})

	it('renders subtitle text', () => {
		render(<LoginPage />)
		expect(screen.getByText('Please log in to your account to continue.')).toBeInTheDocument()
	})
})
