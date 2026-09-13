'use client'

import { useEffect, useRef } from 'react'

/**
 * Routes an implicit-flow recovery link to the page that can act on it.
 *
 * Supabase returns a recovery session in the URL *fragment* whenever the link was
 * issued without a PKCE challenge — every recovery email sent from the Supabase
 * dashboard, and any link that predates the code-exchange flow. A fragment is never
 * transmitted to the server, so `/auth/callback` cannot see one; without this the user
 * lands on whatever page the Supabase Site URL points at, silently signed in and still
 * holding their old password.
 *
 * Browsers re-attach a fragment across redirects, so the fragment survives middleware's
 * bounce from an auth-gated route to `/login` and is still here to be read.
 */

/**
 * Read at module scope deliberately: module bodies run at import time and effects run
 * afterwards, which puts this ahead of every `createClient()` in the tree. A Supabase
 * browser client clears the fragment as soon as it initialises, so anything reading it
 * from an effect is racing that.
 */
const initialHash = typeof window === 'undefined' ? '' : window.location.hash

const RESET_PATH = '/reset-password'

function RecoveryRedirect() {
	const redirected = useRef(false)

	useEffect(() => {
		if (redirected.current || initialHash.length < 2) return

		const params = new URLSearchParams(initialHash.slice(1))
		// An expired or already-used link arrives as an error rather than a session. It
		// goes to the same place: that page is where "request a new link" lives.
		const isRecovery = params.get('type') === 'recovery' || params.has('error')
		if (!isRecovery || window.location.pathname === RESET_PATH) return

		redirected.current = true
		// A full navigation rather than the router: it keeps the fragment intact for the
		// reset page's own Supabase client to exchange, and keeps the spent link out of
		// the back button's reach.
		window.location.replace(`${RESET_PATH}${initialHash}`)
	}, [])

	return null
}

export { RecoveryRedirect }
