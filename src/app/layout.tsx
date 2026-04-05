import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ToastContainer } from '@/components/ui/toast'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({
	subsets: ['latin'],
	variable: '--font-inter',
})

export const metadata: Metadata = {
	title: 'Gut8erPRO - Professional Vehicle Assessment',
	description:
		'Create damage reports in minutes, not hours. Upload images, let AI do the work, and focus on what matters — your expertise.',
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
					<Providers>{children}</Providers>
				</NextIntlClientProvider>
				<ToastContainer />
			</body>
		</html>
	)
}
