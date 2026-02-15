/**
 * Integration tests for external services.
 * These tests hit REAL APIs — they require valid env vars and will consume credits/quota.
 *
 * Run with:  pnpm vitest run src/test/integration/services.integration.test.ts
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import Stripe from 'stripe'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'

// ─── Helpers ────────────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
	const value = process.env[name]
	if (!value) throw new Error(`Missing env var: ${name}. Skipping integration tests.`)
	return value
}

// ─── 1. Stripe — Create checkout session for Pro plan ───────────────────────

describe('Stripe Integration', () => {
	it('retrieves the Pro price (49 EUR/month)', async () => {
		const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'))
		const priceId = requireEnv('STRIPE_PRO_PRICE_ID')

		const price = await stripe.prices.retrieve(priceId)

		expect(price.id).toBe(priceId)
		expect(price.unit_amount).toBe(4900) // 49.00 EUR in cents
		expect(price.currency).toBe('eur')
		expect(price.recurring?.interval).toBe('month')
		expect(price.active).toBe(true)
	})

	it('creates a checkout session with 14-day trial', async () => {
		const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'))
		const priceId = requireEnv('STRIPE_PRO_PRICE_ID')

		const session = await stripe.checkout.sessions.create({
			mode: 'subscription',
			payment_method_types: ['card'],
			line_items: [{ price: priceId, quantity: 1 }],
			subscription_data: {
				trial_period_days: 14,
				metadata: { userId: 'test-user-integration' },
			},
			metadata: { userId: 'test-user-integration' },
			success_url: 'http://localhost:3000/settings?success=true',
			cancel_url: 'http://localhost:3000/settings?canceled=true',
		})

		expect(session.id).toBeTruthy()
		expect(session.url).toBeTruthy()
		expect(session.url).toContain('checkout.stripe.com')
		expect(session.mode).toBe('subscription')
		expect(session.metadata?.userId).toBe('test-user-integration')
	})
})

// ─── 2. Anthropic — Analyze a sample image ──────────────────────────────────

describe('Anthropic Integration', () => {
	it('analyzes a vehicle damage description prompt', async () => {
		const client = new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY') })

		// Test the AI's ability to produce structured damage analysis (text-only, no image download issues)
		const message = await client.messages.create({
			model: 'claude-haiku-4-5-20251001',
			max_tokens: 256,
			system: 'You are a professional vehicle damage assessor. Respond with a structured damage assessment.',
			messages: [
				{
					role: 'user',
					content: 'A 2020 BMW 3 Series has a large dent on the front left fender, scratches on the driver door, and the left headlight is cracked. Provide a structured damage assessment.',
				},
			],
		})

		expect(message.id).toBeTruthy()
		expect(message.content.length).toBeGreaterThanOrEqual(1)
		expect(message.content[0].type).toBe('text')

		const text = message.content[0].type === 'text' ? message.content[0].text : ''
		expect(text.length).toBeGreaterThan(50)
		// Should mention relevant damage terms
		expect(text.toLowerCase()).toMatch(/dent|scratch|headlight|fender|damage/)
	}, 30000)

	it('detects a VIN from text (simulated VIN detection)', async () => {
		const client = new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY') })

		const message = await client.messages.create({
			model: 'claude-haiku-4-5-20251001',
			max_tokens: 64,
			messages: [
				{
					role: 'user',
					content:
						'Extract the VIN from this text: "The vehicle identification number is WBAPH5C55BA123456". Return ONLY the 17-character VIN, nothing else.',
				},
			],
		})

		const text = message.content[0].type === 'text' ? message.content[0].text : ''
		expect(text).toContain('WBAPH5C55BA123456')
	}, 15000)
})

// ─── 3. Resend — Send a test email ──────────────────────────────────────────

describe('Resend Integration', () => {
	it('sends a test email successfully', async () => {
		const resend = new Resend(requireEnv('RESEND_API_KEY'))

		// Resend sandbox allows sending to the onboarding@resend.dev address
		const { data, error } = await resend.emails.send({
			from: 'Gut8erPRO <onboarding@resend.dev>',
			to: ['delivered@resend.dev'],
			subject: 'Gut8erPRO Integration Test',
			html: '<h1>Test Email</h1><p>This is an integration test from Gut8erPRO.</p>',
		})

		expect(error).toBeNull()
		expect(data).toBeTruthy()
		expect(data?.id).toBeTruthy()
	}, 15000)
})

// ─── 4. Sentry — Verify DSN is valid ────────────────────────────────────────

describe('Sentry Integration', () => {
	it('has a valid DSN format', () => {
		const dsn = requireEnv('NEXT_PUBLIC_SENTRY_DSN')

		// Sentry DSN format: https://<key>@<org>.ingest.<region>.sentry.io/<project>
		const dsnPattern = /^https:\/\/[a-f0-9]+@[a-z0-9]+\.ingest\.[a-z]+\.sentry\.io\/\d+$/
		expect(dsn).toMatch(dsnPattern)
	})

	it('Sentry ingest endpoint is reachable', async () => {
		const dsn = requireEnv('NEXT_PUBLIC_SENTRY_DSN')

		// Parse DSN to get the host
		const url = new URL(dsn)
		const host = url.host // e.g., o4510892085936128.ingest.de.sentry.io

		// Ping the Sentry health endpoint
		const response = await fetch(`https://${host}/api/0/`, {
			method: 'GET',
		})

		// Sentry returns various status codes, but the host should be reachable (not a network error)
		// A 404 or 401 is fine — it means the server is up
		expect([200, 401, 403, 404, 405]).toContain(response.status)
	}, 10000)
})

// ─── 5. Supabase — Connection check ─────────────────────────────────────────

describe('Supabase Integration', () => {
	it('connects to Supabase Auth', async () => {
		const { createClient } = await import('@supabase/supabase-js')

		const supabase = createClient(
			requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
			requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
		)

		const { error } = await supabase.auth.getSession()
		// No session is expected (not logged in), but no connection error
		expect(error).toBeNull()
	})
})

// ─── 6. Database — Prisma connection ─────────────────────────────────────────

describe('Database Integration', () => {
	it('connects to PostgreSQL and queries successfully', async () => {
		const pg = await import('pg')
		const pool = new pg.default.Pool({
			connectionString: requireEnv('DATABASE_URL'),
			ssl: { rejectUnauthorized: false },
		})

		try {
			const result = await pool.query('SELECT 1 as connected')
			expect(result.rows).toHaveLength(1)
			expect(result.rows[0].connected).toBe(1)
		} finally {
			await pool.end()
		}
	}, 10000)

	it('can query the User table', async () => {
		const pg = await import('pg')
		const pool = new pg.default.Pool({
			connectionString: requireEnv('DATABASE_URL'),
			ssl: { rejectUnauthorized: false },
		})

		try {
			const result = await pool.query('SELECT count(*)::int as count FROM "User"')
			expect(result.rows[0].count).toBeGreaterThanOrEqual(0)
		} finally {
			await pool.end()
		}
	}, 10000)
})
