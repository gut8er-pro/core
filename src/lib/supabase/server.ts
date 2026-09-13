import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

async function createClient() {
	const cookieStore = await cookies()

	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll()
				},
				setAll(cookiesToSet) {
					try {
						for (const { name, value, options } of cookiesToSet) {
							cookieStore.set(name, value, options)
						}
					} catch {
						// Ignore errors in Server Components where cookies can't be set
					}
				},
			},
		},
	)
}

function createAdminClient() {
	return createSupabaseClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{ auth: { autoRefreshToken: false, persistSession: false } },
	)
}

/**
 * Anonymous client that mails **implicit-flow** links rather than PKCE ones.
 *
 * PKCE stores its code verifier next to the client that created the challenge. For a
 * link sent by a server action that means a cookie on the browser which submitted the
 * form — so the emailed link only redeems in that same browser, and reading the mail on
 * a phone dead-ends at `/login?error=auth_callback_error`. An implicit link carries its
 * session in the URL fragment instead and redeems wherever it is opened; `/reset-password`
 * is what picks the fragment up. See `docs/adr/0002-implicit-flow-for-recovery-links.md`.
 *
 * Deliberately unwired from cookies: this client only sends mail, it never holds a
 * session, and it must not disturb the caller's.
 */
function createLinkMailerClient() {
	return createSupabaseClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{ auth: { flowType: 'implicit', persistSession: false, autoRefreshToken: false } },
	)
}

export { createAdminClient, createClient, createLinkMailerClient }
