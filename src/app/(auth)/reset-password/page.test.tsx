import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import ResetPasswordPage from './page'

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
	usePathname: () => '/reset-password',
	useParams: () => ({}),
	useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
	default: ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	),
}))

vi.mock('@/lib/auth/actions', () => ({ updatePassword: vi.fn() }))

const getSession = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
	createClient: () => ({ auth: { getSession } }),
}))

function renderAt(hash: string) {
	window.history.replaceState(null, '', `/reset-password${hash}`)
	return render(<ResetPasswordPage />)
}

afterEach(() => {
	window.history.replaceState(null, '', '/reset-password')
	getSession.mockReset()
})

describe('ResetPasswordPage', () => {
	it('renders a usable form when reached without a fragment', () => {
		renderAt('')
		expect(screen.getByText('Set new password')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Update password' })).toBeEnabled()
		// Nothing to exchange, so the Supabase client is never constructed.
		expect(getSession).not.toHaveBeenCalled()
	})

	it('exchanges a recovery fragment for a session before enabling submit', async () => {
		let resolve: (value: { data: { session: object } }) => void = () => {}
		getSession.mockReturnValue(
			new Promise((r) => {
				resolve = r
			}),
		)

		renderAt('#access_token=a.b.c&refresh_token=xyz&token_type=bearer&type=recovery')

		// Submitting during the exchange would race the session cookie and be rejected.
		const button = screen.getByRole('button', { name: 'Verifying link...' })
		expect(button).toBeDisabled()

		resolve({ data: { session: { user: {} } } })
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Update password' })).toBeEnabled(),
		)
	})

	it('explains an expired link and offers a new one', async () => {
		renderAt('#error=access_denied&error_code=otp_expired&error_description=Email+link')

		await waitFor(() =>
			expect(
				screen.getByText('This password reset link is invalid or has expired.'),
			).toBeInTheDocument(),
		)
		expect(screen.getByText('Request a new link')).toBeInTheDocument()
		expect(getSession).not.toHaveBeenCalled()
	})

	it('reports a recovery fragment that yields no session', async () => {
		getSession.mockResolvedValue({ data: { session: null } })
		renderAt('#access_token=a.b.c&type=recovery')

		await waitFor(() =>
			expect(
				screen.getByText('This password reset link is invalid or has expired.'),
			).toBeInTheDocument(),
		)
	})
})
