import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_FILE_SIZE } from '@/lib/validations/photos'
import de from '@/messages/de.json'
import { usePhotoUpload } from './use-photo-upload'
import { PhotoUploadError, uploadPhoto } from './use-photos'

const compressImageMock = vi.fn()
const uploadToStorageMock = vi.fn()

vi.mock('@/lib/storage/photos', () => ({
	compressImage: (...args: unknown[]) => compressImageMock(...args),
	uploadToStorage: (...args: unknown[]) => uploadToStorageMock(...args),
	getStoragePath: () => 'reports/r1/photos/uuid/original.jpg',
}))

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

function file(name: string, type = 'image/jpeg') {
	return new File(['x'], name, { type })
}

function oversizedFile(name: string) {
	const big = file(name)
	Object.defineProperty(big, 'size', { value: MAX_FILE_SIZE + 1 })
	return big
}

beforeEach(() => {
	vi.clearAllMocks()
	vi.stubGlobal('fetch', fetchMock)
	vi.stubGlobal('crypto', { ...globalThis.crypto, randomUUID: () => 'uuid' })
	compressImageMock.mockResolvedValue(new Blob(['x']))
	uploadToStorageMock.mockResolvedValue('https://x/original.jpg')
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

		// The 21st file is over the cap before a request is made; the other 20 are
		// refused by the mocked server, so all 21 have to be accounted for.
		expect(result.current.uploadState.error).toContain('Maximal 20 Fotos pro Gutachten.')
		expect(result.current.uploadState.error?.split('\n')).toHaveLength(21)
		expect(result.current.uploadState.summary).toBe('0 von 21 hochgeladen — 21 fehlgeschlagen:')
	})
})

/**
 * A batch that half-works is the failure the client actually hit: photos went
 * missing and the screen said nothing. Every file that does not arrive has to be
 * named, and the count has to add up.
 */
describe('a partly failed batch', () => {
	it('names every skipped file and counts uploaded against failed', async () => {
		fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
			const body = JSON.parse(String(init?.body ?? '{}')) as { filename?: string }
			if (body.filename === 'rejected.jpg') {
				return { ok: false, json: async () => ({ error: 'Server said no' }) }
			}
			return { ok: true, json: async () => ({ photo: { id: 'p1' } }) }
		})

		compressImageMock.mockImplementation(async (f: File) => {
			if (f.name === 'corrupt.jpg') throw new Error('Failed to load image for compression')
			return new Blob(['x'])
		})

		const { result } = renderHook(() => usePhotoUpload('r1'), { wrapper })

		await act(async () => {
			await result.current.uploadPhotos('r1', [
				file('good-1.jpg'),
				file('corrupt.jpg'),
				oversizedFile('huge.jpg'),
				file('notes.pdf', 'application/pdf'),
				file('rejected.jpg'),
				file('good-2.jpg'),
			])
		})

		const errors = result.current.uploadState.error?.split('\n') ?? []

		expect(errors).toHaveLength(4)
		expect(errors[0]).toContain('corrupt.jpg')
		expect(errors[0]).toContain('beschädigt')
		expect(errors[1]).toContain('huge.jpg')
		expect(errors[2]).toContain('notes.pdf')
		expect(errors[3]).toContain('rejected.jpg')
		expect(result.current.uploadState.summary).toBe('2 von 6 hochgeladen — 4 fehlgeschlagen:')
	})

	it('counts photos already in the report against the cap', async () => {
		fetchMock.mockResolvedValue({ ok: true, json: async () => ({ photo: { id: 'p1' } }) })

		const { result } = renderHook(() => usePhotoUpload('r1'), { wrapper })

		await act(async () => {
			await result.current.uploadPhotos('r1', [file('a.jpg'), file('b.jpg'), file('c.jpg')], 18)
		})

		const errors = result.current.uploadState.error?.split('\n') ?? []

		expect(errors).toHaveLength(1)
		expect(errors[0]).toContain('c.jpg')
		expect(result.current.uploadState.summary).toBe('2 von 3 hochgeladen — 1 fehlgeschlagen:')
	})

	it('says so plainly when every file made it', async () => {
		fetchMock.mockResolvedValue({ ok: true, json: async () => ({ photo: { id: 'p1' } }) })

		const { result } = renderHook(() => usePhotoUpload('r1'), { wrapper })

		await act(async () => {
			await result.current.uploadPhotos('r1', [file('a.jpg'), file('b.jpg')])
		})

		expect(result.current.uploadState.error).toBeNull()
		expect(result.current.uploadState.summary).toBe('2 von 2 hochgeladen')
	})
})
