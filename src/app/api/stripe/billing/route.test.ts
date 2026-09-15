import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * What this endpoint owes the settings page is a reading of the account that agrees with
 * itself. It used to serve two: the subscription came from `User.stripeSubscriptionId`
 * while the card and the invoices came from Stripe, so an account whose webhook events
 * were dropped was told "Kein aktives Abonnement" above its own paid invoices. See
 * `.scratch/e2e-production-audit/issues/14-billing-page-contradicts-itself.md`.
 *
 * It reads entitlement and never writes it — ADR-0003 — so `plan` comes back exactly as
 * the database has it even when Stripe plainly disagrees.
 */

const findUnique = vi.fn()
const update = vi.fn()
const subscriptionsList = vi.fn()
const customersRetrieve = vi.fn()
const paymentMethodsList = vi.fn()
const paymentMethodsRetrieve = vi.fn()
const invoicesList = vi.fn()

vi.mock('@/lib/api/auth', () => ({
	getAuthenticatedUser: async () => ({ user: { id: 'user_1' }, error: null }),
	unauthorizedResponse: () => new Response(null, { status: 401 }),
}))
vi.mock('@/lib/prisma', () => ({
	prisma: {
		user: {
			findUnique: (...a: unknown[]) => findUnique(...a),
			update: (...a: unknown[]) => update(...a),
		},
	},
}))
vi.mock('@/lib/stripe/client', () => ({
	getStripeClient: () => ({
		subscriptions: { list: (...a: unknown[]) => subscriptionsList(...a) },
		customers: { retrieve: (...a: unknown[]) => customersRetrieve(...a) },
		paymentMethods: {
			list: (...a: unknown[]) => paymentMethodsList(...a),
			retrieve: (...a: unknown[]) => paymentMethodsRetrieve(...a),
		},
		invoices: { list: (...a: unknown[]) => invoicesList(...a) },
	}),
}))

const { GET } = await import('./route')

const CUSTOMER = 'cus_V0ucyZumCqKryT'

function stripeSubscription(status: string, overrides: Record<string, unknown> = {}) {
	return {
		id: 'sub_1U0snjPX9t4iIbv4Pas8t54u',
		status,
		trial_end: null,
		cancel_at_period_end: false,
		cancel_at: null,
		items: {
			data: [
				{
					price: { id: 'price_1SpJvCPX9t4iIbv4ZBVR6hHV' },
					current_period_start: 1_756_740_000,
					current_period_end: 1_759_418_400,
				},
			],
		},
		...overrides,
	}
}

function stripeHasSubscriptions(byStatus: Record<string, unknown[]>) {
	subscriptionsList.mockImplementation(async ({ status }: { status: string }) => ({
		data: byStatus[status] ?? [],
	}))
}

beforeEach(() => {
	vi.clearAllMocks()
	vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_deadbeef')
	vi.spyOn(console, 'error').mockImplementation(() => {})

	// The account the audit found: entitled and paying in Stripe, with the column the
	// webhook was supposed to fill still NULL.
	findUnique.mockResolvedValue({
		plan: 'PRO',
		stripeCustomerId: CUSTOMER,
		stripeSubscriptionId: null,
		trialEndsAt: null,
	})
	stripeHasSubscriptions({})
	customersRetrieve.mockResolvedValue({ deleted: false, invoice_settings: {} })
	paymentMethodsRetrieve.mockResolvedValue({
		card: { brand: 'mastercard', last4: '4444', exp_month: 1, exp_year: 2030 },
	})
	paymentMethodsList.mockResolvedValue({
		data: [{ card: { brand: 'visa', last4: '4242', exp_month: 12, exp_year: 2034 } }],
	})
	invoicesList.mockResolvedValue({
		data: [
			{
				id: 'in_1U0snjPX9t4iIbv4',
				created: 1_756_740_000,
				amount_paid: 6900,
				currency: 'eur',
				status: 'paid',
				lines: { data: [{ description: 'Pro Plan' }] },
				invoice_pdf: 'https://stripe.test/invoice.pdf',
				hosted_invoice_url: 'https://stripe.test/invoice',
			},
		],
	})
})

