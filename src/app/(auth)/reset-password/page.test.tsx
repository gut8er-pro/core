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

/**
 * `setSession`, not `getSession`: the browser client is pinned to PKCE and silently
 * refuses to redeem an implicit fragment on its own. `client.test.ts` holds that
 * constraint down — mocking the client here means these tests cannot see it.
 */
const setSession = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
	createClient: () => ({ auth: { setSession } }),
}))

function renderAt(hash: string) {
	window.history.replaceState(null, '', `/reset-password${hash}`)
	return render(<ResetPasswordPage />)
}

afterEach(() => {
	window.history.replaceState(null, '', '/reset-password')
	setSession.mockReset()
})

const RECOVERY = '#access_token=a.b.c&refresh_token=xyz&token_type=bearer&type=recovery'

describe('ResetPasswordPage', () => {
	it('renders a usable form when reached without a fragment', () => {
		renderAt('')
		expect(screen.getByText('Set new password')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Update password' })).toBeEnabled()
		// Nothing to exchange, so the Supabase client is never constructed.
		expect(setSession).not.toHaveBeenCalled()
	})

	it('exchanges a recovery fragment for a session before enabling submit', async () => {
		let resolve: (value: { data: { session: object | null }; error: null }) => void = () => {}
		setSession.mockReturnValue(
			new Promise((r) => {
				resolve = r
			}),
		)

		renderAt(RECOVERY)

		// The tokens have to be handed over explicitly — automatic detection is a no-op
		// on a PKCE-pinned client, which is how this page came to be broken in production.
		expect(setSession).toHaveBeenCalledWith({ access_token: 'a.b.c', refresh_token: 'xyz' })

		// Submitting during the exchange would race the session cookie and be rejected.
		expect(screen.getByRole('button', { name: 'Verifying link...' })).toBeDisabled()

		resolve({ data: { session: { user: {} } }, error: null })
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Update password' })).toBeEnabled(),
		)
	})

	it('strips the fragment once redeemed, so the refresh token does not linger', async () => {
		setSession.mockResolvedValue({ data: { session: { user: {} } }, error: null })
		renderAt(RECOVERY)

		await waitFor(() => expect(window.location.hash).toBe(''))
		expect(window.location.pathname).toBe('/reset-password')
	})

	it('ignores a recovery fragment that carries no refresh token to exchange', () => {
		renderAt('#access_token=a.b.c&type=recovery')
		expect(setSession).not.toHaveBeenCalled()
	})

	it('explains an expired link and offers a new one', async () => {
		renderAt('#error=access_denied&error_code=otp_expired&error_description=Email+link')

		await waitFor(() =>
			expect(
				screen.getByText('This password reset link is invalid or has expired.'),
			).toBeInTheDocument(),
		)
		expect(screen.getByText('Request a new link')).toBeInTheDocument()
		expect(setSession).not.toHaveBeenCalled()
	})

	it('reports a recovery fragment that yields no session', async () => {
		setSession.mockResolvedValue({ data: { session: null }, error: null })
		renderAt(RECOVERY)

		await waitFor(() =>
			expect(
				screen.getByText('This password reset link is invalid or has expired.'),
			).toBeInTheDocument(),
		)
	})

	it('reports an exchange that fails outright', async () => {
		setSession.mockResolvedValue({ data: { session: null }, error: { message: 'bad jwt' } })
		renderAt(RECOVERY)

		await waitFor(() =>
			expect(
				screen.getByText('This password reset link is invalid or has expired.'),
			).toBeInTheDocument(),
		)
	})
})
