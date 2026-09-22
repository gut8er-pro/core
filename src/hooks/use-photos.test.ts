import { describe, expect, it } from 'vitest'
import type { Photo } from './use-photos'
import { reorderPhotos } from './use-photos'

/**
 * The drop and the persisted write have to agree on the new order, so the
 * mapping is a pure function the optimistic UI and the request body share.
 */

function photo(id: string, order: number): Photo {
	return {
		id,
		reportId: 'r1',
		url: `https://example.com/${id}.jpg`,
		thumbnailUrl: null,
		previewUrl: null,
		aiUrl: null,
		annotatedUrl: null,
		filename: `${id}.jpg`,
		type: null,
		aiClassification: null,
		aiDescription: null,
		order,
		uploadedAt: '2026-09-22T00:00:00Z',
		annotations: [],
	}
}

const photos = ['a', 'b', 'c', 'd'].map((id, index) => photo(id, index))

describe('reorderPhotos', () => {
	it('moves a photo forward and renumbers every position', () => {
		const next = reorderPhotos(photos, 'a', 'c')

		expect(next.map((p) => p.id)).toEqual(['b', 'c', 'a', 'd'])
		expect(next.map((p) => p.order)).toEqual([0, 1, 2, 3])
	})

	it('moves a photo backward', () => {
		const next = reorderPhotos(photos, 'd', 'b')

		expect(next.map((p) => p.id)).toEqual(['a', 'd', 'b', 'c'])
		expect(next.map((p) => p.order)).toEqual([0, 1, 2, 3])
	})

	it('keeps every photo exactly once', () => {
		const next = reorderPhotos(photos, 'c', 'a')

		expect(next).toHaveLength(photos.length)
		expect(new Set(next.map((p) => p.id)).size).toBe(photos.length)
	})

	it('returns the same list when the drop lands where it started', () => {
		expect(reorderPhotos(photos, 'b', 'b')).toBe(photos)
	})

	it('returns the same list when an id is unknown', () => {
		expect(reorderPhotos(photos, 'a', 'missing')).toBe(photos)
		expect(reorderPhotos(photos, 'missing', 'a')).toBe(photos)
	})

	it('leaves the input untouched', () => {
		reorderPhotos(photos, 'a', 'd')

		expect(photos.map((p) => p.id)).toEqual(['a', 'b', 'c', 'd'])
		expect(photos.map((p) => p.order)).toEqual([0, 1, 2, 3])
	})
})
