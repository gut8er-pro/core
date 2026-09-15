import * as Sentry from '@sentry/nextjs'

async function register() {
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		await import('./sentry.server.config')
	}

	if (process.env.NEXT_RUNTIME === 'edge') {
		await import('./sentry.edge.config')
	}
}

// Without this, an error thrown in a route handler or a server component is
// swallowed by Next's own error boundary and never reaches Sentry.
const onRequestError = Sentry.captureRequestError

export { onRequestError, register }
