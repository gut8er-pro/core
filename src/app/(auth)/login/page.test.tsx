import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
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

	/**
	 * `/auth/callback` has always been able to redirect here with `?error=`, and until now
	 * nothing displayed it — every code-exchange failure looked like a blank login screen.
	 */
	describe('callback errors', () => {
		afterEach(() => {
			window.history.replaceState(null, '', '/login')
		})

		it('shows a message when the callback bounced here with ?error=', async () => {
			window.history.replaceState(null, '', '/login?error=auth_callback_error')
			render(<LoginPage />)

			await waitFor(() =>
				expect(
					screen.getByText("We couldn't complete that sign-in. Please try again."),
				).toBeInTheDocument(),
			)
		})

		// Left in the URL, the message would survive a reload and outlive the failure.
		it('scrubs the parameter once shown', async () => {
			window.history.replaceState(null, '', '/login?error=auth_callback_error')
			render(<LoginPage />)

			await waitFor(() => expect(window.location.search).toBe(''))
		})

		it('shows nothing on a clean visit', () => {
			render(<LoginPage />)
			expect(
				screen.queryByText("We couldn't complete that sign-in. Please try again."),
			).not.toBeInTheDocument()
		})
	})
})
