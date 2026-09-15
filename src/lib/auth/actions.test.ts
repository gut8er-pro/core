import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Two things, both of which were once wrong in production: the shape of the
 * password-reset link we hand to Supabase (see
 * `docs/adr/0002-implicit-flow-for-recovery-links.md`), and what entitlement a fresh
 * signup gets before Stripe has said anything (see
 * `docs/adr/0003-entitlement-written-only-by-stripe-webhook.md`).
 */

const resetPasswordForEmail = vi.fn()
const createLinkMailerClient = vi.fn(() => ({ auth: { resetPasswordForEmail } }))
const signInWithPassword = vi.fn()
const createClient = vi.fn(async () => ({ auth: { signInWithPassword } }))
const createUser = vi.fn()
const deleteUser = vi.fn()
const createAdminClient = vi.fn(() => ({ auth: { admin: { createUser, deleteUser } } }))

const userCreate = vi.fn()
const userUpdate = vi.fn()
const customersCreate = vi.fn()
const createCheckoutSession = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
	createAdminClient,
	createClient,
	createLinkMailerClient,
}))

vi.mock('@/lib/prisma', () => ({
	prisma: {
		user: {
			create: (...a: unknown[]) => userCreate(...a),
			update: (...a: unknown[]) => userUpdate(...a),
		},
	},
}))
vi.mock('@/lib/stripe/client', () => ({
	getStripeClient: () => ({ customers: { create: (...a: unknown[]) => customersCreate(...a) } }),
}))
vi.mock('@/lib/stripe/subscription', () => ({
	createCheckoutSession: (...a: unknown[]) => createCheckoutSession(...a),
}))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

function form(email: string) {
	const data = new FormData()
	data.set('email', email)
	return data
}

const AUTH_USER_ID = '4bd78671-dfa5-493c-b82c-b18e3189581b'

beforeEach(() => {
	vi.clearAllMocks()
	resetPasswordForEmail.mockResolvedValue({ error: null })
	createUser.mockResolvedValue({ data: { user: { id: AUTH_USER_ID } }, error: null })
	signInWithPassword.mockResolvedValue({ error: null })
	userCreate.mockResolvedValue({})
	userUpdate.mockResolvedValue({})
	customersCreate.mockResolvedValue({ id: 'cus_V0ucyZumCqKryT' })
	createCheckoutSession.mockResolvedValue('https://checkout.stripe.com/c/pay/cs_test_123')
	vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.gut8erpro.de')
	vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123')
})

function signupInput() {
	return {
		account: { email: 'expert@example.de', password: 'correct horse battery' },
		personal: { firstName: 'Petra', lastName: 'Sachs' },
		business: {},
		plan: { plan: 'pro' } as const,
		integrations: {},
	}
}

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

/**
 * The hole this closes: the wizard wrote `plan: 'PRO'` and a seven-day `trialEndsAt` of
 * its own before Stripe had been asked anything, so abandoning Checkout left a fully
 * entitled account behind. Entitlement has one writer now, and it is the webhook.
 */
describe('completeSignup', () => {
	it('creates the account lapsed — no entitlement before Stripe has said so', async () => {
		const { completeSignup } = await import('./actions')

		await completeSignup(signupInput())

		expect(userCreate).toHaveBeenCalledTimes(1)
		const { data } = userCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> }
		expect(data.plan).toBe('FREE')
	})

	// Stripe's `trial_end` is the authority and the webhook caches it; a trial invented
	// here would outlive an abandoned Checkout with nothing to correct it.
	it('does not invent a trial end date', async () => {
		const { completeSignup } = await import('./actions')

		await completeSignup(signupInput())

		const { data } = userCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> }
		expect(data).not.toHaveProperty('trialEndsAt')
	})

	it('still hands back a Checkout URL, which is the only way to become entitled', async () => {
		const { completeSignup } = await import('./actions')

		const result = await completeSignup(signupInput())

		expect(customersCreate).toHaveBeenCalledWith({
			email: 'expert@example.de',
			metadata: { userId: AUTH_USER_ID },
		})
		expect(result.checkoutUrl).toBe('https://checkout.stripe.com/c/pay/cs_test_123')
	})
})
