import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { RecoveryRedirect } from '@/components/auth/recovery-redirect'
import { ToastContainer } from '@/components/ui/toast'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({
	subsets: ['latin'],
	variable: '--font-inter',
})

// The marketing copy and its brand keywords belong to the Astro site on the
// apex. This origin is the app, and it stays out of search entirely — see
// `robots.ts` for the crawler-level half of the same decision.
export const metadata: Metadata = {
	title: 'Gut8erPRO',
	description: 'Vehicle damage assessment workspace for Kfz-Sachverständige.',
	robots: { index: false, follow: false },
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const locale = await getLocale()
	const messages = await getMessages()

	return (
		<html lang={locale} suppressHydrationWarning>
			<body className={`${inter.variable} font-sans antialiased`}>
				<NextIntlClientProvider locale={locale} messages={messages}>
					{/* Must sit above every route: an implicit recovery link lands on whichever
					    page the Supabase Site URL names, not on a route of our choosing. */}
					<RecoveryRedirect />
					<Providers>{children}</Providers>
				</NextIntlClientProvider>
				<ToastContainer />
			</body>
		</html>
	)
}
