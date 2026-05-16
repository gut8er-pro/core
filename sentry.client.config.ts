import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
	Sentry.init({
		dsn,
		environment: process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')
			? 'development'
			: 'production',
		tracesSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
		replaysSessionSampleRate: 0,
	})
}