describe('GET /api/stripe/billing', () => {
	/**
	 * The acceptance criterion: the page must be able to render the subscription and
	 * "Plan verwalten" for an account whose `stripeSubscriptionId` never got written.
	 */
	it('reports the subscription Stripe holds when the cached id is missing', async () => {
		stripeHasSubscriptions({ active: [stripeSubscription('active')] })

		const body = await (await GET()).json()

		expect(body.subscription).toMatchObject({
			id: 'sub_1U0snjPX9t4iIbv4Pas8t54u',
			status: 'active',
			currentPeriodEnd: new Date(1_759_418_400 * 1000).toISOString(),
			cancelAtPeriodEnd: false,
		})
		expect(subscriptionsList).toHaveBeenCalledWith(expect.objectContaining({ customer: CUSTOMER }))
	})

	it('reports no subscription when the only one in Stripe is cancelled', async () => {
		stripeHasSubscriptions({ canceled: [stripeSubscription('canceled')] })

		const body = await (await GET()).json()

		expect(body.subscription).toBeNull()
	})

	/**
	 * The contradiction itself: whatever the subscription turns out to be, the card and
	 * the invoices are read from the same account in the same request.
	 */
	it('serves the card and the invoices from the same reading of the account', async () => {
		stripeHasSubscriptions({ active: [stripeSubscription('active')] })

		const body = await (await GET()).json()

		expect(body.paymentMethod).toEqual({
			brand: 'visa',
			last4: '4242',
			expMonth: 12,
			expYear: 2034,
		})
		expect(body.invoices).toHaveLength(1)
		expect(body.invoices[0]).toMatchObject({ amount: '69.00', currency: 'EUR', status: 'paid' })
	})

	/** The path a customer who has actually paid takes: a card set as the default. */
	it('prefers the card the customer set as their default', async () => {
		customersRetrieve.mockResolvedValue({
			deleted: false,
			invoice_settings: { default_payment_method: 'pm_1U0snjPX9t4iIbv4' },
		})
		stripeHasSubscriptions({ active: [stripeSubscription('active')] })

		const body = await (await GET()).json()

		expect(paymentMethodsRetrieve).toHaveBeenCalledWith('pm_1U0snjPX9t4iIbv4')
		expect(body.paymentMethod).toEqual({
			brand: 'mastercard',
			last4: '4444',
			expMonth: 1,
			expYear: 2030,
		})
		expect(paymentMethodsList).not.toHaveBeenCalled()
	})

	/**
	 * CONTEXT.md, Trial: "Stripe's `trial_end` is authoritative; the `trialEndsAt` we store
	 * is a cache of it and has no vote." `trialEndsAt` has the same sole writer as
	 * `stripeSubscriptionId` and was NULL for the same accounts, so without this the page
	 * computes `isTrialing` from a live Stripe status and the countdown from an empty
	 * cache, and shows a customer mid-trial a renewal date instead of their days left.
	 */
	it("lets Stripe's trial end overrule the cached one", async () => {
		findUnique.mockResolvedValue({
			plan: 'PRO',
			stripeCustomerId: CUSTOMER,
			stripeSubscriptionId: null,
			trialEndsAt: null,
		})
		stripeHasSubscriptions({
			trialing: [stripeSubscription('trialing', { trial_end: 1_759_418_400 })],
		})

		const body = await (await GET()).json()

		expect(body.trialEndsAt).toBe(new Date(1_759_418_400 * 1000).toISOString())
	})

	it('drops a cached trial end that Stripe does not have', async () => {
		findUnique.mockResolvedValue({
			plan: 'PRO',
			stripeCustomerId: CUSTOMER,
			stripeSubscriptionId: null,
			trialEndsAt: new Date('2099-01-01T00:00:00.000Z'),
		})
		stripeHasSubscriptions({ active: [stripeSubscription('active')] })

		const body = await (await GET()).json()

		expect(body.trialEndsAt).toBeNull()
	})

	/** With no authority to defer to, the cache is all there is, and it stands. */
	it('keeps the cached trial end when Stripe has no subscription to ask about', async () => {
		findUnique.mockResolvedValue({
			plan: 'PRO',
			stripeCustomerId: CUSTOMER,
			stripeSubscriptionId: null,
			trialEndsAt: new Date('2026-08-12T00:00:00.000Z'),
		})
		stripeHasSubscriptions({})

		const body = await (await GET()).json()

		expect(body.trialEndsAt).toBe('2026-08-12T00:00:00.000Z')
	})

	/** ADR-0003: the webhook is the only writer of entitlement. */
	it('serves the stored entitlement without repairing it from Stripe', async () => {
		findUnique.mockResolvedValue({
			plan: 'FREE',
			stripeCustomerId: CUSTOMER,
			stripeSubscriptionId: null,
			trialEndsAt: null,
		})
		stripeHasSubscriptions({ active: [stripeSubscription('active')] })

		const body = await (await GET()).json()

		expect(body.plan).toBe('FREE')
		expect(body.subscription).not.toBeNull()
		expect(update).not.toHaveBeenCalled()
	})

	it('serves the stored entitlement when the customer has no Stripe record at all', async () => {
		findUnique.mockResolvedValue({
			plan: 'FREE',
			stripeCustomerId: null,
			stripeSubscriptionId: null,
			trialEndsAt: null,
		})

		const body = await (await GET()).json()

		expect(body).toEqual({
			plan: 'FREE',
			trialEndsAt: null,
			subscription: null,
			paymentMethod: null,
			invoices: [],
		})
		expect(subscriptionsList).not.toHaveBeenCalled()
	})

	/**
	 * A settings page that 500s tells the user less than a partial one. Stripe going down
	 * must not take the trial countdown and the stored entitlement with it.
	 */
	it('still serves what the database knows when Stripe fails', async () => {
		subscriptionsList.mockRejectedValue(new Error('Stripe is down'))

		const response = await GET()
		const body = await response.json()

		expect(response.status).toBe(200)
		expect(body.plan).toBe('PRO')
		expect(body.subscription).toBeNull()
		expect(body.trialEndsAt).toBeNull()
	})

	it('answers 404 for an authenticated user with no row of ours', async () => {
		findUnique.mockResolvedValue(null)

		expect((await GET()).status).toBe(404)
	})
})
