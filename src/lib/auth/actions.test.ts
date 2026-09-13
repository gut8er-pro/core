import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * These cover one thing: the shape of the password-reset link we hand to Supabase.
 * Both properties below are load-bearing and both were once wrong in production —
 * see `docs/adr/0002-implicit-flow-for-recovery-links.md`.
 */

const resetPasswordForEmail = vi.fn()
const createLinkMailerClient = vi.fn(() => ({ auth: { resetPasswordForEmail } }))
const createClient = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
	createAdminClient: vi.fn(),
	createClient,
	createLinkMailerClient,
}))

vi.mock('@/lib/prisma', () => ({ prisma: {} }))
vi.mock('@/lib/stripe/client', () => ({ getStripeClient: vi.fn() }))
vi.mock('@/lib/stripe/subscription', () => ({ createCheckoutSession: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

function form(email: string) {
	const data = new FormData()
	data.set('email', email)
	return data
}

beforeEach(() => {
	vi.clearAllMocks()
	resetPasswordForEmail.mockResolvedValue({ error: null })
	vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.gut8erpro.de')
})

describe('requestPasswordReset', () => {
	/**
	 * The regression this guards: a PKCE link's code verifier is a cookie on the browser
	 * that submitted the form, so the mail only redeems in that browser. The mailer
	 * client is the one configured for implicit flow — using the cookie-backed server
	 * client here silently reintroduces PKCE.
	 */
	it('mails the link through the implicit-flow client, not the session client', async () => {
		const { requestPasswordReset } = await import('./actions')
		await requestPasswordReset(form('expert@example.de'))

		expect(createLinkMailerClient).toHaveBeenCalled()
		expect(createClient).not.toHaveBeenCalled()
	})

	// An implicit link has no `?code=` to exchange and its fragment never reaches the
	// server, so routing it through /auth/callback would strand it on a route that
	// reads only the query string.
	it('points the link straight at /reset-password on the app origin', async () => {
		const { requestPasswordReset } = await import('./actions')
		await requestPasswordReset(form('expert@example.de'))

		expect(resetPasswordForEmail).toHaveBeenCalledWith('expert@example.de', {
			redirectTo: 'https://app.gut8erpro.de/reset-password',
		})
	})

	it('reports nothing when the address is unknown, so the form cannot enumerate users', async () => {
		resetPasswordForEmail.mockResolvedValue({ error: { message: 'User not found' } })
		const { requestPasswordReset } = await import('./actions')

		await expect(requestPasswordReset(form('nobody@example.de'))).resolves.toEqual({})
	})

	it('rejects an empty address before contacting Supabase', async () => {
		const { requestPasswordReset } = await import('./actions')

		await expect(requestPasswordReset(form(''))).resolves.toEqual({
			error: 'Email is required',
		})
		expect(resetPasswordForEmail).not.toHaveBeenCalled()
	})
})
