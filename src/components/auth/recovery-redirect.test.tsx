import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@/test/test-utils'

const RECOVERY_FRAGMENT =
	'#access_token=header.payload.signature&expires_in=3600&refresh_token=abc123&token_type=bearer&type=recovery'

let replace: ReturnType<typeof vi.fn>

/**
 * The component reads the fragment at module scope, so each case has to put the URL in
 * place *before* importing it — hence `resetModules` and the dynamic import. jsdom's own
 * `location.replace` is non-configurable, so the whole object is stubbed.
 */
async function renderAt(url: string) {
	const parsed = new URL(url, 'http://localhost:3000')
	vi.stubGlobal('location', { pathname: parsed.pathname, hash: parsed.hash, replace })
	vi.resetModules()
	const { RecoveryRedirect } = await import('./recovery-redirect')
	render(<RecoveryRedirect />)
}

beforeEach(() => {
	replace = vi.fn()
})

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('RecoveryRedirect', () => {
	it('sends a recovery fragment to the reset page, fragment intact', async () => {
		await renderAt(`/login${RECOVERY_FRAGMENT}`)
		expect(replace).toHaveBeenCalledWith(`/reset-password${RECOVERY_FRAGMENT}`)
	})

	// Middleware bounces an auth-gated route to /login and the browser re-attaches the
	// fragment, but a link can also land on the root directly.
	it('works from the root as well as from /login', async () => {
		await renderAt(`/${RECOVERY_FRAGMENT}`)
		expect(replace).toHaveBeenCalledWith(`/reset-password${RECOVERY_FRAGMENT}`)
	})

	it('sends an expired-link error to the reset page, where a new link can be requested', async () => {
		const fragment = '#error=access_denied&error_code=otp_expired&error_description=Email+link'
		await renderAt(`/login${fragment}`)
		expect(replace).toHaveBeenCalledWith(`/reset-password${fragment}`)
	})

	it('does not bounce a link that already landed on the reset page', async () => {
		await renderAt(`/reset-password${RECOVERY_FRAGMENT}`)
		expect(replace).not.toHaveBeenCalled()
	})

	it('leaves fragments that are not recovery links alone', async () => {
		await renderAt('/login#section=pricing')
		expect(replace).not.toHaveBeenCalled()
	})

	it('does nothing without a fragment', async () => {
		await renderAt('/login')
		expect(replace).not.toHaveBeenCalled()
	})
})
