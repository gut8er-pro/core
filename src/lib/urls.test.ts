import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { appUrl, marketingUrl, safeRedirectPath } from './urls'

afterEach(() => {
	vi.unstubAllEnvs()
})

describe('marketingUrl', () => {
	beforeEach(() => {
		vi.stubEnv('NEXT_PUBLIC_MARKETING_URL', 'https://gut8erpro.de')
	})

	it('returns the marketing origin for the home page', () => {
		expect(marketingUrl()).toBe('https://gut8erpro.de/')
	})

	it('appends a path', () => {
		expect(marketingUrl('/legal/impressum')).toBe('https://gut8erpro.de/legal/impressum')
	})

	it('does not double the slash when the origin has a trailing slash', () => {
		vi.stubEnv('NEXT_PUBLIC_MARKETING_URL', 'https://gut8erpro.de/')
		expect(marketingUrl('/legal/agb')).toBe('https://gut8erpro.de/legal/agb')
	})

	it('normalises a path given without a leading slash', () => {
		expect(marketingUrl('legal/widerruf')).toBe('https://gut8erpro.de/legal/widerruf')
	})
})

describe('appUrl', () => {
	beforeEach(() => {
		vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.gut8erpro.de')
	})

	it('returns the app origin for the dashboard root', () => {
		expect(appUrl()).toBe('https://app.gut8erpro.de/')
	})

	it('appends a path', () => {
		expect(appUrl('/login')).toBe('https://app.gut8erpro.de/login')
	})
})

// appUrl() builds links inside outbound email, so an unset variable in production
// must not produce localhost links — see the fallback note in urls.ts.
describe('fallbacks when the env var is unset', () => {
	beforeEach(() => {
		vi.stubEnv('NEXT_PUBLIC_MARKETING_URL', '')
		vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
	})

	it('uses localhost outside production', () => {
		vi.stubEnv('NODE_ENV', 'development')
		expect(appUrl('/login')).toBe('http://localhost:3000/login')
		expect(marketingUrl()).toBe('http://localhost:4321/')
	})

	it('uses the production domains in production', () => {
		vi.stubEnv('NODE_ENV', 'production')
		expect(appUrl('/login')).toBe('https://app.gut8erpro.de/login')
		expect(marketingUrl()).toBe('https://gut8erpro.de/')
	})
})

describe('safeRedirectPath', () => {
	const origin = 'https://app.gut8erpro.de'

	it('keeps a plain path', () => {
		expect(safeRedirectPath('/reset-password', origin)).toBe('/reset-password')
	})

	it('keeps the query string and hash', () => {
		expect(safeRedirectPath('/reports?page=2#top', origin)).toBe('/reports?page=2#top')
	})

	it('falls back to the root for a missing value', () => {
		expect(safeRedirectPath(null, origin)).toBe('/')
		expect(safeRedirectPath('', origin)).toBe('/')
	})

	it('rejects a same-host URL on a different scheme or port', () => {
		expect(safeRedirectPath('http://app.gut8erpro.de/x', origin)).toBe('/')
		expect(safeRedirectPath('https://app.gut8erpro.de:8443/x', origin)).toBe('/')
	})

	it('keeps a same-origin absolute URL as a path', () => {
		expect(safeRedirectPath(`${origin}/settings/billing`, origin)).toBe('/settings/billing')
	})
})
