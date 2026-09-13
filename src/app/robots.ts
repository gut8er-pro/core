import type { MetadataRoute } from 'next'

/**
 * This origin is the dashboard app, not the marketing surface (ADR 0001).
 *
 * A few routes here are public — `/login`, `/signup/*`, `/help` — and they
 * would otherwise be indexed under the same brand title as the Astro site on
 * the apex, competing with the very pages the split exists to rank. Nothing on
 * `app.` is meant to be found in search, so the whole origin opts out.
 *
 * Next requires a default export for this file convention.
 */
export default function robots(): MetadataRoute.Robots {
	return {
		rules: [{ userAgent: '*', disallow: '/' }],
	}
}
