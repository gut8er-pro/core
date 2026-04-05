import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'
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

export default withBundleAnalyzer(withNextIntl(nextConfig))
