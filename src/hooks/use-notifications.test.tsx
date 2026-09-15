import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import de from '@/messages/de.json'
import en from '@/messages/en.json'
import { useNotifications } from './use-notifications'

/**
 * A stored notification carries a message key and its parameters. Everything a
 * German assessor reads is decided here, because the route that wrote the row
 * had no idea what language they read in.
 */

const MESSAGES = { de, en }

const fetchMock = vi.fn()

function wrapperFor(locale: 'de' | 'en') {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
	return function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={client}>
				<NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
					{children}
				</NextIntlClientProvider>
			</QueryClientProvider>
		)
	}
}

function respondWith(notifications: unknown[]) {
	fetchMock.mockResolvedValue({
		ok: true,
		json: async () => ({ notifications, unreadCount: 0 }),
	})
}

const AN_HOUR_AGO = new Date(Date.now() - 60 * 60 * 1000).toISOString()

beforeEach(() => {
	vi.clearAllMocks()
	vi.stubGlobal('fetch', fetchMock)
})

describe('useNotifications', () => {
	it('puts a stored key and its parameters into German', async () => {
		respondWith([
			{
				id: 'n1',
				eventType: 'REPORT_SENT',
				title: 'reportSent',
				description: JSON.stringify({
					title: 'Gutachten 2026-001',
					recipient: 'kunde@example.com',
				}),
				reportId: 'r1',
				isRead: false,
				createdAt: AN_HOUR_AGO,
			},
		])

		const { result } = renderHook(() => useNotifications(), { wrapper: wrapperFor('de') })

		await waitFor(() => expect(result.current.notifications).toHaveLength(1))
		const notification = result.current.notifications[0]
		expect(notification?.title).toBe('Gutachten versendet')
		expect(notification?.description).toBe(
			'Das Gutachten „Gutachten 2026-001“ wurde an kunde@example.com gesendet.',
		)
	})

	it('puts the same row into English', async () => {
		respondWith([
			{
				id: 'n1',
				eventType: 'INVOICE_GENERATED',
				title: 'invoiceGenerated',
				description: JSON.stringify({ invoiceNumber: 'RE-2026-014' }),
				reportId: 'r1',
				isRead: false,
				createdAt: AN_HOUR_AGO,
			},
		])

		const { result } = renderHook(() => useNotifications(), { wrapper: wrapperFor('en') })

		await waitFor(() => expect(result.current.notifications).toHaveLength(1))
		expect(result.current.notifications[0]?.description).toBe(
			'Invoice RE-2026-014 has been generated.',
		)
	})

	it('still renders rows written before notifications carried a key', async () => {
		respondWith([
			{
				id: 'legacy',
				eventType: 'REPORT_COMPLETED',
				title: 'Report Completed',
				description: 'Report "Gutachten 2025-900" has been marked as completed.',
				reportId: 'r1',
				isRead: true,
				createdAt: AN_HOUR_AGO,
			},
		])

		const { result } = renderHook(() => useNotifications(), { wrapper: wrapperFor('de') })

		await waitFor(() => expect(result.current.notifications).toHaveLength(1))
		expect(result.current.notifications[0]?.title).toBe('Report Completed')
		expect(result.current.notifications[0]?.description).toBe(
			'Report "Gutachten 2025-900" has been marked as completed.',
		)
	})

	it('dates the row in the reader’s language', async () => {
		respondWith([
			{
				id: 'n1',
				eventType: 'REPORT_SENT',
				title: 'reportSent',
				description: JSON.stringify({ title: 'G', recipient: 'a@b.de' }),
				reportId: null,
				isRead: false,
				createdAt: AN_HOUR_AGO,
			},
		])

		const { result } = renderHook(() => useNotifications(), { wrapper: wrapperFor('de') })

		await waitFor(() => expect(result.current.notifications).toHaveLength(1))
		expect(result.current.notifications[0]?.relativeTime).toBe('vor etwa 1 Stunde')
	})
})
