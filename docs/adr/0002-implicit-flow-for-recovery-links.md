# Password-recovery emails use implicit flow, not PKCE

Password reset is the one auth flow where the link is redeemed by a *different* client
than the one that requested it — people ask for the mail on a laptop and open it on a
phone. PKCE cannot survive that: `resetPasswordForEmail` stores its code verifier
alongside the client that created the challenge, which for a Next.js server action means
a cookie on the requesting browser, so the link only redeems there and fails everywhere
else with `?error=auth_callback_error`. We therefore mail recovery links from a client
pinned to `flowType: 'implicit'` (`createLinkMailerClient` in `src/lib/supabase/server.ts`)
and point them straight at `/reset-password` instead of `/auth/callback`.

## Consequences

- **The session arrives in a URL fragment**, so it lands in browser history and is
  readable by any script on the page. This is the trade-off we accepted for a link that
  works cross-device. It is bounded: recovery tokens are single-use, `/reset-password`
  strips the fragment once redeemed, and the app ships no third-party scripts on the auth
  routes.
- **The receiving client cannot be told to expect an implicit link.** `createBrowserClient`
  pins `flowType: 'pkce'` after spreading the options it is handed, and auth-js refuses an
  implicit fragment on a PKCE client — `AuthPKCEGrantCodeExchangeError`, swallowed during
  initialisation. So `detectSessionInUrl` is a silent no-op for exactly the links this
  decision creates. `/reset-password` therefore parses the fragment itself and calls
  `setSession`, and strips the fragment itself afterwards, since the auth-js strip belongs
  to the detection path that never runs. `src/lib/supabase/client.test.ts` pins this down;
  the page's own tests mock the client and cannot see it.
- **A fragment never reaches the server**, so nothing server-side can route these links.
  `RecoveryRedirect` in the root layout exists solely for that reason — it catches a
  recovery fragment on whatever route it lands on (notably the Supabase Site URL, which is
  where dashboard-issued mails go) and forwards it to `/reset-password` intact.
- **OAuth stays on PKCE.** Google and Apple redirect back into the same browser that
  started the handshake, so the verifier is always present and there is nothing to fix.
  `/auth/callback` is unchanged and still serves them, plus any PKCE recovery links that
  were already in flight when this shipped.
