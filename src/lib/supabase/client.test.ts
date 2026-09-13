import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient } from './client'

/**
 * A constraint, not a behaviour we chose.
 *
 * `createBrowserClient` sets `flowType: 'pkce'` *after* spreading the options it is
 * given, so no call site can ask for implicit. auth-js then refuses an implicit
 * fragment on a PKCE client outright — `_getSessionFromURL` throws
 * `AuthPKCEGrantCodeExchangeError('Not a valid PKCE flow url.')`, and initialisation
 * swallows it — so `detectSessionInUrl` quietly does nothing for a recovery link.
 *
 * That is why `/reset-password` parses the fragment itself and calls `setSession`
 * rather than trusting the client to pick it up. Every test on that page mocks this
 * module, so this is the only place the real behaviour is pinned. If a dependency
 * bump ever makes the assertion below fail, the page can be simplified — check it
 * there before deleting this.
 */
describe('browser Supabase client', () => {
	beforeEach(() => {
		vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
		vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
	})

	afterEach(() => {
		vi.unstubAllEnvs()
		window.history.replaceState(null, '', '/')
	})

	it('does not redeem an implicit recovery fragment on its own', async () => {
		window.history.replaceState(
			null,
			'',
			'/reset-password#access_token=a.b.c&refresh_token=xyz&expires_in=3600&token_type=bearer&type=recovery',
		)

		const { data } = await createClient().auth.getSession()

		expect(data.session).toBeNull()
		// It does not clear the fragment either, which is why the page has to.
		expect(window.location.hash).toContain('type=recovery')
	})
})
