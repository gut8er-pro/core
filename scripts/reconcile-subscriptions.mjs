#!/usr/bin/env node
/**
 * Reconcile our `User` rows against Stripe's subscriptions.
 *
 *   node --env-file=.env scripts/reconcile-subscriptions.mjs          # report only
 *   node --env-file=.env scripts/reconcile-subscriptions.mjs --write  # apply
 *
 * Stripe is authoritative for entitlement; our columns are a cache the webhook keeps
 * warm. When the webhook cannot deliver — as it could not for roughly a month, see
 * `.scratch/e2e-production-audit/issues/13-stripe-webhook-has-never-delivered.md` — the
 * cache goes stale silently, and this is what brings it back.
 *
 * It reports before it repairs, and never repairs without `--write`. That is the point
 * of the script and not a convenience: ADR-0003 rejects silent self-healing precisely
 * because damage staying visible is what got the outage noticed.
 *
 * Plain Node ESM on `pg` rather than Prisma: the generated client is TypeScript source
 * and the repo carries no TS loader for scripts.
 */

import { pathToFileURL } from 'node:url'
import pg from 'pg'
import Stripe from 'stripe'

/**
 * Subscription statuses that carry entitlement, in the order we prefer them when a user
 * has more than one. Kept identical to `ACTIVE_STATUSES` in
 * `src/app/api/stripe/webhook/route.ts` — the two must move together, and issue 15
 * moves `past_due` into it.
 */
const ENTITLED_STATUSES = ['active', 'trialing']

function customerIdOf(subscription) {
	return typeof subscription.customer === 'string'
		? subscription.customer
		: (subscription.customer?.id ?? null)
}

/** The subscription that decides this user's entitlement, or null if none does. */
function entitlingSubscription(subscriptions) {
	for (const status of ENTITLED_STATUSES) {
		const match = subscriptions.find((subscription) => subscription.status === status)
		if (match) return match
	}
	return null
}

function sameInstant(a, b) {
	if (a === null || b === null) return a === b
	return new Date(a).getTime() === new Date(b).getTime()
}

/**
 * What this user's row should say, given everything Stripe knows about them, and how
 * that differs from what it says now. Pure — the reporting and the writing both read
 * from here so that what `--write` applies is exactly what the report printed.
 */
function reconcileUser(user, subscriptions) {
	const subscription = entitlingSubscription(subscriptions)
	const proposed = {
		plan: subscription ? 'PRO' : 'FREE',
		// Never cleared: the customer is Stripe's identity for this person and outlives
		// any one subscription. A customer id pointing at nothing is reported instead.
		stripeCustomerId: subscription ? customerIdOf(subscription) : (user.stripeCustomerId ?? null),
		stripeSubscriptionId: subscription?.id ?? null,
		trialEndsAt: subscription?.trial_end ? new Date(subscription.trial_end * 1000) : null,
	}

	const diffs = []
	if (user.plan !== proposed.plan) diffs.push(['plan', user.plan, proposed.plan])
	if ((user.stripeCustomerId ?? null) !== proposed.stripeCustomerId) {
		diffs.push(['stripeCustomerId', user.stripeCustomerId ?? null, proposed.stripeCustomerId])
	}
	if ((user.stripeSubscriptionId ?? null) !== proposed.stripeSubscriptionId) {
		diffs.push([
			'stripeSubscriptionId',
			user.stripeSubscriptionId ?? null,
			proposed.stripeSubscriptionId,
		])
	}
	if (!sameInstant(user.trialEndsAt ?? null, proposed.trialEndsAt)) {
		diffs.push(['trialEndsAt', user.trialEndsAt ?? null, proposed.trialEndsAt])
	}

	return { proposed, diffs }
}

function requireEnv(name) {
	const value = process.env[name]
	if (!value) {
		console.error(`Missing ${name}. Run with: node --env-file=.env ${process.argv[1]}`)
		process.exit(1)
	}
	return value
}

function show(value) {
	if (value === null || value === undefined) return 'null'
	if (value instanceof Date) return value.toISOString()
	return String(value)
}

/**
 * Every subscription Stripe holds for each of our users, gathered from both directions.
 * Going by customer id alone is not enough: a row that lost its `stripeCustomerId` — or
 * never got one, because Checkout completed while the webhook was down — is invisible
 * that way, and it is exactly the row that needs repairing. `metadata.userId`, which
 * `createCheckoutSession` stamps on every subscription, finds it.
 */
