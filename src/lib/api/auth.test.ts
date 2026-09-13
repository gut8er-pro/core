import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `getEntitledUser` is what a subscription actually buys: creating a report and the AI
 * routes. A lapsed subscriber keeps everything they have already produced, so only the
 * seven paid handlers call this. The cases below are the ones that were actually wrong
 * in production: a user row created outside Stripe Checkout inherited `plan: PRO` from
 * the schema default and got the product for free.
 */

const getUser = vi.fn()
const findUnique = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
	createClient: vi.fn(async () => ({ auth: { getUser } })),
}))
vi.mock('@/lib/prisma', () => ({
	prisma: { user: { findUnique: (...a: unknown[]) => findUnique(...a) } },
}))

const { authErrorResponse, getEntitledUser } = await import('./auth')

const USER = { id: 'user-1', email: 'sv@example.de' }

beforeEach(() => {
	vi.clearAllMocks()
})

describe('getEntitledUser', () => {
	it('allows a user on the PRO plan', async () => {
		getUser.mockResolvedValue({ data: { user: USER }, error: null })
		findUnique.mockResolvedValue({ plan: 'PRO' })

		const { user, error } = await getEntitledUser()

		expect(error).toBeNull()
		expect(user).toEqual(USER)
	})

	it('refuses a signed-in user on the FREE plan with PaymentRequired', async () => {
		getUser.mockResolvedValue({ data: { user: USER }, error: null })
		findUnique.mockResolvedValue({ plan: 'FREE' })

		const { user, error } = await getEntitledUser()

		expect(error).toBe('PaymentRequired')
		expect(user).toBeNull()
	})

	it('refuses a signed-in user with no row in our database', async () => {
		getUser.mockResolvedValue({ data: { user: USER }, error: null })
		findUnique.mockResolvedValue(null)

		const { error } = await getEntitledUser()

		expect(error).toBe('PaymentRequired')
	})

	it('reports Unauthorized, not PaymentRequired, when there is no session', async () => {
		getUser.mockResolvedValue({ data: { user: null }, error: { message: 'no session' } })

		const { user, error } = await getEntitledUser()

		expect(error).toBe('Unauthorized')
		expect(user).toBeNull()
		// No point asking the database about a user we do not have.
		expect(findUnique).not.toHaveBeenCalled()
	})
})

describe('authErrorResponse', () => {
	it('maps PaymentRequired to 402 so the client can route to billing', async () => {
		const res = authErrorResponse('PaymentRequired')
		expect(res.status).toBe(402)
		await expect(res.json()).resolves.toEqual({ error: 'Subscription required' })
	})

	it('maps Unauthorized to 401', async () => {
		expect(authErrorResponse('Unauthorized').status).toBe(401)
	})

	it('falls back to 401 for a null error', () => {
		expect(authErrorResponse(null).status).toBe(401)
	})
})
