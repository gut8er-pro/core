# Gut8erPRO

The appraisal domain — Gutachten, Sachverständiger, BVSK, the four report types — is
glossed in [CLAUDE.md](./CLAUDE.md#key-domain-concepts) and stays there. This file holds
the vocabulary that *deploying* the thing forced on us — the two-origin split, and the
mail senders. A different subject, and the one with a history of being got wrong.

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

### Mail senders

Every outbound mail leaves the same verified domain, but the product sends two quite
different things from it, and conflating them is what produced `.scratch/e2e-production-audit/issues/01`:
two independently-defaulting sender settings, one of them a sandbox address.

**Sending domain**:
The one Resend-verified domain all outbound mail leaves from — `gut8erpro.de`. Configured
once, as a domain. The part before the `@` belongs to the stream and is never a setting.
_Avoid_: from address, sender domain, mail domain

**Gutachten stream**:
Client-facing mail — the appraisal itself, from a Sachverständiger to their client. Carries
the assessor's name in the display name and their own address in the reply path, so the
platform reads as the carrier rather than the author.
_Avoid_: report email, send email

**Notification stream**:
Platform-to-user mail — the app telling its own user that something happened. From the
platform, in the platform's name. Shares the sending domain with the Gutachten stream but
not the local part, so a bounce storm on one cannot cost the other its delivery.
_Avoid_: system email, transactional email (both streams are transactional)

**Reply path**:
The address a recipient reaches by pressing Reply — the assessor's own account email, never
the envelope sender. The only thing making a Gutachten a two-way document, given that it
leaves from an address nobody reads.
_Avoid_: reply-to, sender (the envelope sender is a different thing, and deliberately
unreachable)

**Sandbox sender**:
A `*.resend.dev` address. Deliverable to the Resend account owner and to nobody else, and
silently so — every other recipient is refused by the provider, never by us. It was the
default, which is how production shipped unable to deliver its own deliverable.
_Avoid_: test sender, default sender

### Send failures

**Assessor-correctable failure**:
A send that failed for a reason the person who clicked it can fix — a mistyped recipient, an
attachment past the provider's size cap. Earns a message naming the cause, in German.
_Avoid_: user error, validation error (validation is what happens before we call the provider)

**Service failure**:
A send that failed for a reason only an operator can fix — an unverified domain, a rejected
key, a rate limit. Earns one generic message. The provider's own words never reach the
screen: they are in English, and they name our infrastructure and our account.
_Avoid_: server error, internal error

**Empty send**:
A send the app reports as successful while the Gutachten it existed to carry is absent —
every PDF failed to generate and the covering mail went out regardless. Distinguished from a
failed send by being invisible to everyone until the client asks where the report is, and by
leaving the report locked against a second attempt.
_Avoid_: partial send (a partial send has some of the PDFs; it is refused for the same reason)

## Billing and entitlement

The September 2026 audit reported three defects here. They were one missing database
write, described in four different vocabularies. These are the words that stop that
happening again.

**Entitlement**:
The single yes-or-no question "may this account create reports and use AI". There is one
paid plan, so there is nothing else to ask. `User.plan` stores it and the client mirrors
it as `isPro`; both are older names for this one concept.
_Avoid_: plan, tier, pro status, access level

**Lapsed**:
An account that has lost entitlement but kept its data. Everything it has ever produced
stays readable, editable, exportable and sendable; only report creation and the AI
features close.
_Avoid_: free tier, free plan, downgraded, cancelled — a cancellation is one of three
ways to become lapsed, alongside a failed card and an abandoned trial

**Trial**:
The seven days of entitlement that begin at Checkout. Stripe's `trial_end` is
authoritative; the `trialEndsAt` we store is a cache of it and has no vote.
_Avoid_: trial period, grace period

**Subscription**:
The Stripe object. It is what the billing page displays, and the only thing permitted to
change entitlement — through the webhook that reports its lifecycle.
_Avoid_: plan, membership, billing status