async function gatherSubscriptions(stripe, users) {
	const byUserId = new Map(users.map((user) => [user.id, []]))
	const seen = new Set()
	const orphanedCustomers = []
	const unattributed = []

	for (const user of users) {
		if (!user.stripeCustomerId) continue
		try {
			const { data } = await stripe.subscriptions.list({
				customer: user.stripeCustomerId,
				status: 'all',
				limit: 100,
			})
			for (const subscription of data) {
				byUserId.get(user.id).push(subscription)
				seen.add(subscription.id)
			}
		} catch (err) {
			// A customer id from the other Stripe mode, or one deleted in the dashboard.
			// Real after a mode swap, and not something to throw over.
			if (err?.code === 'resource_missing' || err?.statusCode === 404) {
				orphanedCustomers.push(user)
				continue
			}
			throw err
		}
	}

	for await (const subscription of stripe.subscriptions.list({ status: 'all', limit: 100 })) {
		if (seen.has(subscription.id)) continue
		const userId = subscription.metadata?.userId
		if (userId && byUserId.has(userId)) {
			byUserId.get(userId).push(subscription)
			continue
		}
		unattributed.push(subscription)
	}

	return { byUserId, orphanedCustomers, unattributed }
}

async function main() {
	const write = process.argv.includes('--write')
	const databaseUrl = requireEnv('DATABASE_URL')
	const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'))

	const pool = new pg.Pool({
		connectionString: databaseUrl,
		ssl: { rejectUnauthorized: false },
		max: 3,
	})

	console.log(write ? '── reconcile (WRITE) ──' : '── reconcile (report only) ──')

	const { rows: users } = await pool.query(
		`SELECT id, email, plan, "stripeCustomerId", "stripeSubscriptionId", "trialEndsAt"
		 FROM "User"
		 ORDER BY "createdAt"`,
	)

	const { byUserId, orphanedCustomers, unattributed } = await gatherSubscriptions(stripe, users)

	let drifted = 0
	let written = 0
	let failed = 0

	for (const user of users) {
		const subscriptions = byUserId.get(user.id)
		const { proposed, diffs } = reconcileUser(user, subscriptions)
		if (diffs.length === 0) continue

		drifted += 1
		const statuses = subscriptions.map((s) => `${s.id} ${s.status}`).join(', ')
		console.log(`\n${user.email} (${user.id}) — Stripe: ${statuses || 'no subscriptions'}`)
		for (const [field, current, next] of diffs) {
			console.log(`  ${field}: ${show(current)} → ${show(next)}`)
		}

		if (write) {
			try {
				await pool.query(
					`UPDATE "User"
					 SET plan = $1::"Plan",
					     "stripeCustomerId" = $2,
					     "stripeSubscriptionId" = $3,
					     "trialEndsAt" = $4
					 WHERE id = $5`,
					[
						proposed.plan,
						proposed.stripeCustomerId,
						proposed.stripeSubscriptionId,
						proposed.trialEndsAt,
						user.id,
					],
				)
				written += 1
				console.log('  written')
			} catch (err) {
				// Both Stripe ids are unique columns, so two rows claiming one customer
				// stops here. That is one user to look at by hand, not a reason to leave
				// the rest of them stale.
				failed += 1
				console.log(`  NOT written: ${err.message}`)
			}
		}
	}

	if (orphanedCustomers.length > 0) {
		console.log('\nCustomer ids that do not exist in this Stripe account:')
		for (const user of orphanedCustomers) {
			console.log(`  ${user.email} (${user.id}) → ${user.stripeCustomerId}`)
		}
	}

	// The mirror image: a subscription Stripe is billing that we cannot attribute to
	// anyone. Left as a report, because guessing which user it belongs to is how the
	// wrong account gets entitled.
	if (unattributed.length > 0) {
		console.log('\nStripe subscriptions matching no user of ours:')
		for (const subscription of unattributed) {
			console.log(
				`  ${subscription.id} (${subscription.status}) customer ${customerIdOf(subscription) ?? 'unknown'}, metadata.userId ${subscription.metadata?.userId ?? 'unset'}`,
			)
		}
	}

	console.log(
		`\n${users.length} user(s), ${drifted} drifted, ${orphanedCustomers.length} orphaned customer(s), ` +
			`${unattributed.length} unattributed subscription(s).`,
	)
	if (drifted > 0) {
		console.log(
			write
				? `${written} user(s) updated${failed > 0 ? `, ${failed} refused by the database` : ''}.`
				: 'Re-run with --write to apply.',
		)
	}

	await pool.end()
}

const invokedDirectly =
	process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (invokedDirectly) {
	main().catch((err) => {
		console.error(err)
		process.exit(1)
	})
}

export { ENTITLED_STATUSES, gatherSubscriptions, reconcileUser }
