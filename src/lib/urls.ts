/**
 * Cross-origin URLs.
 *
 * The marketing site (Astro, apex domain) and this dashboard app (Next,
 * `app.` subdomain) are deployed as separate projects on separate origins, so
 * every link that crosses the boundary has to be absolute and env-driven —
 * never a hardcoded domain and never a same-origin path.
 */

function joinUrl(origin: string, path: string): string {
	return `${origin.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

/**
 * Last-resort origin when the env var is unset. Production falls back to the
 * real domain rather than to localhost: `appUrl()` builds links inside
 * outbound email, and a missing variable silently mailing `localhost:3000`
 * would be worse than assuming the known production host.
 */
function fallbackOrigin(production: string, development: string): string {
	return process.env.NODE_ENV === 'production' ? production : development
}

/** Absolute URL on the public marketing site (landing page, legal pages). */
function marketingUrl(path = '/'): string {
	// Referenced in full so Next can inline it into client bundles.
	const origin =
		process.env.NEXT_PUBLIC_MARKETING_URL ||
		fallbackOrigin('https://gut8erpro.de', 'http://localhost:4321')
	return joinUrl(origin, path)
}

/** Absolute URL on this app — for emails and other off-origin contexts. */
function appUrl(path = '/'): string {
	const origin =
		process.env.NEXT_PUBLIC_APP_URL ||
		fallbackOrigin('https://app.gut8erpro.de', 'http://localhost:3000')
	return joinUrl(origin, path)
}

/**
 * Narrow an untrusted `next`/`redirect` parameter down to a path on `origin`.
 *
 * Resolving against `origin` is what makes this safe: it collapses the shapes
 * that a bare string concatenation would let through — a protocol-relative
 * `//host/x`, an absolute URL on another origin, and a leading-dot value that
 * would otherwise *extend* our hostname into one the caller controls. Anything
 * that lands off-origin, or does not parse, falls back to `/`. The result
 * always starts with a single slash.
 */
function safeRedirectPath(next: string | null | undefined, origin: string): string {
	if (!next) return '/'
	try {
		const resolved = new URL(next, origin)
		if (resolved.origin !== new URL(origin).origin) return '/'
		return `${resolved.pathname}${resolved.search}${resolved.hash}`
	} catch {
		return '/'
	}
}

export { appUrl, marketingUrl, safeRedirectPath }
