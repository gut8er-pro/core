import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { ToastContainer } from '@/components/ui/toast'
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <ToastContainer />
      </body>
    </html>
  )
}
