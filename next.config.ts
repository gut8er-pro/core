import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'
import { withSentryConfig } from '@sentry/nextjs'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const withBundleAnalyzer = bundleAnalyzer({
	enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '*.supabase.co',
				pathname: '/storage/v1/object/public/**',
			},
		],
	},
}

const composed = withBundleAnalyzer(withNextIntl(nextConfig))

// Only wrap with Sentry when a DSN + auth token are provided, so local dev
// without Sentry creds stays a no-op.
export default process.env.SENTRY_AUTH_TOKEN
	? withSentryConfig(composed, {
			silent: true,
			disableLogger: true,
			tunnelRoute: '/monitoring',
		})
	: composed
