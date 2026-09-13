# Gut8erPRO

The appraisal domain — Gutachten, Sachverständiger, BVSK, the four report types — is
glossed in [CLAUDE.md](./CLAUDE.md#key-domain-concepts) and stays there. This file holds
the vocabulary that the two-origin deployment forced on us, which is a different subject
and has its own history of being got wrong.

## Language

### Origins

**App origin**:
The origin this Next.js dashboard is served from — `https://app.gut8erpro.de`. Reached in
code only through `appUrl()`, never as a literal and never as a same-origin path.
_Avoid_: app URL, dashboard domain, site URL

**Marketing origin**:
The origin the separate Astro site is served from — `https://gut8erpro.de` — holding the
landing page and the four legal pages. Reached through `marketingUrl()`.
_Avoid_: apex, root domain, main site

### Supabase auth URLs

These three were treated as one setting in `.scratch/marketing-app-split/issues/06`, and
that conflation is what kept password reset broken in production for a fortnight. They are
independent, and only one of them is destructive to change.

**Site URL**:
The single fallback origin GoTrue redirects to when a link carries no `redirect_to`, or
carries one it refuses. Pointing it at a host that does not serve the app breaks every
link in every outstanding email, so it is the one setting that must not run ahead of DNS.
_Avoid_: app URL, base URL, redirect URL

**Redirect allow-list**:
The set of URL patterns GoTrue will honour in a `redirect_to`. Purely additive — an entry
for a host nobody uses yet changes nothing — so it can and should be widened ahead of a
cutover. Matched against the **full** URL including its query string, which is why the
entries are `/**` wildcards.
_Avoid_: redirect URLs, whitelist

**Silent substitution**:
What GoTrue does with a `redirect_to` that misses the allow-list: no error to the caller,
no note in the mail — it just swaps in the Site URL. The reason a mis-configured allow-list
presents as "the link goes to the wrong page" rather than as a failure.

### Recovery links

**Recovery link**:
The single-use link in a password-reset email. Distinguished from every other auth link by
being redeemed on a device that may not be the one that requested it — see
[ADR-0002](./docs/adr/0002-implicit-flow-for-recovery-links.md).
_Avoid_: reset link, magic link (a magic link signs you in; a recovery link does not)

**Implicit link**:
A recovery link that carries its session in the URL **fragment**. Redeems in any browser,
and is invisible to the server, because fragments are never transmitted.

**PKCE link**:
A link that carries a `?code=` to be exchanged against a verifier held by the browser that
requested it. Visible to the server, and redeemable only in that one browser. Correct for
OAuth, wrong for recovery.
