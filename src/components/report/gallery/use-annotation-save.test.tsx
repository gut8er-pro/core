import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { countObjects, useAnnotationSave } from './use-annotation-save'

vi.mock('@/lib/storage/photos', () => ({
	getStoragePath: (reportId: string, photoId: string, variant: string) =>
		`reports/${reportId}/photos/${photoId}/${variant}.jpg`,
	uploadToStorage: vi.fn(async () => 'https://storage.test/annotated.jpg'),
}))

const REPORT_ID = 'report-1'
const PHOTO_ID = 'photo-1'

function wrapper({ children }: { children: ReactNode }) {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false, gcTime: 0 } },
	})
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function jsonWith(objectCount: number) {
	return {
		version: '7.1.0',
		objects: Array.from({ length: objectCount }, () => ({ type: 'Rect' })),
	}
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
	fetchMock = vi.fn(async (input: RequestInfo | URL) => {
		if (typeof input === 'string' && input.startsWith('data:')) {
			return new Response(new Blob(['x'], { type: 'image/jpeg' }))
		}
		return new Response(JSON.stringify({ photo: {} }), { status: 200 })
	})
	vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
	vi.unstubAllGlobals()
	vi.clearAllMocks()
})

describe('countObjects', () => {
	it('counts the fabric objects', () => {
		expect(countObjects(jsonWith(3))).toBe(3)
	})

	it('treats a canvas with no objects array as empty', () => {
		expect(countObjects({ version: '7.1.0' })).toBe(0)
	})
})

describe('useAnnotationSave', () => {
	it('reports success only after the PATCH resolves', async () => {
		const { result } = renderHook(() => useAnnotationSave(REPORT_ID), { wrapper })

		expect(result.current.status).toBe('idle')

		let resolved: boolean | undefined
		await act(async () => {
			resolved = await result.current.save({
				photoId: PHOTO_ID,
				fabricJson: jsonWith(1),
				dataUrl: 'data:image/jpeg;base64,AAA',
			})
		})

		expect(resolved).toBe(true)
		await waitFor(() => expect(result.current.status).toBe('saved'))

		const patchCall = fetchMock.mock.calls.find(
			([url, init]) =>
				typeof url === 'string' && (init as RequestInit | undefined)?.method === 'PATCH',
		)
		expect(patchCall?.[0]).toBe(`/api/reports/${REPORT_ID}/photos/${PHOTO_ID}`)
		const body = JSON.parse((patchCall?.[1] as RequestInit).body as string)
		expect(body.annotations).toHaveLength(1)
		expect(body.annotations[0].fabricJson.objects).toHaveLength(1)
		expect(body.annotatedUrl).toBe('https://storage.test/annotated.jpg')
	})

	it('surfaces a locked report instead of failing silently', async () => {
		fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
			if (typeof input === 'string' && input.startsWith('data:')) {
				return new Response(new Blob(['x']))
			}
			return new Response(JSON.stringify({ error: 'Report is locked' }), { status: 403 })
		})

		const { result } = renderHook(() => useAnnotationSave(REPORT_ID), { wrapper })

		let resolved: boolean | undefined
		await act(async () => {
			resolved = await result.current.save({
				photoId: PHOTO_ID,
				fabricJson: jsonWith(1),
				dataUrl: 'data:image/jpeg;base64,AAA',
			})
		})

		expect(resolved).toBe(false)
		await waitFor(() => expect(result.current.status).toBe('locked'))
	})

	it('surfaces a server failure', async () => {
		fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
			if (typeof input === 'string' && input.startsWith('data:')) {
				return new Response(new Blob(['x']))
			}
			return new Response('boom', { status: 500 })
		})

		const { result } = renderHook(() => useAnnotationSave(REPORT_ID), { wrapper })

		let resolved: boolean | undefined
		await act(async () => {
			resolved = await result.current.save({
				photoId: PHOTO_ID,
				fabricJson: jsonWith(1),
				dataUrl: 'data:image/jpeg;base64,AAA',
			})
		})

		expect(resolved).toBe(false)
		await waitFor(() => expect(result.current.status).toBe('error'))
	})

	it('surfaces a thrown upload', async () => {
		const { uploadToStorage } = await import('@/lib/storage/photos')
		vi.mocked(uploadToStorage).mockRejectedValueOnce(new Error('offline'))

		const { result } = renderHook(() => useAnnotationSave(REPORT_ID), { wrapper })

		let resolved: boolean | undefined
		await act(async () => {
			resolved = await result.current.save({
				photoId: PHOTO_ID,
				fabricJson: jsonWith(1),
				dataUrl: 'data:image/jpeg;base64,AAA',
			})
		})

		expect(resolved).toBe(false)
		await waitFor(() => expect(result.current.status).toBe('error'))
	})

	it('clears the stored markings and the rendered image when the canvas is emptied', async () => {
		const { result } = renderHook(() => useAnnotationSave(REPORT_ID), { wrapper })

		await act(async () => {
			await result.current.save({
				photoId: PHOTO_ID,
				fabricJson: jsonWith(0),
				dataUrl: null,
			})
		})

		const patchCall = fetchMock.mock.calls.find(
			([, init]) => (init as RequestInit | undefined)?.method === 'PATCH',
		)
		const body = JSON.parse((patchCall?.[1] as RequestInit).body as string)
		expect(body.annotations).toEqual([])
		expect(body.annotatedUrl).toBeNull()
	})

	it('never uploads a rendered image for an empty canvas', async () => {
		const { uploadToStorage } = await import('@/lib/storage/photos')
		const { result } = renderHook(() => useAnnotationSave(REPORT_ID), { wrapper })

		await act(async () => {
			await result.current.save({
				photoId: PHOTO_ID,
				fabricJson: jsonWith(0),
				dataUrl: 'data:image/jpeg;base64,AAA',
			})
		})

		expect(uploadToStorage).not.toHaveBeenCalled()
	})
})
