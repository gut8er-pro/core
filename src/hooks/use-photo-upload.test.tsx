import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import de from '@/messages/de.json'
import { usePhotoUpload } from './use-photo-upload'
import { PhotoUploadError, uploadPhoto } from './use-photos'

/**
 * The upload banner is the one place an API refusal is painted straight onto the
 * screen, so the refusal crosses the wire as a code and is put into words here.
 */

const fetchMock = vi.fn()

function wrapper({ children }: { children: ReactNode }) {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
	return (
		<QueryClientProvider client={client}>
			<NextIntlClientProvider locale="de" messages={de}>
				{children}
			</NextIntlClientProvider>
		</QueryClientProvider>
	)
}

function file(name: string) {
	return new File(['x'], name, { type: 'image/jpeg' })
}

beforeEach(() => {
	vi.clearAllMocks()
	vi.stubGlobal('fetch', fetchMock)
})

describe('a refused upload', () => {
	it('reaches the client as a code, not as a sentence', async () => {
		fetchMock.mockResolvedValue({
			ok: false,
			json: async () => ({
				error: 'max_photos_exceeded',
				limit: 20,
				message: 'Maximum 20 photos per report',
			}),
		})

		const failure = await uploadPhoto('r1', { url: 'https://x/y.jpg', filename: 'y.jpg' }).catch(
			(err: unknown) => err,
		)

		expect(failure).toBeInstanceOf(PhotoUploadError)
		expect((failure as PhotoUploadError).code).toBe('max_photos_exceeded')
		expect((failure as PhotoUploadError).limit).toBe(20)
	})

	it('is shown to a German assessor in German', async () => {
		const { result } = renderHook(() => usePhotoUpload('r1'), { wrapper })

		await act(async () => {
			await result.current.uploadPhotos(
				'r1',
				Array.from({ length: 21 }, (_, i) => file(`IMG_${i}.jpg`)),
			)
		})

		expect(result.current.uploadState.error).toBe('Maximal 20 Fotos pro Gutachten.')
		expect(fetchMock).not.toHaveBeenCalled()
	})
})
