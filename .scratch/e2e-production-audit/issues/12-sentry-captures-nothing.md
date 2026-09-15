# 12 — Sentry is installed, configured, and captures nothing

Status: ready-for-agent
Type: bug
Severity: high

Three Sentry config files, a DSN set in Vercel and locally, `@sentry/nextjs` in the dependency
list — and no error has ever reached Sentry from this app. The SDK is never loaded.

Found while specifying issue 01, whose error-logging depends on it.

## The defect

`@sentry/nextjs` v10 loads `sentry.server.config.ts` and `sentry.edge.config.ts` **only** through an
`instrumentation.ts` hook exporting `register()`. This repo has no `instrumentation.ts`, no
`instrumentation-client.ts`, and nothing anywhere imports any of the three config files.

Verified against the installed SDK (10.53.1): `config/webpack.js:547` searches for
`sentry.client.config.ts` and nothing else. There is no loader for the server or edge configs in
v10 — the auto-loading behaviour people remember was v7.

So `sentry.server.config.ts`, `sentry.client.config.ts` and `sentry.edge.config.ts` are dead files.

**Server and edge:** inert unconditionally. The `Sentry.init()` in `sentry.server.config.ts` never
runs, DSN or no DSN.

**Client:** would be injected by `withSentryConfig`'s webpack step — but `next.config.ts:29` gates
`withSentryConfig` on `SENTRY_AUTH_TOKEN`, not on the DSN:

```ts
export default process.env.SENTRY_AUTH_TOKEN
    ? withSentryConfig(composed, { silent: true, disableLogger: true, tunnelRoute: '/monitoring' })
    : composed
```

With no auth token the wrapper is skipped entirely, so the client config is never bundled either —
and `tunnelRoute: '/monitoring'`, which exists to get past ad-blockers, is skipped with it.

Adding the DSN, which was done on 2026-09-15, changed nothing. That is the point: this is
configuration that looks complete and silently isn't — the same failure mode as issue 01.

## The fix

1. Add `instrumentation.ts` at the project root:
   - `register()` importing `./sentry.server.config` or `./sentry.edge.config` off
     `process.env.NEXT_RUNTIME`
   - `export const onRequestError = Sentry.captureRequestError` — without it, errors thrown in
     server components and route handlers are not reported
2. Add `instrumentation-client.ts`, or leave `sentry.client.config.ts` in place — `withSentryConfig`
   still picks the latter up. Prefer `instrumentation-client.ts`; it is the v10 convention and it
   removes the dependency on the webpack search path.
3. Leave the `next.config.ts` gate as it is. Gating on the auth token is defensible for the
   *build-time* wrapper — source-map upload is what needs the token — and once `instrumentation.ts`
   exists the server path no longer depends on that wrapper at all.

## Verification

An `instrumentation.ts` that loads is easy to confirm and easy to fool yourself about. Throw from a
route handler in a deployed preview and confirm the event arrives in Sentry, rather than checking
that the file exists.

## Configuration owed (human)

`SENTRY_AUTH_TOKEN` in Vercel, Production + Preview. Sentry → Settings → **Developer Settings →
Organization Auth Tokens**
(`sentry.io/orgredirect/organizations/:orgslug/settings/auth-tokens/`), scopes `project:releases`
and `org:read`. Build-time only — never prefix it `NEXT_PUBLIC_`, and treat it as a secret, since it
can cut releases in the org.

It buys two things: readable stack traces instead of `chunk-a7f3.js:1:48213`, and — in this repo
specifically — client-side capture at all, per the gate above.

**The server path does not need it.** Issue 01 only reports from a route handler, so step 1 alone
unblocks it.

## Related

- **Issue 01**, part 2 — its `Sentry.captureException` for provider failures is a no-op until this
  lands. Do this one first.
